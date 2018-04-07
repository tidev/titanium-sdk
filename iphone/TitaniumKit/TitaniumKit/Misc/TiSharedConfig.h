/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>

@interface TiSharedConfig : NSObject

@property (nonatomic, strong) NSString *applicationName;

@property (nonatomic, strong) NSString *applicationID;

@property (nonatomic, strong) NSString *applicationVersion;

@property (nonatomic, strong) NSString *applicationDeployType;

@property (nonatomic, strong) NSString *applicationGUID;

@property (nonatomic, strong) NSString *applicationResourcesDirectory;

@property (nonatomic, strong) NSString *applicationBuildType;

@property (nonatomic, strong) NSString *buildHash;

@property (nonatomic, strong) NSString *buildDate;

@property (nonatomic, strong) NSString *sdkVersion;

@property (nonatomic, assign, getter=isAnalyticsEnabled) BOOL analyticsEnabled;

@property (nonatomic, assign) BOOL showErrorController;

+ (id)defaultConfig;

@end
