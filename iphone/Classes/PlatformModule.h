/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_PLATFORM

@import JavaScriptCore;
@import TitaniumKit.ObjcProxy;

@class TiPlatformDisplayCaps; // forward declare

@protocol TiPlatformExports <JSExport>

// Constants
CONSTANT(NSNumber *, BATTERY_STATE_CHARGING);
CONSTANT(NSNumber *, BATTERY_STATE_FULL);
CONSTANT(NSNumber *, BATTERY_STATE_UNKNOWN);
CONSTANT(NSNumber *, BATTERY_STATE_UNPLUGGED);

// Properties (and accessors)
READONLY_PROPERTY(NSString *, address, Address);
READONLY_PROPERTY(NSString *, architecture, Architecture);
READONLY_PROPERTY(NSNumber *, availableMemory, AvailableMemory);
READONLY_PROPERTY(NSNumber *, batteryLevel, BatteryLevel);
PROPERTY(BOOL, batteryMonitoring, BatteryMonitoring);
READONLY_PROPERTY(NSNumber *, batteryState, BatteryState);
READONLY_PROPERTY(TiPlatformDisplayCaps *, displayCaps, DisplayCaps);
@property (readonly) TiPlatformDisplayCaps *DisplayCaps;
READONLY_PROPERTY(NSString *, id, Id);
READONLY_PROPERTY(NSString *, identifierForAdvertising, IdentifierForAdvertising);
READONLY_PROPERTY(NSString *, identifierForVendor, IdentifierForVendor);
READONLY_PROPERTY(BOOL, isAdvertisingTrackingEnabled, IsAdvertisingTrackingEnabled);
READONLY_PROPERTY(NSString *, locale, Locale);
READONLY_PROPERTY(NSString *, macaddress, Macaddress);
READONLY_PROPERTY(NSString *, manufacturer, Manufacturer);
READONLY_PROPERTY(NSString *, model, Model);
READONLY_PROPERTY(NSString *, name, Name);
READONLY_PROPERTY(NSString *, netmask, Netmask);
READONLY_PROPERTY(NSString *, osname, Osname);
READONLY_PROPERTY(NSString *, ostype, Ostype);
READONLY_PROPERTY(NSNumber *, processorCount, ProcessorCount);
READONLY_PROPERTY(NSString *, runtime, Runtime);
READONLY_PROPERTY(NSNumber *, totalMemory, TotalMemory);
READONLY_PROPERTY(NSNumber *, uptime, Uptime);
READONLY_PROPERTY(NSString *, username, Username);
READONLY_PROPERTY(NSString *, version, Version);

// Methods
- (BOOL)canOpenURL:(NSString *)url;
- (NSString *)createUUID;
- (BOOL)is24HourTimeFormat;

JSExportAs(openURL,
           -(BOOL)openURL
           : (NSString *)url withOptions
           : (JSValue *)options andCallback
           : (JSValue *)callback);

@end

@interface PlatformModule : ObjcProxy <TiPlatformExports> {
  BOOL batteryEnabled;
}
@end

#endif
