/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUIView.h"
#import "AppModule.h"
#import "TiEvaluator.h"

@interface TiUIWebView : TiUIView<UIWebViewDelegate,TiEvaluator> {
@private
	UIWebView *webview;
	UIActivityIndicatorView *spinner;
	NSURL *url;
	NSMutableDictionary *listeners;
	AppModule *appModule;
	NSString *pageToken;
	BOOL scalingOverride;
	UIView *delegateView;
}

@property(nonatomic,readonly) id url;

-(void)evalJS:(NSArray*)args;

@end
