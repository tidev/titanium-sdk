/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUITableViewTitle.h"
#import "TiBase.h"

@implementation TiUITableViewTitle

@synthesize text,textColor,textAlignment,font;


- (id)initWithFrame:(CGRect)frame       
{
	if (self = [super initWithFrame:frame]) 
	{
		[self setOpaque:NO];
		[self setBackgroundColor:[UIColor clearColor]];
	}
	return self;
}

- (void)drawRect:(CGRect)rect
{
	[textColor set];
	CGRect labelBounds = [self bounds];
	UIFont * fontToUse = nil;
	if(textAlignment == UITextAlignmentLeft)
	{
		labelBounds.origin.y += 8;
		labelBounds.size.height -= 8;
		labelBounds.origin.x += 18;
		labelBounds.size.width -= 18;
		fontToUse = [UIFont boldSystemFontOfSize:[UIFont labelFontSize]];
	} 
	else if (textAlignment == UITextAlignmentCenter) 
	{
		labelBounds.origin.y += 7;
		labelBounds.size.height -= 7;
		fontToUse = [UIFont systemFontOfSize:[UIFont labelFontSize]-1.5];
	}
	[text drawInRect:labelBounds withFont:(font==nil ? fontToUse : font) lineBreakMode:UILineBreakModeTailTruncation alignment:textAlignment];
}

- (void) dealloc
{
	RELEASE_TO_NIL(text);
	RELEASE_TO_NIL(textColor);
	[super dealloc];
}

@end
