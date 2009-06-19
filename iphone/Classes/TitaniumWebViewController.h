//
//  TitaniumWebViewController.h
//  Titanium
//
//  Created by Blain Hamon on 6/17/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "TitaniumViewController.h"

@interface TitaniumWebViewController : TitaniumViewController<UIWebViewDelegate> {

}

+ (TitaniumViewController *) mostRecentController;

- (NSString *) performJavascript: (NSString *) inputString onPageWithToken: (NSString *) token;
- (void)acceptToken:(NSString *)tokenString forContext:(NSString *) contextString;

- (void)reloadWebView;

@end
