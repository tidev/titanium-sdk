/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_NETWORK

#import "NetworkModule.h"
#import "Reachability.h"
#import "TiApp.h"
#import "SBJSON.h"
#import "TiBlob.h"
#import "TiNetworkSocketProxy.h"
#import "ASIHTTPRequest.h"

NSString* const INADDR_ANY_token = @"INADDR_ANY";

@implementation NetworkModule

-(NSString*)INADDR_ANY
{
    return INADDR_ANY_token;
}

-(NSNumber*)READ_MODE
{
    return [NSNumber numberWithInt:READ_MODE];
}

-(NSNumber*)WRITE_MODE
{
    return [NSNumber numberWithInt:WRITE_MODE];
}

-(NSNumber*)READ_WRITE_MODE
{
    return [NSNumber numberWithInt:READ_WRITE_MODE];
}

-(void)startReachability
{
	NSAssert([NSThread currentThread],@"not on the main thread for startReachability");
	// reachability runs on the current run loop so we need to make sure we're
	// on the main UI thread
	reachability = [[Reachability reachabilityForInternetConnection] retain];
    [reachability startNotifier];
	[self updateReachabilityStatus];
}

-(void)stopReachability
{
	NSAssert([NSThread currentThread],@"not on the main thread for stopReachability");
	[reachability stopNotifier];
	RELEASE_TO_NIL(reachability);
}

-(void)_configure
{
	[super _configure];
	// default to unknown network type on startup until reachability has figured it out
	state = TiNetworkConnectionStateUnknown; 
	WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(reachabilityChanged:) name:kReachabilityChangedNotification object:nil];
	// wait until done is important to get the right state
	TiThreadPerformOnMainThread(^{[self startReachability];}, YES);
}

-(void)_destroy
{
	TiThreadPerformOnMainThread(^{[self stopReachability];}, YES);
	WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
	[[NSNotificationCenter defaultCenter] removeObserver:self name:kReachabilityChangedNotification object:nil];
	RELEASE_TO_NIL(pushNotificationCallback);
	RELEASE_TO_NIL(pushNotificationError);
	RELEASE_TO_NIL(pushNotificationSuccess);
    [self forgetProxy:socketProxy];
    RELEASE_TO_NIL(socketProxy);
	[super _destroy];
}

-(void)updateReachabilityStatus
{
	NetworkStatus status = [reachability currentReachabilityStatus];
	switch(status)
	{
		case NotReachable:
		{
			state = TiNetworkConnectionStateNone;
			break;
		}
		case ReachableViaWiFi:
		{
			state = TiNetworkConnectionStateWifi;
			break;
		}
		case ReachableViaWWAN:
		{
			state = TiNetworkConnectionStateMobile;
			break;
		}
		default:
		{
			state = TiNetworkConnectionStateUnknown;
			break;
		}
	}
	if ([self _hasListeners:@"change"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:
							   [self networkType], @"networkType",
							   [self online], @"online",
							   [self networkTypeName], @"networkTypeName",
							   nil];
		[self fireEvent:@"change" withObject:event];
	}
}

-(void)reachabilityChanged:(NSNotification*)note
{
	[self updateReachabilityStatus];
}

-(id)encodeURIComponent:(id)args
{
	id arg = [args objectAtIndex:0];
	NSString *unencodedString = [TiUtils stringValue:arg];
	return [(NSString *)CFURLCreateStringByAddingPercentEscapes(NULL,
								(CFStringRef)unencodedString,
								NULL,
								(CFStringRef)@"!*'();:@+$,/?%#[]=&",
								kCFStringEncodingUTF8) autorelease];
}

-(id)decodeURIComponent:(id)args
{
	id arg = [args objectAtIndex:0];
	NSString *encodedString = [TiUtils stringValue:arg];
	return [(NSString *)CFURLCreateStringByReplacingPercentEscapesUsingEncoding(NULL, (CFStringRef)encodedString, CFSTR(""), kCFStringEncodingUTF8) autorelease];
}

// Socket submodule
#ifdef USE_TI_NETWORKSOCKET
-(TiProxy*)Socket
{
    if (socketProxy == nil) {
        socketProxy = [[TiNetworkSocketProxy alloc] _initWithPageContext:[self pageContext]];
        [self rememberProxy:socketProxy];
    }
    return socketProxy;
}
#endif

- (NSNumber*)online
{
	if (state!=TiNetworkConnectionStateNone && state!=TiNetworkConnectionStateUnknown)
	{
		return NUMBOOL(YES);
	}
	return NUMBOOL(NO);
}

- (NSString*)networkTypeName
{
	switch(state)
	{
		case TiNetworkConnectionStateNone:
			return @"NONE";
		case TiNetworkConnectionStateWifi:
			return @"WIFI";
		case TiNetworkConnectionStateLan:
			return @"LAN";
		case TiNetworkConnectionStateMobile:
			return @"MOBILE";
		default: {
			break;
		}
	}
	return @"UNKNOWN";
}

-(NSNumber*)networkType
{
	return NUMINT(state);
}

MAKE_SYSTEM_PROP(NETWORK_NONE,TiNetworkConnectionStateNone);
MAKE_SYSTEM_PROP(NETWORK_WIFI,TiNetworkConnectionStateWifi);
MAKE_SYSTEM_PROP(NETWORK_MOBILE,TiNetworkConnectionStateMobile);
MAKE_SYSTEM_PROP(NETWORK_LAN,TiNetworkConnectionStateLan);
MAKE_SYSTEM_PROP(NETWORK_UNKNOWN,TiNetworkConnectionStateUnknown);

MAKE_SYSTEM_PROP(NOTIFICATION_TYPE_BADGE,1);
MAKE_SYSTEM_PROP(NOTIFICATION_TYPE_ALERT,2);
MAKE_SYSTEM_PROP(NOTIFICATION_TYPE_SOUND,3);
MAKE_SYSTEM_PROP(NOTIFICATION_TYPE_NEWSSTAND, 4);

MAKE_SYSTEM_PROP(TLS_VERSION_1_0, TLS_VERSION_1_0);
MAKE_SYSTEM_PROP(TLS_VERSION_1_1, TLS_VERSION_1_1);
MAKE_SYSTEM_PROP(TLS_VERSION_1_2, TLS_VERSION_1_2);

#pragma mark Push Notifications 

- (NSString*) remoteDeviceUUID
{
	return [[TiApp app] remoteDeviceUUID];
}

- (NSNumber*)remoteNotificationsEnabled
{
	UIRemoteNotificationType types = [[UIApplication sharedApplication] enabledRemoteNotificationTypes];
	return NUMBOOL(types != UIRemoteNotificationTypeNone);
}

- (NSArray*)remoteNotificationTypes
{
	UIRemoteNotificationType types = [[UIApplication sharedApplication] enabledRemoteNotificationTypes];
	NSMutableArray *result = [NSMutableArray array];
	if ((types & UIRemoteNotificationTypeBadge)!=0)
	{
		[result addObject:NUMINT(1)];
	}
	if ((types & UIRemoteNotificationTypeAlert)!=0)
	{
		[result addObject:NUMINT(2)];
	}
	if ((types & UIRemoteNotificationTypeSound)!=0)
	{
		[result addObject:NUMINT(3)];
	}
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_5_0
	if ([TiUtils isIOS5OrGreater] && (types & UIRemoteNotificationTypeNewsstandContentAvailability)!=0)
	{
		[result addObject:NUMINT(4)];
	}
#endif
	return result;
}

-(void)registerForPushNotifications:(id)args
{
	ENSURE_SINGLE_ARG(args,NSDictionary);
	
	UIApplication * app = [UIApplication sharedApplication];
	UIRemoteNotificationType ourNotifications = [app enabledRemoteNotificationTypes];
	
	NSArray *typesRequested = [args objectForKey:@"types"];
	
	RELEASE_TO_NIL(pushNotificationCallback);
	RELEASE_TO_NIL(pushNotificationError);
	RELEASE_TO_NIL(pushNotificationSuccess);
	
	pushNotificationSuccess = [[args objectForKey:@"success"] retain];
	pushNotificationError = [[args objectForKey:@"error"] retain];
	pushNotificationCallback = [[args objectForKey:@"callback"] retain];
	
	if (typesRequested!=nil)
	{
		for (id thisTypeRequested in typesRequested) 
		{
			NSInteger value = [TiUtils intValue:thisTypeRequested];
			switch(value)
			{
				case 1: //NOTIFICATION_TYPE_BADGE
				{
					ourNotifications |= UIRemoteNotificationTypeBadge;
					break;
				}
				case 2: //NOTIFICATION_TYPE_ALERT
				{
					ourNotifications |= UIRemoteNotificationTypeAlert;
					break;
				}
				case 3: //NOTIFICATION_TYPE_SOUND
				{
					ourNotifications |= UIRemoteNotificationTypeSound;
					break;
				}
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_5_0
        case 4: // NOTIFICATION_TYPE_NEWSSTAND
        {
          if([TiUtils isIOS5OrGreater])
          {
            ourNotifications |= UIRemoteNotificationTypeNewsstandContentAvailability;
          }
          break;
        }
#endif
			}
		}
	}
	
	[[TiApp app] setRemoteNotificationDelegate:self];
	[app registerForRemoteNotificationTypes:ourNotifications];
	
	// check to see upon registration if we were started with a push 
	// notification and if so, go ahead and trigger our callback
	id currentNotification = [[TiApp app] remoteNotification];
	if (currentNotification!=nil && pushNotificationCallback!=nil)
	{
		id event = [NSDictionary dictionaryWithObject:currentNotification forKey:@"data"];
		[self _fireEventToListener:@"remote" withObject:event listener:pushNotificationCallback thisObject:nil];
	}
}

-(void)unregisterForPushNotifications:(id)args
{
	UIApplication * app = [UIApplication sharedApplication];
	[app unregisterForRemoteNotifications];
}

#pragma mark Push Notification Delegates

#ifdef USE_TI_NETWORKREGISTERFORPUSHNOTIFICATIONS

-(void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
	// called by TiApp
	if (pushNotificationSuccess!=nil)
	{
		NSString *token = [[[[deviceToken description] stringByReplacingOccurrencesOfString:@"<"withString:@""] 
							stringByReplacingOccurrencesOfString:@">" withString:@""] 
						   stringByReplacingOccurrencesOfString: @" " withString: @""];
		NSDictionary *event = [NSDictionary dictionaryWithObject:token forKey:@"deviceToken"];
		[self _fireEventToListener:@"remote" withObject:event listener:pushNotificationSuccess thisObject:nil];
	}
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
{
	// called by TiApp
	if (pushNotificationCallback!=nil)
	{
		id event = [NSDictionary dictionaryWithObject:userInfo forKey:@"data"];
		[self _fireEventToListener:@"remote" withObject:event listener:pushNotificationCallback thisObject:nil];
	}
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
	// called by TiApp
	if (pushNotificationError!=nil)
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:[error description] forKey:@"error"];
		[self _fireEventToListener:@"remote" withObject:event listener:pushNotificationError thisObject:nil];
	}
}

#endif

@end


#endif
