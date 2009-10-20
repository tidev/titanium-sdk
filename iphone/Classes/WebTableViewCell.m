/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "WebTableViewCell.h"
#import "SBJSON.h"
#import "TitaniumHost.h"

@interface WebViewWasher : NSObject<UIWebViewDelegate>
{
	NSString * baseMessage;
	NSMutableSet * cleanedWebViews;
	NSMutableSet * dirtyWebViews;
}

- (void) takeDirtyWebView: (UIWebView *) oldWebView;
- (UIWebView *) giveCleanWebView;

@end

WebViewWasher * sharedWebWasher = nil;

@implementation WebViewWasher

- (id) init
{
	self = [super init];
	if (self != nil) {
		baseMessage = [[NSString alloc] initWithFormat:@"<base href=\"%@\" /><body></body>",[[[TitaniumHost sharedHost] appBaseUrl] absoluteString]];
	}
	return self;
}


- (void) takeDirtyWebView: (UIWebView *) oldWebView;
{
	return; //No dirties!
	
	if([dirtyWebViews count] > 16)return; //If there's too many, we don't want any more. Just dispose them.

	[oldWebView setDelegate:self];
	[oldWebView loadHTMLString:baseMessage baseURL:nil];
	
	if(dirtyWebViews==nil){
		dirtyWebViews = [[NSMutableSet alloc] initWithObjects:oldWebView,nil];
	} else if([dirtyWebViews count] < 6){ 
		[dirtyWebViews addObject:oldWebView];
	}
}

- (UIWebView *) giveCleanWebView;
{
	UIWebView * result = [cleanedWebViews anyObject];
	if (result != nil){
		[[result retain] autorelease];
		[result setDelegate:nil];
		[cleanedWebViews removeObject:result];
		return result;
	}
	
	result = [[UIWebView alloc] init];
	[result setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
	[result setExclusiveTouch:NO];
	[result setUserInteractionEnabled:NO];
	[result setBackgroundColor:[UIColor clearColor]];
	[result setScalesPageToFit:NO];
	[result setOpaque:NO];
	NSString * injection = [NSString stringWithFormat:@"document.write('%@')",baseMessage];
	[result stringByEvaluatingJavaScriptFromString:injection];
	return [result autorelease];
}

- (void)webViewDidFinishLoad:(UIWebView *)webView;
{
	if(cleanedWebViews == nil){
		cleanedWebViews = [[NSMutableSet alloc] initWithObjects:webView,nil];
	} else {
		[cleanedWebViews addObject:webView];
	}
	[dirtyWebViews removeObject:webView];
}


@end



@implementation WebTableViewCell
@synthesize htmlLabel;

//Okay, the issue is that drawing is asychronous as well, so there's a CPU-bound flicker of stuff even with our inline stuff.
//So we need some way to clear house and make sure 



- (id)initWithFrame:(CGRect)frame reuseIdentifier:(NSString *)reuseIdentifier;
{
	self = [super initWithFrame:frame reuseIdentifier:reuseIdentifier];
	if (self != nil){
		if(sharedWebWasher==nil){
			sharedWebWasher = [[WebViewWasher alloc] init];
		}
		UIView * cellContentView = [self contentView];
		htmlLabel = [[sharedWebWasher giveCleanWebView] retain];
		CGRect cellFrame = [cellContentView frame];
		cellFrame.origin = CGPointZero;
//		NSLog(@"Making new webviewcell with dimensions %f by %f",cellFrame.size.width,cellFrame.size.height);
		[htmlLabel setFrame:cellFrame];
		[cellContentView addSubview:htmlLabel];
	}
	return self;
}

- (void)prepareForReuse;
{
	[sharedWebWasher takeDirtyWebView:htmlLabel];
	[htmlLabel removeFromSuperview];
	[htmlLabel release];
	
	UIView * cellContentView = [self contentView];
	htmlLabel = [[sharedWebWasher giveCleanWebView] retain];
	CGRect cellFrame = [cellContentView frame];
	cellFrame.origin = CGPointZero;
//	NSLog(@"Reusing webviewcell with dimensions %f by %f",cellFrame.size.width,cellFrame.size.height);
	[htmlLabel setFrame:cellFrame];
	[cellContentView addSubview:htmlLabel];

	[super prepareForReuse];
}

- (void)updateState: (BOOL) animated;
{
	BOOL hilighted;
	if([self respondsToSelector:@selector(isHighlighted)]) hilighted = [self isHighlighted];
	else hilighted = [self isSelected];

	if (hilighted) {
		[htmlLabel stringByEvaluatingJavaScriptFromString:@"document.body.style['color']='white';"];
	} else if ([self accessoryType] == UITableViewCellAccessoryCheckmark){
		[htmlLabel stringByEvaluatingJavaScriptFromString:@"document.body.style['color']='#374F82';"];
	} else {
		[htmlLabel stringByEvaluatingJavaScriptFromString:@"document.body.style['color']='black';"];
	}

}

- (void)setHighlighted:(BOOL)hilighted animated:(BOOL)animated;
{
	[super setHighlighted:hilighted animated:animated];
	[self updateState:animated];
}

- (void)setSelected:(BOOL)selected animated:(BOOL)animated;
{
	[super setSelected:selected animated:animated];
	[self updateState:animated];
}


- (void)dealloc {
	[htmlLabel setDelegate:nil];
	[htmlLabel release];
    [super dealloc];
}

- (void) setHTML: (NSString *) htmlString;
{
	NSString * injection = [NSString stringWithFormat:@"document.body.innerHTML=%@;",[SBJSON stringify:htmlString]];
	[htmlLabel stringByEvaluatingJavaScriptFromString:injection];
}

@end
