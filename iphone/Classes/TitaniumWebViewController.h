/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>
#import "TitaniumContentViewController.h"
#import "TitaniumViewController.h"

@interface TitaniumWebViewController : TitaniumContentViewController<UIWebViewDelegate> {
	IBOutlet UIScrollView * scrollView; //The root view of us, effectively.
	IBOutlet UIWebView * webView;
	NSURL * currentContentURL;	//Used as a base url.
	NSMutableDictionary * magicTokenDict;
	
	TitaniumViewControllerOrientationsAllowed lastOrientation;

	NSMutableSet * nativeOnscreenProxies;
	BOOL isNonTitaniumPage;
}

//For WebView
@property (nonatomic,retain)	IBOutlet UIScrollView * scrollView;
@property (nonatomic,retain)	IBOutlet UIWebView * webView;
@property (nonatomic,retain)	NSURL * currentContentURL;	//Used as a base url.

- (NSString *) performJavascript: (NSString *) inputString onPageWithToken: (NSString *) token;
- (void)acceptToken:(NSString *)tokenString forContext:(NSString *) contextString;

- (void)reloadWebView;

- (void) investigateTitaniumCrashSite;

@end
