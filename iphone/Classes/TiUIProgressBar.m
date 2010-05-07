/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIPROGRESSBAR

#import "TiUIProgressBar.h"
#import "TiUtils.h"
#import "WebFont.h"

@implementation TiUIProgressBar

-(id)initWithStyle:(UIProgressViewStyle)style_
{
	if (self = [super initWithFrame:CGRectZero])
	{
		style = style_;
		min = 0;
		max = 1;
		[self setHidden:YES];
	}
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(progress);

	RELEASE_TO_NIL(messageLabel);
	RELEASE_TO_NIL(fontDesc);
	RELEASE_TO_NIL(textColor);
	[super dealloc];
}

#pragma mark Accessors

-(UIProgressView*)progress
{
	if (progress==nil)
	{
		progress = [[UIProgressView alloc] initWithProgressViewStyle:style];
		
		[self addSubview:progress];
	}
	return progress;
}

-(UILabel *)messageLabel
{
	if (messageLabel==nil)
	{
		messageLabel=[[UILabel alloc] init];
		[messageLabel setBackgroundColor:[UIColor clearColor]];
		if (fontDesc != nil)
		{
			[messageLabel setFont:[fontDesc font]];
		}
		
		if (textColor != nil)
		{
			[messageLabel setTextColor:textColor];
		}
		
		
		[self setNeedsLayout];
		[self addSubview:messageLabel];
	}
	return messageLabel;
}

#pragma mark Repositioning

-(void)layoutSubviews
{
	if(progress == nil)
	{
		return;
	}

	CGRect boundsRect = [self bounds];
	
	CGSize barSize = [progress sizeThatFits:boundsRect.size];

	CGPoint centerPoint = CGPointMake(boundsRect.origin.x + (boundsRect.size.width/2),
			boundsRect.origin.y + (boundsRect.size.height/2));

	[progress setBounds:CGRectMake(0, 0, barSize.width, barSize.height)];

	if (messageLabel == nil)
	{
		[progress setCenter:centerPoint];
		return;
	}

	CGSize messageSize = [messageLabel sizeThatFits:CGSizeZero];
	
	float fittingHeight = barSize.height + messageSize.height + 5;
	
	[progress setCenter:CGPointMake(centerPoint.x,
			centerPoint.y + (fittingHeight - barSize.height)/2)];

	[messageLabel setBounds:CGRectMake(0, 0, messageSize.width, messageSize.height)];
	[messageLabel setCenter:CGPointMake(centerPoint.x,
			centerPoint.y - (fittingHeight - messageSize.height)/2)];
}



-(BOOL)isFrameUndefined
{
	return (TiDimensionIsUndefined(self.layoutProperties->top) && TiDimensionIsUndefined(self.layoutProperties->bottom));
}

-(BOOL)isFrameAuto
{
	return (TiDimensionIsAuto(self.layoutProperties->top) || TiDimensionIsAuto(self.layoutProperties->bottom) ||
			TiDimensionIsAuto(self.layoutProperties->width) || TiDimensionIsAuto(self.layoutProperties->height));
}

#pragma mark Properties

-(void)setMin_:(id)value
{
	min = [TiUtils floatValue:value];
}

-(void)setMax_:(id)value
{
	max = [TiUtils floatValue:value];
}

-(void)setValue_:(id)value
{
	CGFloat newValue = ([TiUtils floatValue:value] - min) / (max-min);
	[[self progress] setProgress:newValue];
}


-(void)setFont_:(id)value
{
	WebFont * newFont = [TiUtils fontValue:value def:nil];
	if ((newFont == fontDesc) || ([fontDesc isEqual:newFont]))
	{
		return;
	}

	if (newFont == nil)
	{
		newFont = [WebFont defaultFont];
	}
	
	[fontDesc release];
	fontDesc = [newFont retain];

	if (messageLabel != nil) {
		[messageLabel setFont:[fontDesc font]];
	}
}


-(void)setColor_:(id)value
{
	UIColor * newColor = [[TiUtils colorValue:value] _color];
	[textColor release];
	textColor = [newColor retain];
	if (messageLabel != nil)
	{
		if (textColor == nil)
		{
			[messageLabel setTextColor:[UIColor blackColor]];
		}
		else
		{
			[messageLabel setTextColor:textColor];
		}
	}
}

-(void)setMessage_:(id)value
{
	NSString * text = [TiUtils stringValue:value];
	if ([text length]>0)
	{
		[[self messageLabel] setText:text];
	}
	else
	{
		[messageLabel removeFromSuperview];
		RELEASE_TO_NIL(messageLabel);
	}
	[self setNeedsLayout];
}


@end

#endif