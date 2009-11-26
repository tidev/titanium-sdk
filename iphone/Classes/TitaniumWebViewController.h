/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>
#import "TitaniumContentViewController.h"
#import "TitaniumViewController.h"

@class TweakedWebView;
@interface TitaniumWebViewController : TitaniumContentViewController<UIWebViewDelegate, UIScrollViewDelegate> {
	IBOutlet UIScrollView * scrollView; //The root view of us, effectively.
	IBOutlet TweakedWebView * webView;
	NSURL * currentContentURL;	//Used as a base url.
	NSMutableDictionary * magicTokenDict;
	UIActivityIndicatorView * spinner;
	UIView *parentView;
	
	TitaniumViewControllerOrientationsAllowed lastOrientation;

	NSMutableSet * nativeOnscreenProxies;
	BOOL isNonTitaniumPage;
	BOOL loading;
	BOOL showActivity;
	BOOL preloaded;
}

//For WebView
@property (nonatomic,retain)	IBOutlet UIScrollView * scrollView;
@property (nonatomic,retain)	IBOutlet TweakedWebView * webView;
@property (nonatomic,retain)	NSURL * currentContentURL;	//Used as a base url.

- (BOOL) sendJavascript: (NSString *) inputString;
- (NSString *) performJavascript: (NSString *) inputString onPageWithToken: (NSString *) token;
- (void)acceptToken:(NSString *)tokenString forContext:(NSString *) contextString;

- (void)reloadWebView;
- (void)updateTitle;

- (void) investigateTitaniumCrashSite;

@end
