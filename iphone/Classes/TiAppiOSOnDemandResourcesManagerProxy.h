/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"
#import <Foundation/Foundation.h>
#ifdef USE_TI_APPIOS

@interface TiAppiOSOnDemandResourcesManagerProxy : TiProxy<NSProgressReporting> {
@private
    NSMutableSet *tags;
    NSBundle *bundle;
    NSBundleResourceRequest *resourceRequest;
    BOOL resourcesLoaded;
    float priority;
}

@property(readonly, strong) NSProgress *progress;
@property double loadingPriority;

-(void)beginAccessingResources:(id)args;
-(void)conditionallyBeginAccessingResources:(id)args;
-(void)endAccessingResources;
-(double)priority;
-(void)setPriority:(id)_priority;

@end

#endif
