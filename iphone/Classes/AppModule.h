/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiModule.h"

#ifdef USE_TI_APP

#import "TiAppPropertiesProxy.h"

@interface AppModule : TiModule {
@private
	NSMutableDictionary *appListeners;
	TiAppPropertiesProxy *properties;
}

-(void)addEventListener:(NSArray*)args;
-(void)removeEventListener:(NSArray*)args;
-(void)fireEvent:(NSArray*)args;

@property(nonatomic,readonly) NSString *id;
@property(nonatomic,readonly) NSString *url;
@property(nonatomic,readonly) NSString *guid;
@property(nonatomic,readonly) NSString *name;
@property(nonatomic,readonly) NSString *version;
@property(nonatomic,readonly) NSString *publisher;
@property(nonatomic,readonly) NSString *description;
@property(nonatomic,readonly) NSString *copyright;
// for backwards compat
@property(nonatomic,readonly) NSString *iD;
@property(nonatomic,readonly) NSString *uRL;
@property(nonatomic,readonly) NSString *gUID;

@property(nonatomic,readonly) TiAppPropertiesProxy *Properties;
@property(nonatomic,readwrite,assign) NSNumber *idleTimerDisabled;
@property(nonatomic,readonly) NSNumber *proximityState;
@property(nonatomic,readwrite,assign) NSNumber *proximityDetection;

@end

#endif