/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIACTIVITYINDICATOR

#import "TiUIActivityIndicator.h"
#import "TiViewProxy.h"
#import "TiUtils.h"
#import "WebFont.h"
#import "Webcolor.h"

@implementation TiUIActivityIndicator

- (id) init
{
	self = [super init];
	if (self != nil) {
		style = UIActivityIndicatorViewStyleWhite;
		[self setHidden:YES];
	}
	return self;
}


-(void)dealloc
{
	RELEASE_TO_NIL(indicatorView);
	RELEASE_TO_NIL(messageLabel);
	RELEASE_TO_NIL(fontDesc);
	RELEASE_TO_NIL(textColor);
	[super dealloc];
}

-(CGSize)sizeThatFits:(CGSize)testSize;
{
	CGSize spinnySize = [[self indicatorView] sizeThatFits:CGSizeZero];
	if (messageLabel == nil)
	{
		return spinnySize;
	}
	CGSize messageSize = [messageLabel sizeThatFits:CGSizeZero];
	
	return CGSizeMake(spinnySize.width + 5 + messageSize.width, MAX(spinnySize.height,messageSize.height));
}

-(void)layoutSubviews
{
	if(indicatorView == nil)
	{
		return;
	}

	CGRect boundsRect = [self bounds];
	CGPoint centerPoint = CGPointMake(boundsRect.origin.x + (boundsRect.size.width/2),
			boundsRect.origin.y + (boundsRect.size.height/2));

	if (messageLabel == nil)
	{
		[indicatorView setCenter:centerPoint];
		return;
	}

	CGSize spinnySize = [[self indicatorView] sizeThatFits:CGSizeZero];
	CGSize messageSize = [messageLabel sizeThatFits:CGSizeZero];
	
	float fittingWidth = spinnySize.width + messageSize.width + 5;
	
	[indicatorView setCenter:CGPointMake(centerPoint.x - (fittingWidth - spinnySize.width)/2, centerPoint.y)];

	[messageLabel setBounds:CGRectMake(0, 0, messageSize.width, messageSize.height)];
	[messageLabel setCenter:CGPointMake(centerPoint.x + (fittingWidth - messageSize.width)/2, centerPoint.y)];
}

-(UIActivityIndicatorView*)indicatorView
{
	if (indicatorView==nil)
	{
		indicatorView = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:style];
		[self setNeedsLayout];
		[self addSubview:indicatorView];
	}
	return indicatorView;
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

- (id)accessibilityElement
{
	return [self messageLabel];
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	[self setNeedsLayout];
    [super frameSizeChanged:frame bounds:bounds];
}

#pragma mark View controller stuff

-(void)setVisible_:(id)visible
{
	if ([TiUtils boolValue:visible])
	{
		[[self indicatorView] startAnimating];
		[self setHidden:NO];
	}
	else
	{
		[indicatorView stopAnimating];
		[self setHidden:YES];
	}
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


-(void)setStyle_:(id)value
{
	int newStyle = [TiUtils intValue:value];
	
	if (style == newStyle)
	{
		return;
	}
	
	style = newStyle;
	
	if (indicatorView != nil)
	{
		[indicatorView setActivityIndicatorViewStyle:style];
		CGRect newBounds;
		newBounds.origin = CGPointZero;
		newBounds.size = [indicatorView sizeThatFits:CGSizeZero];
		[indicatorView setBounds:newBounds];
		if (messageLabel != nil) {
			[self setNeedsLayout];
		}
	}

}

-(CGFloat)contentWidthForWidth:(CGFloat)suggestedWidth
{
	return [self sizeThatFits:CGSizeZero].width;
}

-(CGFloat)contentHeightForWidth:(CGFloat)width
{
	return [self sizeThatFits:CGSizeZero].height;
}

@end


#endif