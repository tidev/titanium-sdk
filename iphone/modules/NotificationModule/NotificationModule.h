/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>
#import "TitaniumModule.h"

#define NOTIFICATION_VIEW_Z		50
#define NOTIFICATION_BTN_Z		51
#define NOTIFICATION_CLOSE_Z	52

@interface NotificationProxy : TitaniumProxyObject<UIWebViewDelegate>
{
	UIWebView * notificationView;
	UIButton * closeButton;
	UIButton * notificationButton;
}

- (void) removeFromSuperview;
- (CGFloat) placeInView: (UIView *) superView inRect: (CGRect) bounds;

- (void) loadHtmlString: (NSString *) htmlString;
- (IBAction) closeButtonPressed: (id) sender;
- (IBAction) notificationPressed: (id) sender;

@end


@interface NotificationModule : NSObject<TitaniumModule> {
	int nextProxyToken;	
	NSMutableDictionary * proxiesDict;
}

@end
