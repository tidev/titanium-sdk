/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_PLATFORM

#import "PlatformModule.h"
#import "IPAddress.h"
#include <sys/sysctl.h>  
#include <mach/mach.h>
#import <sys/utsname.h>
#import "TitaniumInvocationGenerator.h"

@implementation PlatformModule

- (NSString *) createUUID;
{
	CFUUIDRef resultID = CFUUIDCreate(NULL);
	NSString * resultString = (NSString *) CFUUIDCreateString(NULL, resultID);
	CFRelease(resultID);
	return [resultString autorelease];
}

- (NSNumber*) availableMemory;
{
	vm_statistics_data_t vmStats;
	mach_msg_type_number_t infoCount = HOST_VM_INFO_COUNT;
	kern_return_t kernReturn = host_statistics(mach_host_self(), HOST_VM_INFO, (host_info_t)&vmStats, &infoCount);
	
	if (kernReturn != KERN_SUCCESS) {
		return [NSNumber numberWithDouble:-1];
	}
	
	return [NSNumber numberWithDouble:((vm_page_size * vmStats.free_count) / 1024.0) / 1024.0];
}

- (NSNumber *) openURL: (NSString *) newUrlString;
{
	NSURL * newUrl = [NSURL URLWithString:newUrlString];
	BOOL result = NO;
	if (newUrl != nil){
		result = [[TitaniumAppDelegate sharedDelegate] shouldTakeCareOfUrl:newUrl useSystemBrowser:YES prompt:NO];
	}
	
	return [NSNumber numberWithBool:result];
}

- (BOOL)isDevicePortrait
{
	UIDeviceOrientation orientation = [UIDevice currentDevice].orientation;
	return  (orientation == UIDeviceOrientationPortrait || 
			 orientation == UIDeviceOrientationPortraitUpsideDown || 
			 orientation == UIDeviceOrientationUnknown);
}

- (NSNumber*) platformWidth
{
	if ([self isDevicePortrait])
	{
		return [NSNumber numberWithFloat:[[UIScreen mainScreen] bounds].size.width];	
	}
	else
	{
		return [NSNumber numberWithFloat:[[UIScreen mainScreen] bounds].size.height];	
	}
}

- (NSNumber*) platformHeight
{
	if ([self isDevicePortrait] == NO)
	{
		return [NSNumber numberWithFloat:[[UIScreen mainScreen] bounds].size.width];	
	}
	else
	{
		return [NSNumber numberWithFloat:[[UIScreen mainScreen] bounds].size.height];	
	}
}

- (void)configure
{
	NSString *deviceMac = nil; 
	NSString *deviceIP = nil;
	InitAddresses();
	GetIPAddresses();
	GetHWAddresses();
	
	for (int i=0; i<MAXADDRS; ++i)
	{ 
        static unsigned long localHost = 0x7F000001;            // 127.0.0.1
        unsigned long theAddr;
		
        theAddr = ip_addrs[i];
		
        if (theAddr == 0) break;
        if (theAddr == localHost) continue;
		if (if_names[i] == NULL) continue;
		NSString *s = [NSString stringWithCString:if_names[i] encoding:NSUTF8StringEncoding];
		if ([s hasPrefix:@"lo"]) continue;
		// guard in case we don't have a mac or ipaddress which has been reported
		if (hw_addrs[i]!=NULL)
		{
			deviceMac = [NSString stringWithCString:hw_addrs[i] encoding:NSUTF8StringEncoding];
		}
		else
		{
			deviceMac = @"0-0-0-0";
		}
		if (ip_names[i]!=NULL)
		{
			deviceIP = [NSString stringWithCString:ip_names[i] encoding:NSUTF8StringEncoding];
		}
		else 
		{
			deviceIP = @"0.0.0.0";
		}

		break;
	}
	
	UIDevice * theDevice = [UIDevice currentDevice];
	
	NSString *model = [theDevice model];
	
	// attempt to determine extended phone info
	struct utsname u;
	uname(&u);
	
	NSString *arch = @"arm";
	
	// detect iPhone 3G model
	if (!strcmp(u.machine, "iPhone1,2")) 
	{
		model = [NSString stringWithFormat:@"%@ 3G",model];
	}
	// detect iPhone 3Gs model
	else if (!strcmp(u.machine, "iPhone2,1")) 
	{
		model = [NSString stringWithFormat:@"%@ 3GS",model];
	}
	// detect iPod Touch 2G model
	else if (!strcmp(u.machine, "iPod2,1")) 
	{
		model = [NSString stringWithFormat:@"%@ 2G",model];
	}
	// detect simulator
	else if (!strcmp(u.machine, "i386")) 
	{
		model = @"Simulator";
		arch = @"i386";
	}
	
	[self bindProperty:@"name" value:[theDevice systemName]];
	[self bindProperty:@"model" value:model];
	[self bindProperty:@"version" value:[theDevice systemVersion]];
	[self bindProperty:@"architecture" value:arch];
	[self bindProperty:@"macaddress" value:deviceMac];
	[self bindProperty:@"id" value:[theDevice uniqueIdentifier]];
	[self bindProperty:@"processorCount" value:[NSNumber numberWithInt:1]];
	[self bindProperty:@"username" value:[theDevice name]];
	[self bindProperty:@"address" value:deviceIP];
	[self bindProperty:@"ostype" value:@"32bit"];	
	[self bindAccessor:@"availableMemory" method:@selector(availableMemory)];
	[self bindFunction:@"createUUID" method:@selector(createUUID)];
	[self bindFunction:@"openURL" method:@selector(openURL:)];


	// needed for platform displayCaps orientation to be correct
	[[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
	
	TitaniumAccessorTuple * widthAccessor = [[[TitaniumAccessorTuple alloc] init] autorelease];
	[widthAccessor setGetterTarget:self];
	[widthAccessor setGetterSelector:@selector(platformWidth)];

	TitaniumAccessorTuple * heightAccessor = [[[TitaniumAccessorTuple alloc] init] autorelease];
	[heightAccessor setGetterTarget:self];
	[heightAccessor setGetterSelector:@selector(platformHeight)];

	
	// device capabilities currently are hardcoded since all current iphone
	// devices are the same (until the iTablet!)
    id jscode = [NSDictionary dictionaryWithObjectsAndKeys:
									 widthAccessor,@"width",
									 heightAccessor,@"height",
									 @"low",@"density",
									 [NSNumber numberWithInt:160],@"dpi",nil];
	[self bindProperty:@"displayCaps" value:jscode];
}

@end

#endif