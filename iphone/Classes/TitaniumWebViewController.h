/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>
#import "TitaniumViewController.h"

@interface TitaniumWebViewController : TitaniumViewController<UIWebViewDelegate> {

}

+ (TitaniumViewController *) mostRecentController;

- (NSString *) performJavascript: (NSString *) inputString onPageWithToken: (NSString *) token;
- (void)acceptToken:(NSString *)tokenString forContext:(NSString *) contextString;

- (void)reloadWebView;
- (void)updateScrollBounds;

@end
