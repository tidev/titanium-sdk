/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_PLATFORM

#import "TiModule.h"
#import "TiPlatformDisplayCaps.h"

@interface PlatformModule : TiModule 
{
	NSString *name;
	NSString *model;
	NSString *version;
	NSString *architecture;
	NSNumber *processorCount;
	NSString *username;
	NSString *address;
	NSString *ostype;
	NSNumber *availableMemory;
	TiPlatformDisplayCaps *capabilities;
	BOOL batteryEnabled;
}

@property(readonly,nonatomic) NSString *id;
@property(readonly,nonatomic) NSString *name;
@property(readonly,nonatomic) NSString *model;
@property(readonly,nonatomic) NSString *version;
@property(readonly,nonatomic) NSString *architecture;
@property(readonly,nonatomic) NSString *manufacturer;
@property(readonly,nonatomic) NSString *macaddress;
@property(readonly,nonatomic) NSNumber *processorCount;
@property(readonly,nonatomic) NSString *username;
@property(readonly,nonatomic) NSString *address;
@property(readonly,nonatomic) NSString *ostype;
@property(readonly,nonatomic) NSNumber *availableMemory;
@property(readonly,nonatomic) TiPlatformDisplayCaps *displayCaps;
@property(readonly,nonatomic) NSNumber *batteryState;
@property(readonly,nonatomic) NSNumber *batteryLevel;
@property(readonly,nonatomic) NSString *locale;
@property(readwrite,nonatomic,assign) NSNumber *batteryMonitoring;

@property(readonly,nonatomic) NSNumber *BATTERY_STATE_UNKNOWN;
@property(readonly,nonatomic) NSNumber *BATTERY_STATE_UNPLUGGED;
@property(readonly,nonatomic) NSNumber *BATTERY_STATE_CHARGING;
@property(readonly,nonatomic) NSNumber *BATTERY_STATE_FULL;



@end

#endif