/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUIWebViewProxy.h"
#import "TiUtils.h"
#import "TiHost.h"
#import "SBJSON.h"

static int webPageToken = 0;

@implementation TiUIWebViewProxy

@synthesize url;

-(void)dealloc
{
	//FIXME: [[TiHost sharedHost] unregisterPage:[self pageContext]];
	
	RELEASE_TO_NIL(url);
	RELEASE_TO_NIL(webview);
	[super dealloc];
}

-(void)release
{
	[super release];
}

-(TiHost*)host
{
	return [self _host];
}

-(void)_initWithProperties:(NSDictionary*)properties
{
	[super _initWithProperties:properties];
	
	NSURL *u = [TiUtils toURL:[properties objectForKey:@"url"] proxy:self];
	[self setUrl:u];
	
	//TODO: preload, etc
}

-(void)open:(id)args
{
	ENSURE_UI_THREAD(open,args);
	
	NSDictionary *opts = nil;
	
	if (args!=nil && [args count] > 0 && [[args objectAtIndex:0] isKindOfClass:[NSDictionary class]])
	{
		opts = [args objectAtIndex:0];
	}
	
	// create a new pagetoken and overwrite our existing page 
	[pageToken release];
	pageToken = [[NSString stringWithFormat:@"w$%d",webPageToken++] retain];
	
	BOOL fullscreen = NO;
	if (opts!=nil)
	{
		id fs = [opts objectForKey:@"fullscreen"];
		fullscreen = [fs boolValue];
	}
	
	// create a webview
	webview = [[UIWebView alloc] initWithFrame:[[self _view] bounds]];
	webview.delegate = self;
	[webview setOpaque:YES];
	[[self _view] addSubview:webview];
	[webview release];
	
	// the HTML to load in
	NSMutableString *html = [[NSMutableString alloc] init];
	
	//TODO: for now we're mainly reading in from disk, in the future we need to read from memory as before
//	[html appendString:@"<script>"];
//	NSString *jsPath = [[NSBundle mainBundle] pathForResource:@"tiboot" ofType:@"js"];
//	NSURL *jsurl = [NSURL fileURLWithPath:jsPath];
//	[html appendString:[NSString stringWithContentsOfURL:jsurl encoding:NSUTF8StringEncoding error:nil]];	
	// inject in our pageToken
//	[html appendFormat:@"Ti._pageToken='%@';", pageToken];
//	[html appendString:@"</script>"];


	//FIXME
	[html appendString:[NSString stringWithContentsOfURL:url encoding:NSUTF8StringEncoding error:nil]];	
//	NSLog(@"HTML = %@",html);
	
	//FIXME: [[TiHost sharedHost] registerPage:pageToken evaluator:self];
	
	// load the webview content
	[webview loadHTMLString:html baseURL:url];
	
	[html release];
	
	
	/*
	//FIXME: for now we're just adding
	UIWindow *window = [[UIApplication sharedApplication] keyWindow];
	CGRect frame = [window frame];
	CGRect statusFrame = [[UIApplication sharedApplication] statusBarFrame];
	webview.frame = fullscreen ? CGRectMake(0,0,frame.size.width,frame.size.height) : CGRectMake(frame.origin.x, frame.origin.y+statusFrame.size.height, frame.size.width, frame.size.height);
	
	[window addSubview:webview];
	[window bringSubviewToFront:webview];
	[window makeKeyAndVisible];
	
	[[UIApplication sharedApplication] setStatusBarHidden:fullscreen animated:NO];
	 */
}

-(void)close:(id)args
{
	ENSURE_UI_THREAD(close,args);
	
	if (webview!=nil)
	{
		[webview removeFromSuperview];
		[webview release];
		webview = nil;
	}
}

-(void)show:(id)args
{
	[self open:args];
}

-(void)hide:(id)args
{
	//FIXME
}

#pragma mark WebView Delegate

- (void)webViewDidStartLoad:(UIWebView *)webView
{
	NSLog(@"[DEBUG] webview started loading: %@", url);
}

- (void)webViewDidFinishLoad:(UIWebView *)webView
{
	NSLog(@"[DEBUG] webview finished loading: %@", url);
}

- (void)webView:(UIWebView *)webView didFailLoadWithError:(NSError *)error
{
	NSLog(@"[DEBUG] webview failed loading: %@. error: %@", url, error);
}

#pragma mark TiEvaluator

- (void)evalJS:(NSString*)code
{
	[webview stringByEvaluatingJavaScriptFromString:code];
}

- (void)evalFile:(NSString*)file
{
	//TODO:
	NSLog(@"[ERROR] evalFile not yet implemented for WebView");
}

-(void)fireEvent:(id)listener withObject:(id)obj remove:(BOOL)yn thisObject:(id)thisObject_
{
	NSString *args = [SBJSON stringify:obj];
	NSString *js = [NSString stringWithFormat:@"Ti.BridgeCallback('%@',%@,%d)",listener,args,yn];
	[self evalJS:js];
}

- (id)preloadForKey:(id)key
{
	return nil;
}

#pragma mark -

@end

