/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUITableViewValueCell.h"
#import "TiBase.h"

@implementation TiUITableViewValueCell



- (void)setText: (NSString *) newText
{
	valueLabel.text = newText;
	[[self contentView] addSubview:valueLabel];
}

- (id)initWithStyle:(UITableViewCellStyle)style reuseIdentifier:(NSString *)reuseIdentifier
{
	if (self = [super initWithStyle:style reuseIdentifier:reuseIdentifier])
	{
		UIView * cellContentView = [self contentView];
		RELEASE_TO_NIL(valueLabel);
		valueLabel = [[UILabel alloc] initWithFrame:CGRectInset([cellContentView bounds],10,5)];
		[valueLabel setTextAlignment:UITextAlignmentRight];
		[valueLabel setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
		[valueLabel setBackgroundColor:[UIColor clearColor]];
		[valueLabel setOpaque:NO];
		[cellContentView addSubview:valueLabel];
	}
	return self;
}

- (void) layoutSubviews
{
	[super layoutSubviews];
	for (UIView * thisView in [[self contentView] subviews]) 
	{
		[thisView setBackgroundColor:[UIColor clearColor]];
	}
}

- (void)setHighlighted:(BOOL)hilighted animated:(BOOL)animated
{
	[super setHighlighted:hilighted animated:animated];
	[valueLabel setHighlighted:hilighted];
}

@end
