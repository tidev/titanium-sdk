/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>

typedef enum {
	TitaniumViewControllerIsClean			= 0,
	TitaniumViewControllerNeedsRefresh		= 0x01,
	TitaniumViewControllerRefreshIsAnimated	= 0x02,
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



@interface TitaniumViewController : UIViewController<UIWebViewDelegate> {
	IBOutlet UIWebView * webView;
	IBOutlet UIImageView * backgroundView;
	IBOutlet UIScrollView * scrollView;
//	NSMutableSet * nativeElementsSet;


	IBOutlet UIView * modalProgressView;
	IBOutlet UIActivityIndicatorView * modalProgressViewSpinny;
	IBOutlet UIProgressView * modalProgressViewBar;
	IBOutlet UILabel * modalProgressViewMessage;

	IBOutlet UIToolbar * toolBar;

	NSURL * currentContentURL;	//Used as a base url.
	NSMutableDictionary * viewProperties;
	
	TitaniumViewControllerOrientationsAllowed allowedOrientations;
	TitaniumViewControllerOrientationsAllowed lastOrientation;
	
	BOOL		cancelOpening;

	UIColor *	navBarTint;
	UIBarStyle	navBarStyle;
	BOOL		hidesNavBar;
	NSString *	titleViewImagePath;

	UIColor *	backgroundColor;
	UIImage *	backgroundImage;
	NSArray *	toolbarItems;
	
	BOOL		fullscreen;
	UIStatusBarStyle statusBarStyle;

	NSMutableDictionary * magicTokenDict;
	
	//TODO: organize and add in a set of dirty flags to speed things up.
	TitaniumViewControllerDirtyFlags	dirtyFlags;
}

+ (TitaniumViewController *) mostRecentController;
+ (TitaniumViewController *) viewController;

@property (nonatomic,retain)	IBOutlet UIWebView * webView;
@property (nonatomic,retain)	NSURL * currentContentURL;	//Used as a base url.
@property (nonatomic,retain)	NSMutableDictionary * viewProperties;

@property (nonatomic,retain)	UIColor *	navBarTint;
@property (nonatomic,retain)	NSString *	titleViewImagePath;
@property (nonatomic,retain)	UIColor *	backgroundColor;
@property (nonatomic,retain)	UIImage *	backgroundImage;
@property (nonatomic,assign)	BOOL		hidesNavBar;
@property (nonatomic,assign)	BOOL		cancelOpening;
@property (nonatomic,assign)	BOOL		fullscreen;
@property (nonatomic,assign)	UIStatusBarStyle statusBarStyle;
@property (nonatomic,copy)		NSArray *	toolbarItems;
- (void)setNavBarTint: (UIColor *) newColor;

- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
- (NSString *) performJavascript: (NSString *) inputString onPageWithToken: (NSString *) token;
- (NSString *) contextForToken: (NSString *) tokenString;
- (void)acceptToken:(NSString *)tokenString forContext:(NSString *) contextString;
- (void) setStatusBarStyleObject: (id) object;

#pragma mark Functionality exposed to Titanium

- (void)updateLayout: (BOOL)animated;
- (BOOL)needsUpdate: (TitaniumViewControllerDirtyFlags) newFlags;
- (void)doUpdateLayout;


@end