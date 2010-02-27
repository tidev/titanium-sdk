/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "NetworkModule.h"
#import "Reachability.h"
#import "TitaniumApp.h"

@implementation NetworkModule

-(id)init
{
	if (self = [super init])
	{
		[[Reachability reachabilityForInternetConnection] startNotifer];
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(reachabilityChanged:) name:@"kNetworkReachabilityChangedNotification" object:nil];
		[self updateReachabilityStatus];
	}
	return self;
}

-(void)dealloc
{
	[[NSNotificationCenter defaultCenter] removeObserver:self name:@"kNetworkReachabilityChangedNotification" object:nil];
	[super dealloc];
}

-(void)updateReachabilityStatus
{
	NetworkStatus status = [[Reachability reachabilityForInternetConnection] currentReachabilityStatus];
	switch(status)
	{
		case NotReachable:
		{
			state = NetworkModuleConnectionStateNone;
			break;
		}
		case ReachableViaWiFi:
		{
			state = NetworkModuleConnectionStateWifi;
			break;
		}
		case ReachableViaWWAN:
		{
			state = NetworkModuleConnectionStateMobile;
			break;
		}
		default:
		{
			state = NetworkModuleConnectionStateUnknown;
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
								(CFStringRef)@"!*'();:@+$,/?%#[]=", 
								kCFStringEncodingUTF8) autorelease];
}

-(id)decodeURIComponent:(id)args
{
	id arg = [args objectAtIndex:0];
	NSString *encodedString = [TiUtils stringValue:arg];
	return [(NSString *)CFURLCreateStringByReplacingPercentEscapesUsingEncoding(NULL, (CFStringRef)encodedString, CFSTR(""), kCFStringEncodingUTF8) autorelease];
}

-(void)addConnectivityListener:(id)args
{
	id arg = [args objectAtIndex:0];
	ENSURE_TYPE(arg,KrollCallback);
	NSArray *newargs = [NSArray arrayWithObjects:@"change",arg,nil];
	[self addEventListener:newargs];
}

-(void)removeConnectivityListener:(id)args
{
	id arg = [args objectAtIndex:0];
	ENSURE_TYPE(arg,KrollCallback);
	NSArray *newargs = [NSArray arrayWithObjects:@"change",arg,nil];
	[self removeEventListener:newargs];
}

- (NSString*) remoteDeviceUUID
{
	return [[TitaniumApp app] remoteDeviceUUID];
}

-(NSNumber*)online
{
	if (state!=NetworkModuleConnectionStateNone && state!=NetworkModuleConnectionStateUnknown)
	{
		return NUMBOOL(YES);
	}
	return NUMBOOL(NO);
}

-(NSString*)networkTypeName
{
	switch(state)
	{
		case NetworkModuleConnectionStateNone:
			return @"NONE";
		case NetworkModuleConnectionStateWifi:
			return @"WIFI";
		case NetworkModuleConnectionStateLan:
			return @"LAN";
		case NetworkModuleConnectionStateMobile:
			return @"MOBILE";
	}
	return @"UNKNOWN";
}

-(NSNumber*)networkType
{
	return NUMINT(state);
}

MAKE_SYSTEM_PROP(NETWORK_NONE,NetworkModuleConnectionStateNone);
MAKE_SYSTEM_PROP(NETWORK_WIFI,NetworkModuleConnectionStateWifi);
MAKE_SYSTEM_PROP(NETWORK_MOBILE,NetworkModuleConnectionStateMobile);
MAKE_SYSTEM_PROP(NETWORK_LAN,NetworkModuleConnectionStateLan);
MAKE_SYSTEM_PROP(NETWORK_UNKNOWN,NetworkModuleConnectionStateUnknown);

MAKE_SYSTEM_STR(NOTIFICATION_TYPE_BADGE,@"badge");
MAKE_SYSTEM_STR(NOTIFICATION_TYPE_ALERT,@"alert");
MAKE_SYSTEM_STR(NOTIFICATION_TYPE_SOUND,@"sound");


@end
