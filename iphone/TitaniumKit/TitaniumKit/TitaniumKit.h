/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>

//! Project version number for TitaniumKit.
FOUNDATION_EXPORT double TitaniumKitVersionNumber;

//! Project version string for TitaniumKit.
FOUNDATION_EXPORT const unsigned char TitaniumKitVersionString[];

// TiBase.h needs to come first because of all the macro definitions
#import <TitaniumKit/TiBase.h>

#import <TitaniumKit/APIModule.h>
#import <TitaniumKit/APSAnalytics.h>
#import <TitaniumKit/APSHTTPClient.h>
#import <TitaniumKit/ImageLoader.h>
#import <TitaniumKit/JSValue+Addons.h>
#import <TitaniumKit/Mimetypes.h>
#import <TitaniumKit/NSData+Additions.h>
#import <TitaniumKit/ObjcProxy.h>
#import <TitaniumKit/OperationQueue.h>
#import <TitaniumKit/SBJSON.h>
#import <TitaniumKit/Ti2DMatrix.h>
#import <TitaniumKit/Ti3DMatrix.h>
#import <TitaniumKit/TiApp.h>
#import <TitaniumKit/TiBlob.h>
#import <TitaniumKit/TiColor.h>
#import <TitaniumKit/TiComplexValue.h>
#import <TitaniumKit/TiDefines.h>
#import <TitaniumKit/TiExceptionHandler.h>
#import <TitaniumKit/TiFilesystemFileProxy.h>
#import <TitaniumKit/TiFilesystemFileStreamProxy.h>
#import <TitaniumKit/TiLayoutQueue.h>
#import <TitaniumKit/TiLocale.h>
#import <TitaniumKit/TiLogServer.h>
#import <TitaniumKit/TiModule.h>
#import <TitaniumKit/TiProxy.h>
#import <TitaniumKit/TiSharedConfig.h>
#import <TitaniumKit/TiStreamProxy.h>
#import <TitaniumKit/TiTabGroup.h>
#import <TitaniumKit/TiToolbar.h>
#import <TitaniumKit/TiUIViewProxy.h>
#import <TitaniumKit/TiUIWindow.h>
#import <TitaniumKit/TiUIWindowProxy.h>
#import <TitaniumKit/TiUIiOSTransitionAnimationProxy.h>
#import <TitaniumKit/TiUtils.h>
#import <TitaniumKit/TiViewProxy.h>
#import <TitaniumKit/UIImage+Alpha.h>
#import <TitaniumKit/UIImage+Resize.h>
#import <TitaniumKit/UIImage+RoundedCorner.h>
#import <TitaniumKit/WebFont.h>
#import <TitaniumKit/Webcolor.h>

#define TISDK_VERSION_STRING @"8.0.0"
