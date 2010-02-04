/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiView.h"
#import "TiEvaluator.h"

@interface TiUIWebViewProxy : TiView<UIWebViewDelegate,TiEvaluator> {
	NSURL *url;
	UIWebView *webview;
	NSString *pageToken;
}

@property(nonatomic,copy) NSURL *url;

-(void)open:(id)args;
-(void)close:(id)args;


@end
