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

#import <TitaniumKit/Libraries/APSAnalytics/APSAnalytics.h>
#import <TitaniumKit/Libraries/APSHTTPClient/APSHTTPClient.h>
#import <TitaniumKit/Sources/API/APIModule.h>
#import <TitaniumKit/Sources/API/ImageLoader.h>
#import <TitaniumKit/Sources/API/Mimetypes.h>
#import <TitaniumKit/Sources/API/NSData+Additions.h>
#import <TitaniumKit/Sources/API/OperationQueue.h>
#import <TitaniumKit/Sources/API/Ti2DMatrix.h>
#import <TitaniumKit/Sources/API/Ti3DMatrix.h>
#import <TitaniumKit/Sources/API/TiApp.h>
#import <TitaniumKit/Sources/API/TiBase.h>
#import <TitaniumKit/Sources/API/TiBlob.h>
#import <TitaniumKit/Sources/API/TiColor.h>
#import <TitaniumKit/Sources/API/TiComplexValue.h>
#import <TitaniumKit/Sources/API/TiExceptionHandler.h>
#import <TitaniumKit/Sources/API/TiLayoutQueue.h>
#import <TitaniumKit/Sources/API/TiLocale.h>
#import <TitaniumKit/Sources/API/TiLogServer.h>
#import <TitaniumKit/Sources/API/TiModule.h>
#import <TitaniumKit/Sources/API/TiProxy.h>
#import <TitaniumKit/Sources/API/TiTabGroup.h>
#import <TitaniumKit/Sources/API/TiToolbar.h>
#import <TitaniumKit/Sources/API/TiUtils.h>
#import <TitaniumKit/Sources/API/TiViewProxy.h>
#import <TitaniumKit/Sources/API/UIImage+Alpha.h>
#import <TitaniumKit/Sources/API/UIImage+Resize.h>
#import <TitaniumKit/Sources/API/UIImage+RoundedCorner.h>
#import <TitaniumKit/Sources/API/WebFont.h>
#import <TitaniumKit/Sources/API/Webcolor.h>
#import <TitaniumKit/Sources/API/XHRBridge.h>
#import <TitaniumKit/Sources/Misc/TiDefines.h>
#import <TitaniumKit/Sources/Misc/TiSharedConfig.h>
#import <TitaniumKit/Sources/Modules/TiFilesystemFileProxy.h>
#import <TitaniumKit/Sources/Modules/TiFilesystemFileStreamProxy.h>
#import <TitaniumKit/Sources/Modules/TiStreamProxy.h>
#import <TitaniumKit/Sources/Modules/TiUIViewProxy.h>
#import <TitaniumKit/Sources/Modules/TiUIWindow.h>
#import <TitaniumKit/Sources/Modules/TiUIWindowProxy.h>
#import <TitaniumKit/Sources/Modules/TiUIiOSTransitionAnimationProxy.h>

#define TISDK_VERSION_STRING @"8.0.0"
