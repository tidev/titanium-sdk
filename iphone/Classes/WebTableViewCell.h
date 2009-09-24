/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>


@interface WebTableViewCell : UITableViewCell<UIWebViewDelegate> {
	UIWebView * htmlLabel;
}

- (void)updateState: (BOOL) animated;

@property(nonatomic,retain,readonly) UIWebView * htmlLabel;

- (void) setHTML: (NSString *) htmlString;

@end
