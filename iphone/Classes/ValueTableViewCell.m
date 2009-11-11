/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "ValueTableViewCell.h"

@implementation ValueTableViewCell
@synthesize valueLabel;

- (void)dealloc {
	[valueLabel release];
    [super dealloc];
}

- (void)setText: (NSString *) newText;
{
	[super setText:newText];
	[[self contentView] addSubview:valueLabel];
}

- (id)initWithFrame:(CGRect)frame reuseIdentifier:(NSString *)reuseIdentifier;
{
	self = [super initWithFrame:frame reuseIdentifier:reuseIdentifier];
	if (self != nil){
		UIView * cellContentView = [self contentView];
		valueLabel = [[UILabel alloc] initWithFrame:CGRectInset([cellContentView frame],10,5)];
		[valueLabel setTextAlignment:UITextAlignmentRight];
		[valueLabel setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
		[valueLabel setBackgroundColor:[UIColor clearColor]];
		[valueLabel setOpaque:NO];
		[cellContentView addSubview:valueLabel];
	}
	return self;
}

- (void) layoutSubviews;
{
	[super layoutSubviews];
	for (UIView * thisView in [[self contentView] subviews]) {
		[thisView setBackgroundColor:[UIColor clearColor]];
	}
}


- (void)setHighlighted:(BOOL)hilighted animated:(BOOL)animated;
{
	[super setHighlighted:hilighted animated:animated];
	[valueLabel setHighlighted:hilighted];
 }

@end
