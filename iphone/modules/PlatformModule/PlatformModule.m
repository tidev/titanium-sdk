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
		result = [[TitaniumAppDelegate sharedDelegate] shouldTakeCareOfUrl:newUrl useSystemBrowser:YES];
	}
	
	return [NSNumber numberWithBool:result];
}

#define VAL_OR_NSNULL(foo)	(((foo) != nil)?((id)foo):[NSNull null])

- (BOOL) startModule;
{
	TitaniumInvocationGenerator * openURLInvocGen = [TitaniumInvocationGenerator generatorWithTarget:self];
	[(PlatformModule *)openURLInvocGen openURL:nil];
	NSInvocation * openURLInvoc = [openURLInvocGen invocation];	

	NSInvocation * UUIDGenerator = [NSInvocation invocationWithMethodSignature:[self methodSignatureForSelector:@selector(createUUID)]];
	[UUIDGenerator setTarget:self];
	[UUIDGenerator setSelector:@selector(createUUID)];

	TitaniumAccessorTuple * memoryAccessor = [[[TitaniumAccessorTuple alloc] init] autorelease];
	[memoryAccessor setGetterTarget:self];
	[memoryAccessor setGetterSelector:@selector(availableMemory)];
	
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
		NSString *s = [NSString stringWithCString:if_names[i] encoding:NSUTF8StringEncoding];
		if ([s hasPrefix:@"lo"]) continue;
		deviceMac = [NSString stringWithCString:hw_addrs[i] encoding:NSUTF8StringEncoding];
		deviceIP = [NSString stringWithCString:ip_names[i] encoding:NSUTF8StringEncoding];
		break;
	}
	
	UIDevice * theDevice = [UIDevice currentDevice];
	
	NSString *model = [theDevice model];
	
	// attempt to determine extended phone info
	struct utsname u;
	uname(&u);
	
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
	}

	NSString * phoneNumber = [[NSUserDefaults standardUserDefaults] stringForKey:@"SBFormattedPhoneNumber"];
	if (strstr([model UTF8String],"Simulator"))
	{
		phoneNumber = @"1 (650) 867-5309"; // tommy says: call jenny
	}	
	
	NSDictionary * platformDict = [NSDictionary dictionaryWithObjectsAndKeys:
								   [theDevice systemName],@"name",
								   model,@"model",
								   [theDevice systemVersion],@"version",
								   @"arm",@"architecture",
								   VAL_OR_NSNULL(deviceMac),@"macaddress",
								   [theDevice uniqueIdentifier],@"id",
								   [NSNumber numberWithInt:1],@"processorCount",
								   [theDevice name],@"username",
								   UUIDGenerator,@"createUUID",
								   VAL_OR_NSNULL(deviceIP),@"address",
								   VAL_OR_NSNULL(phoneNumber),@"phoneNumber",
								   memoryAccessor,@"availableMemory",
								   openURLInvoc,@"openURL",
								   @"32bit",@"ostype",
									nil];
	[[[TitaniumHost sharedHost] titaniumObject] setObject:platformDict forKey:@"Platform"];
	
	return YES;
}

@end

#endif