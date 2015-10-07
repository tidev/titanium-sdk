/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"
#import <Foundation/Foundation.h>
#ifdef USE_TI_APPIOS

@interface TiAppiOSOnDemandResourcesManagerProxy : TiProxy<NSProgressReporting>

@property(nonatomic, retain) NSBundleResourceRequest *resourceRequest;
@property(readonly, retain) NSProgress *progress;
@property double loadingPriority;

-(void)conditionallyBeginAccessingResources:(id)args;
-(void)endAccessingResources;
-(double)priority;
-(void)setPriority:(id)_priority;

@end

#endif
