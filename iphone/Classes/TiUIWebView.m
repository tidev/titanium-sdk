/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIWebView.h"
#import "TiUtils.h"
#import "TiProxy.h"

@implementation TiUIWebView

-(void)dealloc
{
	if (webview!=nil)
	{
		webview.delegate = nil;
	}
	RELEASE_TO_NIL(webview);
	RELEASE_TO_NIL(url);
	RELEASE_TO_NIL(spinner);
	[super dealloc];
}

-(BOOL)isURLRemote
{
	NSString *scheme = [url scheme];
	return [scheme hasPrefix:@"http"];
}

-(UIWebView*)webview 
{
	if (webview==nil)
	{
		webview = [[UIWebView alloc] initWithFrame:CGRectZero];
		webview.delegate = self;
		webview.backgroundColor = [UIColor clearColor];
		[self addSubview:webview];
		
		// only show the loading indicator if it's a remote URL
		if ([self isURLRemote])
		{
			spinner = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleWhiteLarge];
			[spinner setHidesWhenStopped:YES];
			spinner.autoresizingMask = UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleBottomMargin | UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleRightMargin;
			[self addSubview:spinner];
			[spinner sizeToFit];
			[spinner startAnimating];
		}
	}
	return webview;
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	if (webview!=nil)
	{
		[TiUtils setView:webview positionRect:bounds];
		
		if (spinner!=nil)
		{
			spinner.center = self.center;
		}
		
		[[self webview] stringByEvaluatingJavaScriptFromString:[NSString stringWithFormat:@"document.body.style.minWidth='%fpx';document.body.style.minHeight='%fpx';",bounds.size.width-8,bounds.size.height-16]];
	}
}

#pragma mark Public APIs

-(void)setUrl_:(id)args
{
	RELEASE_TO_NIL(url);
	url = [[TiUtils toURL:args proxy:(TiProxy*)self.proxy] retain];
	
	if ([self isURLRemote])
	{
		NSURLRequest *request = [NSURLRequest requestWithURL:url];
		[[self webview] loadRequest:request];
		[[self webview] setScalesPageToFit:YES];
	}
	else
	{
		NSMutableString *html = [[NSMutableString alloc] init];
		[html appendString:[NSString stringWithContentsOfURL:url encoding:NSUTF8StringEncoding error:nil]];	
		[[self webview] loadHTMLString:html baseURL:url];
		[html release];
	}
}

-(void)evalJS:(NSString*)code
{
	[[self webview] stringByEvaluatingJavaScriptFromString:code];
}

#pragma mark WebView Delegate

- (BOOL)webView:(UIWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType
{
	//TODO: do we want to fire event?
	return YES;
}

- (void)webViewDidStartLoad:(UIWebView *)webView
{
	if ([self.proxy _hasListeners:@"beforeload"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:[url absoluteString] forKey:@"url"];
		[self.proxy fireEvent:@"beforeload" withObject:event];
	}
}

- (void)webViewDidFinishLoad:(UIWebView *)webView
{
	if (spinner!=nil)
	{
		[UIView beginAnimations:@"webspiny" context:nil];
		[UIView setAnimationDuration:0.3];
		[spinner removeFromSuperview];
		[UIView commitAnimations];
		[spinner autorelease];
		spinner = nil;
	}
	if ([self.proxy _hasListeners:@"load"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:[url absoluteString] forKey:@"url"];
		[self.proxy fireEvent:@"load" withObject:event];
	}
}

- (void)webView:(UIWebView *)webView didFailLoadWithError:(NSError *)error
{
	if ([self.proxy _hasListeners:@"error"])
	{
		NSMutableDictionary *event = [NSMutableDictionary dictionaryWithObject:[url absoluteString] forKey:@"url"];
		[event setObject:[error description] forKey:@"message"];
		[self.proxy fireEvent:@"error" withObject:event];
	}
}

@end
