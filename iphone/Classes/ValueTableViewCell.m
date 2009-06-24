//
//  ValueTableViewCell.m
//  Titanium
//
//  Created by Blain Hamon on 6/23/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

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

- (void)setHighlighted:(BOOL)hilighted animated:(BOOL)animated;
{
	[super setHighlighted:hilighted animated:animated];
	[valueLabel setHighlighted:hilighted];
 }

@end
