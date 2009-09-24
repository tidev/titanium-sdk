/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TitaniumImageViewController.h"
#import "TweakedScrollView.h"
#import "TitaniumHost.h"

@implementation TitaniumImageView
@synthesize delegate;

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event
{
	UITouch * ourTouch = [[event touchesForView:self] anyObject];
	CGPoint ourTouchLocation = [ourTouch locationInView:self];
	CGRect ourBounds = [self bounds];
	if(!CGRectContainsPoint(ourBounds, ourTouchLocation))return;
	
	if([delegate respondsToSelector:@selector(handleTouch:)])[delegate handleTouch:ourTouch];
}


@end


@implementation TitaniumImageViewController


- (void)didReceiveMemoryWarning {
	// Releases the view if it doesn't have a superview.
    [super didReceiveMemoryWarning];
	
	// Release any cached data, images, etc that aren't in use.
}


- (void)dealloc {
	[imageView release];
    [super dealloc];
}

- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
{
	if(![inputState isKindOfClass:[NSDictionary class]])return;
	
	NSString * imageUrlObject = [inputState objectForKey:@"url"];
	if([imageUrlObject isKindOfClass:[NSString class]]){
		[singleImageUrl release];
		singleImageUrl = [[NSURL URLWithString:imageUrlObject relativeToURL:baseUrl] retain];
	}
	
}

- (UIView *) view;
{
	CGRect viewFrame;
	viewFrame.origin = CGPointZero;
	viewFrame.size = preferredViewSize;
	if(imageView==nil){
		imageView = [[TitaniumImageView alloc] initWithFrame:viewFrame];
		[imageView setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
		[imageView setUserInteractionEnabled:YES];
		[imageView setDelegate:self];
		[imageView setImage:[[TitaniumHost sharedHost] imageForResource:singleImageUrl]];
	}
	if(!scrollEnabled){
		return imageView;
	}
	if(scrollView==nil){
		scrollView = [[TweakedScrollView alloc] initWithFrame:viewFrame];
		viewFrame.size = [[imageView image] size];
		[scrollView setContentSize:viewFrame.size];
		[imageView setFrame:viewFrame];
		[scrollView addSubview:imageView];
	}

	return scrollView;
}

- (void) setView: (UIView *) newView;
{
	if(newView==nil){
		[scrollView release];
		scrollView = nil;
		[imageView release];
		imageView = nil;
	}
}

- (void) handleTouch: (UITouch *) ourTouch;
{
	NSLog(@"We're touched. Now what? %@",ourTouch);
}

@end
