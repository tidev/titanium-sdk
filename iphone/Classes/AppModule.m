/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "AppModule.h"
#import "TiHost.h"
#import "SBJSON.h"

@interface ListenerEntry : NSObject
{
	id<TiEvaluator> context;
	id listener;
	AppModule *module;
	NSString *type;
}
-(id)initWithListener:(id)listener_ context:(id<TiEvaluator>)context_ module:(AppModule*)module type:(NSString*)type;
-(id<TiEvaluator>)context;
-(id)listener;
@end

@implementation ListenerEntry

-(void)contextShutdown:(NSNotification*)note
{
	[[self retain] autorelease];
	[module removeEventListener:[NSArray arrayWithObjects:type,listener,nil]];
}

-(id)initWithListener:(id)listener_ context:(id<TiEvaluator>)context_ module:(AppModule*)module_ type:(NSString*)type_
{
	if (self = [super init])
	{
		assert(context_);
		listener = [listener_ retain];
		context = context_;// don't retain
		module = module_; // don't retain
		type = [type_ retain];
		// since a context can get shutdown while we're holding him.. we listener for shutdown events so we can automatically remove ourselves
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(contextShutdown:) name:kKrollShutdownNotification object:context];
	}
	return self;
}
-(void)dealloc
{
	[[NSNotificationCenter defaultCenter] removeObserver:self name:kKrollShutdownNotification object:context];
	RELEASE_TO_NIL(listener);
	RELEASE_TO_NIL(type);
	[super dealloc];
}
-(id<TiEvaluator>)context
{
	return context;
}
-(id)listener
{
	return listener;
}

@end


@implementation AppModule

-(id)init
{
	if (self = [super init])
	{
	}
	return self;
}

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
	
	NSMutableArray *l = [appListeners objectForKey:type];
	if (l==nil)
	{
		l = [[NSMutableArray alloc] init];
		[appListeners setObject:l forKey:type];
		[l release];
	}
	ListenerEntry *entry = [[ListenerEntry alloc] initWithListener:listener context:[self executionContext] module:self type:type];
	[l addObject:entry];
	[entry release];
}

-(void)removeEventListener:(NSArray*)args
{
	NSString *type = [args objectAtIndex:0];
	id listener = [args objectAtIndex:1];
	
	ListenerEntry *entry = nil;
	
	NSMutableArray *l = [appListeners objectForKey:type];
	if (l!=nil && [l count]>0)
	{
		// unfortunately we need to scan
		for (entry in [NSArray arrayWithArray:l])
		{
			if (listener == [entry listener] || (
				//XHR bridge users NSNumber for listeners
				 [listener isKindOfClass:[NSNumber class]] && 
				 [[entry listener] isKindOfClass:[NSNumber class]] && 
				 [listener intValue]==[[entry listener] intValue]
				))
			{
				[l removeObject:entry];
				break;
			}
		}
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
	id type = [args objectAtIndex:0];
	id obj = [args count] > 1 ? [args objectAtIndex:1] : nil;
	
#ifdef DEBUG	
	NSLog(@"[DEBUG] fire app event: %@ with %@",type,obj);
#endif
	
	if (appListeners!=nil && [appListeners count] > 0)
	{
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

-(void)shutdown:(id)sender
{
	// make sure we force any changes made on shutdown
	[[NSUserDefaults standardUserDefaults] synchronize];
	[super shutdown:sender];
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
	//FIXME
	return nil;
}

-(id)arguments:(id)args
{
	//FIXME
	return nil;
}

-(id)id:(id)args
{
	//FIXME - this will be compiled in
	return nil;
}

-(id)name:(id)args
{
	//FIXME - this will be compiled in
	return nil;
}

-(id)version:(id)args
{
	//FIXME - this will be compiled in
	return nil;
}

-(id)publisher:(id)args
{
	//FIXME - this will be compiled in
	return nil;
}

-(id)description:(id)args
{
	//FIXME - this will be compiled in
	return nil;
}

-(id)copyright:(id)args
{
	//FIXME - this will be compiled in
	return nil;
}

-(id)url:(id)args
{
	//FIXME - this will be compiled in
	return nil;
}

-(id)guid:(id)args
{
	//FIXME - this will be compiled in
	return nil;
}

@end
