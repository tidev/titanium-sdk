/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiModule.h"
#import "TiAppPropertiesProxy.h"

@interface AppModule : TiModule {
@private
	NSMutableDictionary *appListeners;
	TiAppPropertiesProxy *properties;
}

-(void)addEventListener:(NSArray*)args;
-(void)removeEventListener:(NSArray*)args;
-(void)fireEvent:(NSArray*)args;

@property(nonatomic,readonly) TiAppPropertiesProxy *Properties;
@property(nonatomic,readwrite,assign) NSNumber *idleTimerDisabled;
@property(nonatomic,readonly) NSNumber *proximityState;
@property(nonatomic,readwrite,assign) NSNumber *proximityDetection;

@end

/*
appUrlInvoc,@"appURLToPath",
launchOptionsInvoc,@"getArguments",
*/