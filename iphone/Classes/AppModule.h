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
#ifdef USE_TI_APPIOS
	TiProxy *iOS;
#endif
}

-(void)addEventListener:(NSArray*)args;
-(void)removeEventListener:(NSArray*)args;
-(void)fireEvent:(NSArray*)args;
-(int)garbageCollect:(NSArray*)args;

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

@property(nonatomic,readonly) NSNumber* keyboardVisible;
@property(nonatomic,readwrite,assign) NSNumber* disableNetworkActivityIndicator;


#ifdef USE_TI_APPIOS
@property(nonatomic,readonly)			TiProxy* iOS;
#endif

@end

#endif