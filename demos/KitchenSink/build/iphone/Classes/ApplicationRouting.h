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
- (NSData*) pageNamedAnimated_false;
- (NSData*) pageNamedApplication_data;
- (NSData*) pageNamedButtonbar;
- (NSData*) pageNamedButtons;
- (NSData*) pageNamedComposite;
- (NSData*) pageNamedDatabase;
- (NSData*) pageNamedFilesystem;
- (NSData*) pageNamedFullscreen;
- (NSData*) pageNamedGeo;
- (NSData*) pageNamedImage;
- (NSData*) scriptNamedIndex;
- (NSData*) pageNamedIphone_ui;
- (NSData*) pageNamedNavbar_color;
- (NSData*) pageNamedNavbar_hide;
- (NSData*) pageNamedNavbar_left;
- (NSData*) pageNamedNavbar_right;
- (NSData*) pageNamedNavbar_title;
- (NSData*) pageNamedOrientation;
- (NSData*) pageNamedPhone;
- (NSData*) pageNamedPlatform;
- (NSData*) pageNamedPlatform_data;
- (NSData*) pageNamedProperties;
- (NSData*) pageNamedShake;
- (NSData*) pageNamedSlider;
- (NSData*) pageNamedSound;
- (NSData*) pageNamedStatusbar;
- (NSData*) pageNamedSwitch;
- (NSData*) pageNamedTabbar;
- (NSData*) pageNamedTabbar_hide;
- (NSData*) pageNamedTextfields;
- (NSData*) pageNamedToolbar_fixedspace;
- (NSData*) pageNamedToolbar_left;
- (NSData*) pageNamedToolbar_lots;
- (NSData*) pageNamedToolbar_middle;
- (NSData*) pageNamedToolbar_right;
- (NSData*) pageNamedUi;
- (NSData*) pageNamedWindow_unfocus;
- (NSData*) pageNamedXhr;

@end
