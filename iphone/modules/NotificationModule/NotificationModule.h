//
//  NotificationModule.h
//  Titanium
//
//  Created by Blain Hamon on 9/16/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

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

- (CGRect) addToView: (UIView *) superView inRect: (CGRect) bounds;
- (void) loadHtmlString: (NSString *) htmlString;

- (IBAction) closeButtonPressed: (id) sender;
- (IBAction) notificationPressed: (id) sender;

@end


@interface NotificationModule : NSObject<TitaniumModule> {
	int nextProxyToken;	
	NSMutableDictionary * proxiesDict;
}

@end
