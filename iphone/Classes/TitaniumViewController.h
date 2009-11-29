/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>

#define VAL_OR_NSNULL(foo)	(((foo) != nil)?((id)foo):[NSNull null])

typedef enum {
	TitaniumViewControllerIsClean				= 0,
	TitaniumViewControllerNeedsRefresh			= 0x01,
	TitaniumViewControllerRefreshIsAnimated		= 0x02,

	TitaniumViewControllerToolbarChanged		= 0x04,
	TitaniumViewControllerVisibleAreaChanged	= 0x08,

	TitaniumViewControllerAnimationIphoneStyle	= 0x10,
	TitaniumViewControllerAnimationCoreStyle	= 0x20,

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

@class NativeControlProxy,NotificationProxy;
@class TitaniumContentViewController, TitaniumJSEvent;
@class TitaniumBlobWrapper;

@interface TitaniumViewController : UIViewController<UIWebViewDelegate,UIScrollViewDelegate> {

//Commont to all viewControllers:
	NSString * primaryToken;
	NSString * nameString;
	IBOutlet UIImageView * backgroundView;
	IBOutlet UIView * contentView;

	
	IBOutlet UIToolbar * toolBar;
//	NSMutableSet * nativeElementsSet;

	NSLock	* contentViewLock;
	NSMutableArray * contentViewControllers;

	int selectedContentIndex;
	TitaniumContentViewController * focusedContentController;


	UIImageView *tabBarBackground;
	UIImageView *toolBarBackground;

//For the modal progress view
//	IBOutlet UIView * modalProgressView;
//	IBOutlet UIActivityIndicatorView * modalProgressViewSpinny;
//	IBOutlet UIProgressView * modalProgressViewBar;
//	IBOutlet UILabel * modalProgressViewMessage;
	
	TitaniumViewControllerOrientationsAllowed allowedOrientations;
	TitaniumViewControllerOrientationsAllowed currentOrientation;
	
	BOOL		cancelOpening;

	UIColor *	navBarTint;
	UIBarStyle	navBarStyle;
	BOOL		hidesNavBar;
	NSString *	titleViewImagePath;
	NativeControlProxy * titleViewProxy;
	UIImage * navBarImage;

	UIColor *	backgroundColor;
	UIImage *	backgroundImage;
	TitaniumBlobWrapper *	landscapeBackgroundImageBlob;

	NSArray *	toolbarItems;
	
	BOOL		fullscreen;
	UIStatusBarStyle statusBarStyle;

	//TODO: organize and add in a set of dirty flags to speed things up.
	TitaniumViewControllerDirtyFlags	dirtyFlags;
	NSDictionary * animationOptionsDict;
	BOOL		isVisible;

	NSMutableArray * notificationsArray;
}

+ (TitaniumViewController *) viewControllerForState: (id) inputState relativeToUrl: (NSURL *) baseUrl;

@property (nonatomic,assign)	int selectedContentIndex;
@property (nonatomic,retain)	NSMutableArray * contentViewControllers;

//Common
@property (nonatomic,retain)	IBOutlet UIView * contentView;

@property (nonatomic,retain)	UIColor *	navBarTint;
@property (nonatomic,retain)  UIImage * navBarImage;
@property (nonatomic,copy)		NSString * primaryToken;
@property (nonatomic,copy)		NSString * nameString;

@property (nonatomic,copy)		NSString *	titleViewImagePath;
@property (nonatomic,retain)	UIColor *	backgroundColor;
@property (nonatomic,retain)	UIImage *	backgroundImage;
@property (nonatomic,retain)	TitaniumBlobWrapper *	landscapeBackgroundImageBlob;
- (void)setLandscapeBackgroundImageUrl:(NSURL *) newURL;

@property (nonatomic,assign)	BOOL		hidesNavBar;
@property (nonatomic,assign)	BOOL		cancelOpening;
@property (nonatomic,assign)	BOOL		fullscreen;
@property (nonatomic,assign)	UIStatusBarStyle statusBarStyle;
@property (nonatomic,copy)		NSArray *	toolbarItems;

@property (nonatomic,copy)		NSDictionary * animationOptionsDict;

- (void)setNavBarTint: (UIColor *) newColor;

- (void)setTitleViewProxy: (NativeControlProxy *) newProxy;

- (void)setTitlePrompt:(NSString*)prompt;

+ (TitaniumViewController *) viewControllerForState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
- (void) setStatusBarStyleObject: (id) object;

#pragma mark Functionality exposed to Titanium

- (TitaniumContentViewController *) viewControllerForIndex: (int)index;

- (BOOL) hasToken: (NSString *) tokenString;
- (void)updateLayout: (BOOL)animated;
- (BOOL)needsUpdate: (TitaniumViewControllerDirtyFlags) newFlags;
- (void) setToolbarProxies: (NSArray *) newProxies;

- (void)refreshTitleView;
- (void)doUpdateLayout;
- (void)refreshBackground;

- (void) updateContentViewArray: (NSArray *) messagePacket;

- (NSDictionary *) propertiesDict;
- (NSDictionary *) tabPropertiesDict;

- (void) addNotification:(NotificationProxy *)notification;
- (void) removeNotification:(NotificationProxy *)notification;

- (BOOL) toolbarOverlaid;
- (CGPoint) toolbarOrigin;

- (void) handleJavascriptEvent: (TitaniumJSEvent *) event;


@end

@protocol TitaniumWindowDelegate

@optional
- (void)setInterfaceOrientation:(TitaniumViewControllerOrientationsAllowed)interfaceOrientation duration:(NSTimeInterval)duration;
- (void)setFocused:(BOOL)isFocused;
- (void)setWindowFocused:(BOOL)isFocused;
- (void)willUpdateLayout: (BOOL)animated;

@end
