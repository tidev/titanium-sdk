/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#define DISABLE_TI_LOG_SERVER
#import <TitaniumKit/TiApp.h>
#import <TitaniumKit/TiLogServer.h>
#import <TitaniumKit/TiSharedConfig.h>
#import <UIKit/UIKit.h>

#ifndef TI_LOG_SERVER_PORT
#define TI_LOG_SERVER_PORT 10571
#endif

// NOTE: this main is only used inside Xcode. In the real SDK, it's
// automatically replaced and built on the fly - when running in
// Xcode give some reasonable values

NSString *const TI_APPLICATION_DEPLOYTYPE = @"development";
NSString *const TI_APPLICATION_ID = @"com.appcelerator.kitchensink.xcode";
NSString *const TI_APPLICATION_PUBLISHER = @"Appcelerator";
NSString *const TI_APPLICATION_URL = @"https://appcelerator.com";
NSString *const TI_APPLICATION_NAME = @"Kitchen Sink (Xcode)";
NSString *const TI_APPLICATION_VERSION = @"1.0.0";
NSString *const TI_APPLICATION_DESCRIPTION = @"Kitchen Sink from XCode";
NSString *const TI_APPLICATION_COPYRIGHT = @"Appcelerator";
NSString *const TI_APPLICATION_GUID = @"25FE4B6E-7DA9-4344-B55B-25195570860F";
BOOL const TI_APPLICATION_ANALYTICS = YES;
BOOL const TI_APPLICATION_SHOW_ERROR_CONTROLLER = YES;
#if TARGET_OS_MACCATALYST
NSString *const TI_APPLICATION_RESOURCE_DIR = @"/Contents/Resources";
#else
NSString *const TI_APPLICATION_RESOURCE_DIR = @"";
#endif
NSString *const TI_APPLICATION_BUILD_TYPE = @"";

// Currently unused
NSString *const TI_APPLICATION_SDK_VERSION = @"8.0.0";
NSString *const TI_APPLICATION_BUILD_HASH = @"df92fbf";
NSString *const TI_APPLICATION_BUILD_DATE = @"3/14/2018 20:46";

int main(int argc, char *argv[])
{
  [[TiSharedConfig defaultConfig] setApplicationDeployType:TI_APPLICATION_DEPLOYTYPE];
  [[TiSharedConfig defaultConfig] setApplicationID:TI_APPLICATION_ID];
  [[TiSharedConfig defaultConfig] setApplicationPublisher:TI_APPLICATION_PUBLISHER];
  [[TiSharedConfig defaultConfig] setApplicationURL:[NSURL URLWithString:TI_APPLICATION_URL]];
  [[TiSharedConfig defaultConfig] setApplicationName:TI_APPLICATION_NAME];
  [[TiSharedConfig defaultConfig] setApplicationVersion:TI_APPLICATION_VERSION];
  [[TiSharedConfig defaultConfig] setApplicationDescription:TI_APPLICATION_DESCRIPTION];
  [[TiSharedConfig defaultConfig] setApplicationCopyright:TI_APPLICATION_COPYRIGHT];
  [[TiSharedConfig defaultConfig] setApplicationGUID:TI_APPLICATION_GUID];
  [[TiSharedConfig defaultConfig] setAnalyticsEnabled:TI_APPLICATION_ANALYTICS];
  [[TiSharedConfig defaultConfig] setShowErrorController:TI_APPLICATION_SHOW_ERROR_CONTROLLER];
  [[TiSharedConfig defaultConfig] setApplicationBuildType:TI_APPLICATION_BUILD_TYPE];
  [[TiSharedConfig defaultConfig] setApplicationResourcesDirectory:TI_APPLICATION_RESOURCE_DIR];
#ifdef DISABLE_TI_LOG_SERVER
  [[TiSharedConfig defaultConfig] setLogServerEnabled:NO];
#else
  [[TiSharedConfig defaultConfig] setLogServerEnabled:YES];
  [[TiLogServer defaultLogServer] setPort:TI_LOG_SERVER_PORT];
#endif

  UIColor *defaultBgColor = UIColor.blackColor;
#if defined(DEFAULT_BGCOLOR_RED) && defined(DEFAULT_BGCOLOR_GREEN) && defined(DEFAULT_BGCOLOR_BLUE)
  defaultBgColor = [UIColor colorWithRed:DEFAULT_BGCOLOR_RED
                                   green:DEFAULT_BGCOLOR_GREEN
                                    blue:DEFAULT_BGCOLOR_BLUE
                                   alpha:1.0f];
#endif
  [[TiSharedConfig defaultConfig] setDefaultBackgroundColor:defaultBgColor];
#if defined(DEBUG) || defined(DEVELOPER)
  [[TiSharedConfig defaultConfig] setDebugEnabled:YES];
#endif
  NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
  int retVal = UIApplicationMain(argc, argv, @"TiUIApplication", @"TiApp");
  [pool release];
  return retVal;
}
