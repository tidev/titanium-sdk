/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"
#import "TiTextLabel.h"


@implementation TiTextLabel
@synthesize font,textColor,text,highlightedTextColor,highlighted,textAlignment;

- (id)initWithFrame:(CGRect)frame
{
	if (self = [super initWithFrame:frame]) 
	{
		[self setOpaque:NO];
		
		// need a default font
		font = [[UIFont systemFontOfSize:[UIFont labelFontSize]] retain];
	}
	return self;
}

- (void)drawRect:(CGRect)rect
{
	if (highlighted)
	{
		[highlightedTextColor set];
	} 
	else 
	{
		[textColor set];
	}
	
	[text drawInRect:[self bounds] withFont:font lineBreakMode:UILineBreakModeTailTruncation alignment:textAlignment];
}

- (void) dealloc
{
	RELEASE_TO_NIL(text);
	RELEASE_TO_NIL(textColor);
	RELEASE_TO_NIL(highlightedTextColor);
	RELEASE_TO_NIL(font);
	[super dealloc];
}


@end
