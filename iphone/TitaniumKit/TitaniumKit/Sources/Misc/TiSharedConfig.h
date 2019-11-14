/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

/**
 Contains information about the app and build-related meta data.
 */
@interface TiSharedConfig : NSObject

NS_ASSUME_NONNULL_BEGIN

/**
 Name of the application, e.g. "MyApp".
 */
@property (nonatomic, strong) NSString *applicationName;

/**
 Application ID, e.g. "com.example.appid".
 */
@property (nonatomic, strong) NSString *applicationID;

/**
 Version of the application, e.g. "1.0.0".
 */
@property (nonatomic, strong) NSString *applicationVersion;

/**
 Publisher of the application, if set.
 */
@property (nonatomic, strong, nullable) NSString *applicationPublisher;

/**
 URL of the application, if set.
 */
@property (nonatomic, strong, nullable) NSURL *applicationURL;

/**
 Copyright of the application, if set.
 */
@property (nonatomic, strong, nullable) NSString *applicationCopyright;

/**
 Description of the application.
 */
@property (nonatomic, strong, nullable) NSString *applicationDescription;

/**
 Deploy type of the application, e.g. "development", currently **unused**.
 */
@property (nonatomic, strong, nullable) NSString *applicationDeployType;

/**
 GUID of the application, e.g. "11111111-1111-1111-1111-111111111111".
 */
@property (nonatomic, strong) NSString *applicationGUID;

/**
 Path to the resources directory, if custom set, e.g. "Resources". Currently
 set to an empty string to indicate the default behavior, can change in the future.
 */
@property (nonatomic, strong, nullable) NSString *applicationResourcesDirectory;

/**
 Build type of the application, currently **unused.
 */
@property (nonatomic, strong, nullable) NSString *applicationBuildType;

/**
 Build hash, only used internally.
 */
@property (nonatomic, strong, nullable) NSString *buildHash;

/**
 Build date, only used internally.
 */
@property (nonatomic, strong, nullable) NSString *buildDate;

/**
 SDK version, only used internally.
 */
@property (nonatomic, strong, nullable) NSString *sdkVersion;

/**
 Indicates whether or not APSAnalytics is currently enabled.
 Defaults to `true` for new application, can be disabled via `<analytics>false</analytics>`
 in the tiapp.xml.
 */
@property (nonatomic, assign, getter=isAnalyticsEnabled) BOOL analyticsEnabled;

/**
 Indicates whether or not the error screen should be shown if an
 error occurs. Defaults to `true` for `production` and `test` deploy types,
 `false` for deploy type `development`. Can be overriden by the `hide-error-controller`
 CLI parameter.
 */
@property (nonatomic, assign) BOOL showErrorController;

/**
 Default background color from tiapp.xml
   <ios>
       <default-background-color>#ff0000</default-background-color>
   </ios>
 */
@property (nonatomic, strong, nullable) UIColor *defaultBackgroundColor;

/**
 Indicates whether or not TiLogServer is currently enabled.
 */
@property (nonatomic, assign) BOOL logServerEnabled;

/**
 Indicates whether debug is enabled or not.
 */

@property (nonatomic, assign) BOOL debugEnabled;

+ (TiSharedConfig *)defaultConfig;

NS_ASSUME_NONNULL_END

@end
