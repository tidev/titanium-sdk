/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_APP

#import "AppModule.h"
#import "TiHost.h"
#import "SBJSON.h"
#import "ListenerEntry.h"
#import "TiApp.h"

extern NSString * const TI_APPLICATION_DEPLOYTYPE;
extern NSString * const TI_APPLICATION_ID;
extern NSString * const TI_APPLICATION_PUBLISHER;
extern NSString * const TI_APPLICATION_URL;
extern NSString * const TI_APPLICATION_NAME;
extern NSString * const TI_APPLICATION_VERSION;
extern NSString * const TI_APPLICATION_DESCRIPTION;
extern NSString * const TI_APPLICATION_COPYRIGHT;
extern NSString * const TI_APPLICATION_GUID;

@implementation AppModule

-(void)dealloc
{
	[appListeners removeAllObjects];
	RELEASE_TO_NIL(appListeners);
	RELEASE_TO_NIL(properties);
	[super dealloc];
}

-(void)addEventListener:(NSArray*)args
{
	NSString *type = [args objectAtIndex:0];
	id listener = [args objectAtIndex:1];
	
	if (appListeners==nil)
	{
		appListeners = [[NSMutableDictionary alloc] init];
	}
	
	id<TiEvaluator> context = [self executionContext]==nil ? [self pageContext] : [self executionContext];
	ListenerEntry *entry = [[ListenerEntry alloc] initWithListener:listener context:context proxy:self];

	
	if ([listener isKindOfClass:[KrollCallback class]])
	{
		((KrollCallback*)listener).type = type;
	}
	else 
	{
		entry.type = type;
	}

	
	NSMutableArray *l = [appListeners objectForKey:type];
	if (l==nil)
	{
		l = [[NSMutableArray alloc] init];
		[appListeners setObject:l forKey:type];
		[l release];
	}
	[l addObject:entry];
	[entry release];
}

-(void)removeEventListener:(NSArray*)args
{
	NSString *type = [args objectAtIndex:0];
	id listener = [args objectAtIndex:1];
	
	ListenerEntry *entry = nil;
	
	NSMutableArray *l = [appListeners objectForKey:type];

	BOOL needsScanning;
	do
	{
		needsScanning = NO;
		for (entry in l)	//The fast iteration is blindly fast when l is nil or count.
		{
			if ([listener isEqual:[entry listener]]) //NSNumber does the right thing with this too.
			{
				[l removeObject:entry];	//It's safe to modify the array as long as you break right after.
				needsScanning = [l count]>0;
				break;
			}
		}
	} while (needsScanning);
	
	if ([appListeners count]==0)
	{
		RELEASE_TO_NIL(appListeners);
	}
	
	[[self _host] removeListener:listener context:pageContext];
} 

-(BOOL)_hasListeners:(NSString *)type
{
	if (appListeners!=nil && [appListeners count] > 0)
	{
		NSArray *array = [appListeners objectForKey:type];
		
		if (array!=nil && [array count] > 0)
		{
			return YES;
		}
	}
	return NO;
}

-(void)fireEvent:(NSArray*)args
{
	if (appListeners!=nil)
	{
		id type = [args objectAtIndex:0];
		id obj = [args count] > 1 ? [args objectAtIndex:1] : nil;
		
#ifdef DEBUG
		NSLog(@"[DEBUG] fire app event: %@ with %@",type,obj);
#endif
		
		NSArray *array = [appListeners objectForKey:type];
		
		if (array!=nil && [array count] > 0)
		{
			NSMutableDictionary* eventObject = nil;
			if ([obj isKindOfClass:[NSDictionary class]])
			{
				eventObject = [NSMutableDictionary dictionaryWithDictionary:obj];
			}
			else 
			{
				eventObject = [NSMutableDictionary dictionary];
			}
			[eventObject setValue:type forKey:@"type"];
			// since this is cross context, we need to force into a JSON so the data can serialize
			// we first force to string json, then we convert the string JSON back to a dictionary to
			// eliminate any native things like functions, native objects, etc.
			SBJSON *json = [[SBJSON alloc] init];
			NSString *json_ = [SBJSON stringify:eventObject];
			id jsonObject = [json fragmentWithString:json_ error:nil];
			[json release];
			for (ListenerEntry *entry in array)
			{
				// fire application level event
				[host fireEvent:[entry listener] withObject:jsonObject remove:NO context:[entry context] thisObject:nil];
			}
		}
	}
}

-(void)fireEvent:(NSString*)type withObject:(id)obj
{
	[self fireEvent:[NSArray arrayWithObjects:type,obj,nil]];
}

-(TiAppPropertiesProxy*)Properties
{
	if (properties == nil)
	{
		properties = [[TiAppPropertiesProxy alloc] _initWithPageContext:[self pageContext]];
	}
	return properties;
}

-(void)setIdleTimerDisabled:(NSNumber*)value
{
	[UIApplication sharedApplication].idleTimerDisabled = [TiUtils boolValue:value];
}

-(NSNumber*)idleTimerDisabled
{
	return NUMBOOL([UIApplication sharedApplication].idleTimerDisabled);
}

-(NSNumber*)proximityState
{
	return NUMBOOL([UIDevice currentDevice].proximityState);
}

-(void)setProximityDetection:(NSNumber *)value
{
	BOOL yn = [TiUtils boolValue:value];
	[UIDevice currentDevice].proximityMonitoringEnabled = yn;
	WARN_IF_BACKGROUND_THREAD;	//NSNotificationCenter is not threadsafe!
	if (yn)
	{
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(proximityDetectionChanged:)
													 name:UIDeviceProximityStateDidChangeNotification
												   object:nil];
	}
	else 
	{
		[[NSNotificationCenter defaultCenter] removeObserver:self name:UIDeviceProximityStateDidChangeNotification object:nil];
	}
}

-(NSNumber*)proximityDetection
{
	return NUMBOOL([UIDevice currentDevice].proximityMonitoringEnabled);
}

#pragma mark Internal Memory Management

-(void)didReceiveMemoryWarning:(NSNotification*)notification
{
	RELEASE_TO_NIL(properties);
	[super didReceiveMemoryWarning:notification];
}

-(void)willShutdown:(id)sender;
{
	// fire the application close event when shutting down
	if ([self _hasListeners:@"close"])
	{
		[self fireEvent:@"close" withObject:nil];
	}
}

-(void)willShutdownContext:(NSNotification*)note
{
	// we have to check and see if this context has any listeners
	// that are registered at the global scope and that haven't been
	// removed and if so, we need to remove them since their context
	// is toast.
	if (appListeners!=nil)
	{
		NSMutableArray *found = [NSMutableArray array];
		id context = [note object];
		for (NSString *type in appListeners)
		{
			for (ListenerEntry *entry in [appListeners objectForKey:type])
			{
				if ([entry context] == context)
				{
					id listener = [entry listener];
					if ([listener isKindOfClass:[KrollCallback class]])
					{
						[found addObject:[NSArray
										  arrayWithObjects:((KrollCallback*)listener).type,listener,nil]];
					}
					else 
					{
						[found addObject:[NSArray
									   arrayWithObjects:[entry type],listener,nil]];
					}
				}
			}
		}
		if ([found count]>0)
		{
			for (NSArray *a in found)
			{
				[self removeEventListener:a];
			}
		}
	}
}

-(void)startup
{
	WARN_IF_BACKGROUND_THREAD;	//NSNotificationCenter is not threadsafe!
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(willShutdown:) name:kTiWillShutdownNotification object:nil];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(willShutdownContext:) name:kTiContextShutdownNotification object:nil];
	[super startup];
}

-(void)shutdown:(id)sender
{
	// make sure we force any changes made on shutdown
	[[NSUserDefaults standardUserDefaults] synchronize];
	WARN_IF_BACKGROUND_THREAD;	//NSNotificationCenter is not threadsafe!
	[[NSNotificationCenter defaultCenter] removeObserver:self];
	[super shutdown:sender];
}

-(void)suspend:(id)sender
{
	// make sure we force any changes made on suspend in case we don't come back
	[[NSUserDefaults standardUserDefaults] synchronize];
	
	if ([self _hasListeners:@"pause"])
	{
		[self fireEvent:@"pause" withObject:nil];
	}
}

-(void)resume:(id)sender
{
	if ([self _hasListeners:@"resume"])
	{
		[self fireEvent:@"resume" withObject:nil];
	}
}

#pragma mark Delegate stuff

-(void)proximityDetectionChanged:(NSNotification*)note
{
	if ([self _hasListeners:@"proximity"])
	{
		[self fireEvent:@"proximity" withObject:[NSDictionary dictionaryWithObject:[self proximityState] forKey:@"state"]];
	}
}

#pragma mark Public APIs

-(id)appURLToPath:(id)args
{
	ENSURE_SINGLE_ARG(args,NSString);
	if ([args hasPrefix:@"app://"])
	{
		args = [args stringByReplacingOccurrencesOfString:@"app://" withString:@""];
	}
	NSString *path = [[NSBundle mainBundle] resourcePath];
	return [NSString stringWithFormat:@"%@/%@",path,args];
}

-(id)arguments:(id)args
{
	return [[TiApp app] launchOptions];
}

-(id)iD
{
	return TI_APPLICATION_ID;
}

-(id)id
{
	return TI_APPLICATION_ID;
}

-(id)name
{
	return TI_APPLICATION_NAME;
}

-(id)version
{
	return TI_APPLICATION_VERSION;
}

-(id)publisher
{
	return TI_APPLICATION_PUBLISHER;
}

-(id)description
{
	return TI_APPLICATION_DESCRIPTION;
}

-(id)copyright
{
	return TI_APPLICATION_COPYRIGHT;
}

-(id)uRL
{
	return TI_APPLICATION_URL;
}

-(id)url
{
	return TI_APPLICATION_URL;
}

-(id)gUID
{
	return TI_APPLICATION_GUID;
}

-(id)guid
{
	return TI_APPLICATION_GUID;
}

@end

#endif