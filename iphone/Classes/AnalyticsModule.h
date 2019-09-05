/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

@import JavaScriptCore;
@import TitaniumKit.ObjcProxy;

@protocol AnalyticsExports <JSExport>

// Properties (and accessors)
READONLY_PROPERTY(NSString *, lastEvent, LastEvent);
PROPERTY(BOOL, optedOut, OptedOut);

// Methods
JSExportAs(featureEvent,
           -(NSInteger)featureEvent
           : (NSString *)name withData
           : (id)data);
- (void)filterEvents:(NSArray *)events;
JSExportAs(navEvent,
           -(void)navEvent
           : (NSString *)from to
           : (NSString *)to withName
           : (NSString *)name withData
           : (NSDictionary *)data);

@end

@interface AnalyticsModule : ObjcProxy <AnalyticsExports>

#pragma mark Internal API's

+ (BOOL)isEventFiltered:(NSString *)eventName;

@end
