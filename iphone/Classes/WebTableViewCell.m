/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "WebTableViewCell.h"

@implementation WebTableViewCell
@synthesize htmlLabel;

- (id)initWithFrame:(CGRect)frame reuseIdentifier:(NSString *)reuseIdentifier;
{
	self = [super initWithFrame:frame reuseIdentifier:reuseIdentifier];
	if (self != nil){
		UIView * cellContentView = [self contentView];
		htmlLabel = [[UIWebView alloc] initWithFrame:[cellContentView frame]];
		[htmlLabel setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
		[htmlLabel setAlpha:0.0];
		[htmlLabel setDelegate:self];
		[htmlLabel setExclusiveTouch:NO];
		[htmlLabel setUserInteractionEnabled:NO];
		[htmlLabel setBackgroundColor:[UIColor clearColor]];
		[htmlLabel setOpaque:NO];
		[cellContentView addSubview:htmlLabel];
	}
	return self;
}

- (void)prepareForReuse;
{
	[htmlLabel stopLoading];
	[htmlLabel setAlpha:0.0];
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

- (void)webViewDidFinishLoad:(UIWebView *)inputWebView;
{
	[self updateState:NO];
	[UIView beginAnimations:@"webView" context:nil];
	[UIView setAnimationDuration:0.1];
	[inputWebView setAlpha:1.0];
	[UIView commitAnimations];
}	

@end
