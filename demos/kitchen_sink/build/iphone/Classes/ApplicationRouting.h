/**
 * Appcelerator Titanium Mobile
 * This is generated code. Do not modify. Your changes will be lost.
 * Generated code is Copyright (c) 2009 by Appcelerator, Inc.
 * All Rights Reserved.
 */
#import <Foundation/Foundation.h>

@protocol TitaniumAppAssetResolver
- (NSData*) resolveAppAsset:(NSURL*)url;
- (oneway void)release;
- (id)retain;
@end

@interface ApplicationRouting : NSObject<TitaniumAppAssetResolver> {
}
- (NSData*) resolveAppAsset:(NSURL*)url;
- (NSData*) pageNamedAccelerometer;
- (NSData*) pageNamedActivity_indicator;
- (NSData*) pageNamedAlerts;
- (NSData*) pageNamedApp;
- (NSData*) pageNamedAudio;
- (NSData*) pageNamedDb;
- (NSData*) pageNamedFullscreen;
- (NSData*) pageNamedGeolocation;
- (NSData*) pageNamedHidenavbar;
- (NSData*) pageNamedImage;
- (NSData*) pageNamedIndex;
- (NSData*) scriptNamedIndex;
- (NSData*) pageNamedInfo;
- (NSData*) pageNamedNavbar_buttons;
- (NSData*) pageNamedNetwork;
- (NSData*) pageNamedNotifications;
- (NSData*) pageNamedOptions_dialog;
- (NSData*) pageNamedOrientationchange;
- (NSData*) pageNamedOther;
- (NSData*) pageNamedPlatform;
- (NSData*) pageNamedProperties;
- (NSData*) pageNamedProperty_view;
- (NSData*) pageNamedShake;
- (NSData*) pageNamedToolbar;
- (NSData*) pageNamedUi;
- (NSData*) styleNamedTiui_css_tiui;
- (NSData*) scriptNamedTiui_js_tiui;

@end
