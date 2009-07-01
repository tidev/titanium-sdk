/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>

typedef enum {
	TitaniumViewControllerIsClean				= 0,
	TitaniumViewControllerNeedsRefresh			= 0x01,
	TitaniumViewControllerRefreshIsAnimated		= 0x02,

	TitaniumViewControllerToolbarChanged		= 0x04,
	TitaniumViewControllerVisibleAreaChanged	= 0x08,

} TitaniumViewControllerDirtyFlags;

typedef enum {
	TitaniumViewControllerDefaultOrientation = 0,
	TitaniumViewControllerPortrait = 1 << UIInterfaceOrientationPortrait,
	TitaniumViewControllerPortraitUpsideDown = 1 << UIInterfaceOrientationPortraitUpsideDown,
	TitaniumViewControllerLandscapeLeft = 1 << UIInterfaceOrientationLandscapeLeft,
	TitaniumViewControllerLandscapeRight = 1 << UIInterfaceOrientationLandscapeRight,
	
	TitaniumViewControllerLandscape = TitaniumViewControllerLandscapeLeft | TitaniumViewControllerLandscapeRight,
	TitaniumViewControllerLandscapeOrPortrait = TitaniumViewControllerLandscape | TitaniumViewControllerPortrait,
	TitaniumViewControllerAnyOrientation = 0xFFFF,
} TitaniumViewControllerOrientationsAllowed;

@class UIButtonProxy;
@interface TitaniumViewController : UIViewController<UIWebViewDelegate> {

//For TitaniumWebViewController:
	IBOutlet UIWebView * webView;
	NSURL * currentContentURL;	//Used as a base url.
	NSMutableDictionary * magicTokenDict;
	//TODO: What about views that never have magic tokens?

//Commont to all viewControllers:
	NSString * primaryToken;
	IBOutlet UIImageView * backgroundView;
	IBOutlet UIView * contentView;
	IBOutlet UIToolbar * toolBar;
//	NSMutableSet * nativeElementsSet;


//For the modal progress view
//	IBOutlet UIView * modalProgressView;
//	IBOutlet UIActivityIndicatorView * modalProgressViewSpinny;
//	IBOutlet UIProgressView * modalProgressViewBar;
//	IBOutlet UILabel * modalProgressViewMessage;

	NSMutableDictionary * viewProperties;
	
	TitaniumViewControllerOrientationsAllowed allowedOrientations;
	TitaniumViewControllerOrientationsAllowed lastOrientation;
	
	BOOL		cancelOpening;

	UIColor *	navBarTint;
	UIBarStyle	navBarStyle;
	BOOL		hidesNavBar;
	NSString *	titleViewImagePath;
	UIButtonProxy * titleViewProxy;

	UIColor *	backgroundColor;
	UIImage *	backgroundImage;
	NSArray *	toolbarItems;
	
	BOOL		fullscreen;
	UIStatusBarStyle statusBarStyle;

	//TODO: organize and add in a set of dirty flags to speed things up.
	TitaniumViewControllerDirtyFlags	dirtyFlags;
}

+ (TitaniumViewController *) viewController;

//For WebView
@property (nonatomic,retain)	IBOutlet UIWebView * webView;
@property (nonatomic,retain)	NSURL * currentContentURL;	//Used as a base url.

//Common
@property (nonatomic,retain)	IBOutlet UIView * contentView;
@property (nonatomic,retain)	NSMutableDictionary * viewProperties;

@property (nonatomic,retain)	UIColor *	navBarTint;
@property (nonatomic,retain)	NSString * primaryToken;

@property (nonatomic,retain)	NSString *	titleViewImagePath;
@property (nonatomic,retain)	UIColor *	backgroundColor;
@property (nonatomic,retain)	UIImage *	backgroundImage;
@property (nonatomic,assign)	BOOL		hidesNavBar;
@property (nonatomic,assign)	BOOL		cancelOpening;
@property (nonatomic,assign)	BOOL		fullscreen;
@property (nonatomic,assign)	UIStatusBarStyle statusBarStyle;
@property (nonatomic,copy)		NSArray *	toolbarItems;
- (void)setNavBarTint: (UIColor *) newColor;

+ (TitaniumViewController *) viewControllerForState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
- (void) setStatusBarStyleObject: (id) object;

#pragma mark Functionality exposed to Titanium

- (BOOL) hasToken: (NSString *) tokenString;
- (void)updateLayout: (BOOL)animated;
- (BOOL)needsUpdate: (TitaniumViewControllerDirtyFlags) newFlags;
- (void)doUpdateLayout;
- (void) setToolbarProxies: (NSArray *) newProxies;


@end