/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_PLATFORM

#import "TiModule.h"
//#import "TiPlatformDisplayCaps.h"
#import <JavaScriptCore/JavaScriptCore.h>

#define READONLY_PROPERTY(type, name, upperName) \
@property (readonly, nonatomic) type name;       \
- (type) getupperName;

@class TiPlatformDisplayCaps; // forward declare

@protocol TiPlatformExports <JSExport>
READONLY_PROPERTY(NSNumber*, example, Example)

@property (readonly, nonatomic) NSNumber *BATTERY_STATE_CHARGING;
@property (readonly, nonatomic) NSNumber *BATTERY_STATE_FULL;
@property (readonly, nonatomic) NSNumber *BATTERY_STATE_UNKNOWN;
@property (readonly, nonatomic) NSNumber *BATTERY_STATE_UNPLUGGED;

@property (readonly, nonatomic) NSString *apiName;
@property (readonly, nonatomic) NSString *address;
@property (readonly, nonatomic) NSString *architecture;
@property (readonly, nonatomic) NSNumber *availableMemory;
@property (readonly, nonatomic) NSNumber *batteryLevel;
@property (readwrite, nonatomic, assign) NSNumber *batteryMonitoring;
@property (readonly, nonatomic) NSNumber *batteryState;
@property (readonly, nonatomic) TiPlatformDisplayCaps *displayCaps;
@property (readonly, nonatomic) TiPlatformDisplayCaps *DisplayCaps;
@property (readonly, nonatomic) NSString *id;
@property (readonly, nonatomic) NSString *identifierForAdvertising;
@property (readonly, nonatomic) NSString *identifierForVendor;
@property (readonly, nonatomic) BOOL isAdvertisingTrackingEnabled;
@property (readonly, nonatomic) NSString *locale;
@property (readonly, nonatomic) NSString *macaddress;
@property (readonly, nonatomic) NSString *manufacturer;
@property (readonly, nonatomic) NSString *model;
@property (readonly, nonatomic) NSString *name;
@property (readonly, nonatomic) NSString *netmask;
@property (readonly, nonatomic) NSString *osname;
@property (readonly, nonatomic) NSString *ostype;
@property (readonly, nonatomic) NSNumber *processorCount;
@property (readonly, nonatomic) NSString *runtime;
@property (readonly, nonatomic) NSString *username;
@property (readonly, nonatomic) NSString *version;

// TODO Add accessor methods for the properties!

- (BOOL)canOpenURL:(NSString *)url;
- (NSString *)createUUID;
- (BOOL)is24HourTimeFormat;
- (BOOL)openURL:(NSString *)newUrlString;

@end

@interface PlatformModule : TiModule <TiPlatformExports> {
    BOOL batteryEnabled;
}
@end


//@interface PlatformModule : TiModule {
//  NSString *name;
//  NSString *model;
//  NSString *version;
//  NSString *architecture;
//  NSNumber *processorCount;
//  NSString *username;
//  NSString *address;
//  NSString *ostype;
//  NSNumber *availableMemory;
//  TiPlatformDisplayCaps *capabilities;
//  BOOL batteryEnabled;
//}
//@end

#endif
