/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "PlatformModule.h"

#import "IPAddress.h"
#import <sys/sysctl.h>  
#import <mach/mach.h>
#import <sys/utsname.h>


@implementation PlatformModule

@synthesize name, model, version, architecture, macaddress, processorCount, username, address, ostype, availableMemory;

#pragma mark Internal

-(id)init
{
	if (self = [super init])
	{
		UIDevice *theDevice = [UIDevice currentDevice];
		name = [[theDevice systemName] retain];
		version = [[theDevice systemVersion] retain];
		processorCount = [[NSNumber numberWithInt:1] retain];
		username = [theDevice name];
		ostype = [@"32bit" retain];
		
#ifdef IPAD 	
		// ipad is a constant for Ti.Platform.osname
		[self replaceValue:@"ipad" forKey:@"osname" notification:NO];
#else
		// iphone is a constant for Ti.Platform.osname
		[self replaceValue:@"iphone" forKey:@"osname" notification:NO];
#endif
		
		//TODO: save CPU and RAM by moving these into dynamic properties
		
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
		
		address = [deviceIP retain];
		macaddress = [deviceMac	retain];
		
		NSString *themodel = [theDevice model];
		
		// attempt to determine extended phone info
		struct utsname u;
		uname(&u);
		
		NSString *arch = @"arm";
		
		// detect iPhone 3G model
		if (!strcmp(u.machine, "iPhone1,2")) 
		{
			model = [[NSString stringWithFormat:@"%@ 3G",themodel] retain];
		}
		// detect iPhone 3Gs model
		else if (!strcmp(u.machine, "iPhone2,1")) 
		{
			model = [[NSString stringWithFormat:@"%@ 3GS",themodel] retain];
		}
		// detect iPod Touch 2G model
		else if (!strcmp(u.machine, "iPod2,1")) 
		{
			model = [[NSString stringWithFormat:@"%@ 2G",themodel] retain];
		}
		// detect simulator
		else if (!strcmp(u.machine, "i386")) 
		{
			model = [@"Simulator" retain];
			arch = @"i386";
		}
		else 
		{
			model = [themodel retain];
		}
		architecture = [arch retain];

		// needed for platform displayCaps orientation to be correct
		[[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
	}
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(name);
	RELEASE_TO_NIL(model);
	RELEASE_TO_NIL(version);
	RELEASE_TO_NIL(architecture);
	RELEASE_TO_NIL(macaddress);
	RELEASE_TO_NIL(processorCount);
	RELEASE_TO_NIL(username);
	RELEASE_TO_NIL(address);
	RELEASE_TO_NIL(ostype);
	RELEASE_TO_NIL(availableMemory);
	RELEASE_TO_NIL(capabilities);
	[super dealloc];
}

-(void)_listenerAdded:(NSString *)type count:(int)count
{
	if (count == 1 && [type isEqualToString:@"battery"])
	{
		UIDevice *device = [UIDevice currentDevice];
		// set a flag to temporarily turn on battery enablement
		if (batteryEnabled==NO && device.batteryMonitoringEnabled==NO)
		{
			batteryEnabled = YES;
			[device setBatteryMonitoringEnabled:YES];
		}
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(batteryStateChanged:) name:UIDeviceBatteryStateDidChangeNotification object:device];
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(batteryStateChanged:) name:UIDeviceBatteryLevelDidChangeNotification object:device];
	}
}

-(void)_listenerRemoved:(NSString *)type count:(int)count
{
	if (count == 0 && [type isEqualToString:@"battery"])
	{
		UIDevice *device = [UIDevice currentDevice];
		if (batteryEnabled)
		{
			[device setBatteryMonitoringEnabled:NO];
		}
		[[NSNotificationCenter defaultCenter] removeObserver:self name:UIDeviceBatteryStateDidChangeNotification object:device];
		[[NSNotificationCenter defaultCenter] removeObserver:self name:UIDeviceBatteryLevelDidChangeNotification object:device];
	}
}

#pragma mark Public APIs

-(NSString*)locale
{
	// this will return the locale that the user has set the phone in
	// not the region where the phone is
	NSUserDefaults* defs = [NSUserDefaults standardUserDefaults];
	NSArray* languages = [defs objectForKey:@"AppleLanguages"];
	return [languages count] > 0 ? [languages objectAtIndex:0] : @"en";
}

-(id)id
{
	return [[UIDevice currentDevice] uniqueIdentifier];
}

- (NSString *)createUUID:(id)args
{
	CFUUIDRef resultID = CFUUIDCreate(NULL);
	NSString * resultString = (NSString *) CFUUIDCreateString(NULL, resultID);
	CFRelease(resultID);
	return [resultString autorelease];
}

- (NSNumber*)availableMemory
{
	vm_statistics_data_t vmStats;
	mach_msg_type_number_t infoCount = HOST_VM_INFO_COUNT;
	kern_return_t kernReturn = host_statistics(mach_host_self(), HOST_VM_INFO, (host_info_t)&vmStats, &infoCount);
	
	if (kernReturn != KERN_SUCCESS) {
		return [NSNumber numberWithDouble:-1];
	}
	
	return [NSNumber numberWithDouble:((vm_page_size * vmStats.free_count) / 1024.0) / 1024.0];
}

- (NSNumber *)openURL:(NSArray*)args
{
	NSString *newUrlString = [args objectAtIndex:0];
	NSURL * newUrl = [TiUtils toURL:newUrlString proxy:self];
	BOOL result = NO;
	if (newUrl != nil)
	{
		[[UIApplication sharedApplication] openURL:newUrl];
	}
	
	return [NSNumber numberWithBool:result];
}

-(PlatformModuleDisplayCapsProxy*)displayCaps
{
	if (capabilities == nil)
	{
		return [[[PlatformModuleDisplayCapsProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
	}
	return capabilities;
}

-(void)setBatteryMonitoring:(NSNumber *)yn
{
	[[UIDevice currentDevice] setBatteryMonitoringEnabled:[TiUtils boolValue:yn]];
}

-(NSNumber*)batteryMonitoring
{
	return NUMBOOL([UIDevice currentDevice].batteryMonitoringEnabled);
}

-(NSNumber*)batteryState
{
	return NUMINT([[UIDevice currentDevice] batteryState]);
}

-(NSNumber*)batteryLevel
{
	return NUMFLOAT([[UIDevice currentDevice] batteryLevel]);
}

MAKE_SYSTEM_PROP(BATTERY_STATE_UNKNOWN,UIDeviceBatteryStateUnknown);
MAKE_SYSTEM_PROP(BATTERY_STATE_UNPLUGGED,UIDeviceBatteryStateUnplugged);
MAKE_SYSTEM_PROP(BATTERY_STATE_CHARGING,UIDeviceBatteryStateCharging);
MAKE_SYSTEM_PROP(BATTERY_STATE_FULL,UIDeviceBatteryStateFull);

#pragma mark Delegates

-(void)batteryStateChanged:(NSNotification*)note
{
	NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:[self batteryState],@"state",[self batteryLevel],@"level",nil];
	[self fireEvent:@"battery" withObject:event];
}

-(void)didReceiveMemoryWarning:(NSNotification*)notification
{
	RELEASE_TO_NIL(capabilities);
	[super didReceiveMemoryWarning:notification];
}

@end
