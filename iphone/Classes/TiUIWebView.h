/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIWEBVIEW

#import "TiUIView.h"


@interface TiUIWebView : TiUIView<UIWebViewDelegate> {
@private
	UIWebView *webview;
	UIActivityIndicatorView *spinner;
	NSURL *url;
	NSMutableDictionary *listeners;
	NSString *pageToken;
	BOOL scalingOverride;
	NSString *basicCredentials;
}

@property(nonatomic,readonly) id url;
@property(nonatomic,readonly) id loading;

-(void)evalJS:(NSArray*)args;
-(id)evalJSAndWait:(NSString *)code;
-(void)fireEvent:(id)listener withObject:(id)obj remove:(BOOL)yn thisObject:(id)thisObject_;

-(void)canGoBack:(NSMutableArray*)result;
-(void)canGoForward:(NSMutableArray*)result;


@end

#endif