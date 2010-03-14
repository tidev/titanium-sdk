/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "NetworkModule.h"
#import "Reachability.h"

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
	RELEASE_TO_NIL(remoteDeviceUUID);
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
	//TODO: notifications, send device uuid
	return remoteDeviceUUID;
}

-(NSNumber*)online
{
	if (state!=NetworkModuleConnectionStateNone && state!=NetworkModuleConnectionStateUnknown)
	{
		return [NSNumber numberWithBool:YES];
	}
	return [NSNumber numberWithBool:NO];
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
	return [NSNumber numberWithInt:state];
}

-(NSNumber*)NETWORK_NONE
{
	return [NSNumber numberWithInt:NetworkModuleConnectionStateNone];
}

-(NSNumber*)NETWORK_WIFI
{
	return [NSNumber numberWithInt:NetworkModuleConnectionStateWifi];
}

-(NSNumber*)NETWORK_MOBILE
{
	return [NSNumber numberWithInt:NetworkModuleConnectionStateMobile];
}

-(NSNumber*)NETWORK_LAN
{
	return [NSNumber numberWithInt:NetworkModuleConnectionStateLan];
}

-(NSNumber*)NETWORK_UNKNOWN
{
	return [NSNumber numberWithInt:NetworkModuleConnectionStateUnknown];
}

@end
