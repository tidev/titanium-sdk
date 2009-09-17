/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "PickerImageTextCell.h"


@implementation PickerImageTextCell
@synthesize imageView,textLabel;

- (id)initWithFrame:(CGRect)frame {
    if (self = [super initWithFrame:frame]) {
        // Initialization code
    }
    return self;
}

- (void)setImageView: (UIImageView *) newImageView;
{
	if(imageView == newImageView)return;
	[imageView removeFromSuperview];
	[imageView release];
	imageView = [newImageView retain];
	[self addSubview:imageView];
}

- (UIImageView *) imageView;
{
	if(imageView==nil){
		imageView = [[UIImageView alloc] initWithFrame:CGRectZero];
		[imageView setBackgroundColor:[UIColor clearColor]];
		[self addSubview:imageView];
	}
	
	return imageView;
}

- (void)setTextLabel: (UILabel *) newTextLabel;
{
	if(textLabel == newTextLabel)return;
	[textLabel removeFromSuperview];
	[textLabel release];
	textLabel = [newTextLabel retain];
	[self addSubview:textLabel];
}

- (UILabel *) textLabel;
{
	if(textLabel==nil){
		textLabel = [[UILabel alloc] initWithFrame:CGRectZero];
		[textLabel setShadowColor:[UIColor whiteColor]];
		[textLabel setShadowOffset:CGSizeMake(0,1)];
		[textLabel setBackgroundColor:[UIColor clearColor]];
		[self addSubview:textLabel];
	}

	return textLabel;
}

- (void)layoutSubviews;
{
	CGRect remainingFrame = [self frame];

	if(imageView != nil){
		CGRect imageRect = [imageView frame];
		imageRect.origin.x=5;
		imageRect.origin.y=(remainingFrame.size.height - imageRect.size.height)/2;
		remainingFrame.origin = CGPointMake(imageRect.size.width + 10, 0);
		[imageView setFrame:imageRect];
		[textLabel setTextAlignment:UITextAlignmentLeft];
	} else {
		remainingFrame.origin = CGPointMake(5, 0);
		[textLabel setTextAlignment:UITextAlignmentCenter];
	}

	remainingFrame.size.width -= remainingFrame.origin.x;
	[textLabel setFrame:remainingFrame];
}

- (void)dealloc {
	[imageView release];
	[textLabel release];
    [super dealloc];
}


@end
