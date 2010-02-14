/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIButton.h"
#import "TiUtils.h"
#import "ImageLoader.h"
#import "TiButtonUtil.h"

@implementation TiUIButton

#pragma mark Internal

-(void)dealloc
{
	[button removeTarget:self action:@selector(clicked:) forControlEvents:UIControlEventTouchUpInside];
	RELEASE_TO_NIL(button);
	[super dealloc];
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	self.frame = CGRectIntegral(self.frame);
	[TiUtils setView:button positionRect:bounds];
}

-(BOOL)viewSupportsBaseTouchEvents
{
	// since we need to control enabled events and click events, we turn off base
	// class event handling
	return NO;
}

-(void)clicked:(id)event
{
	if ([self.proxy _hasListeners:@"click"])
	{
		[self.proxy fireEvent:@"click" withObject:nil];
	}
}

-(UIButton*)button
{
	if (button==nil)
	{
		id backgroundImage = [self.proxy valueForKey:@"backgroundImage"];
		UIButtonType defaultType = backgroundImage!=nil ? UIButtonTypeCustom : UIButtonTypeRoundedRect;
		id style = [self.proxy valueForKey:@"style"];
		int type = style!=nil ? [TiUtils intValue:style] : defaultType;
		UIView *btn = [TiButtonUtil buttonWithType:type];
		button = (UIButton*)[btn retain];
		[self addSubview:button];
		if (style==nil)
		{
			[TiUtils setView:button positionRect:self.bounds];
		}
		else
		{
			// if we use a system button, we use it's frame
			self.frame = btn.frame;
			if (style==UIButtonTypeCustom)
			{
				[button setTitleColor:[UIColor whiteColor] forState:UIControlStateHighlighted];
			}
			LayoutConstraint *layout = [self layout];
			// attempt to set the size if a system button and auto
			if (TiDimensionIsAuto(layout->width) ||
				TiDimensionIsUndefined(layout->width))
			{
				[self.proxy replaceValue:NUMFLOAT(btn.frame.size.width) forKey:@"width" notification:YES];
			}
			if (TiDimensionIsAuto(layout->height) ||
				TiDimensionIsUndefined(layout->height))
			{
				[self.proxy replaceValue:NUMFLOAT(btn.frame.size.height) forKey:@"height" notification:YES];
			}
		}
		[button addTarget:self action:@selector(clicked:) forControlEvents:UIControlEventTouchUpInside];
	}
	return button;
}

#pragma mark Public APIs

-(void)setStyle_:(id)style
{
	if (button!=nil)
	{
		RELEASE_TO_NIL(button);
	}
	[self button];
}

-(void)setImage_:(id)value
{
	UIImage *image = value==nil ? nil : [TiUtils image:value proxy:(TiProxy*)self.proxy];
	if (image!=nil)
	{
		[[self button] setImage:image forState:UIControlStateNormal];
		
		// if the layout is undefined or auto, we need to take the size of the image
		LayoutConstraint *layout = [self layout];
		BOOL reposition = NO;
		
		if (TiDimensionIsUndefined(layout->width) || TiDimensionIsAuto(layout->width))
		{
			layout->width.value = image.size.width;
			layout->width.type = TiDimensionTypePixels;
			reposition = YES;
		}
		if (TiDimensionIsUndefined(layout->height) || TiDimensionIsAuto(layout->height))
		{
			layout->height.value = image.size.height;
			layout->height.type = TiDimensionTypePixels;
		}
		if (reposition)
		{
			[self reposition];
		}
	}
	else
	{
		[[self button] setImage:nil forState:UIControlStateNormal];
	}
}

-(void)setEnabled_:(id)value
{
	[[self button] setEnabled:[TiUtils boolValue:value]];
}

-(void)setTitle_:(id)value
{
	[[self button] setTitle:[TiUtils stringValue:value] forState:UIControlStateNormal];
}

-(void)setBackgroundImage_:(id)value
{
	if (value!=nil)
	{
		[[self button] setBackgroundImage:[self loadImage:value] forState:UIControlStateNormal];
	}
}

-(void)setBackgroundSelectedImage_:(id)value
{
	if (value!=nil)
	{
		[[self button] setBackgroundImage:[self loadImage:value] forState:UIControlStateHighlighted];
	}
}

-(void)setBackgroundDisabledImage_:(id)value
{
	if (value!=nil)
	{
		[[self button] setBackgroundImage:[self loadImage:value] forState:UIControlStateDisabled];
	}
}

-(void)setBackgroundColor_:(id)value
{
	if (value!=nil)
	{
		TiColor *color = [TiUtils colorValue:value];
		[[self button] setBackgroundColor:[color _color]];
	}
}

-(void)setFont_:(id)font
{
	if (font!=nil)
	{
		WebFont *f = [TiUtils fontValue:font def:nil];
		[[[self button] titleLabel] setFont:[f font]];
	}
}

-(void)setColor_:(id)color
{
	if (color!=nil)
	{
		TiColor *c = [TiUtils colorValue:color];
		UIButton *b = [self button];
		if (c!=nil)
		{
			[b setTitleColor:[c _color] forState:UIControlStateNormal];
		}
		else if (b.buttonType==UIButtonTypeCustom)
		{
			[b setTitleColor:[UIColor blackColor] forState:UIControlStateNormal];
		}
	}
}

-(void)setSelectedColor_:(id)color
{
	if (color!=nil)
	{
		TiColor *selColor = [TiUtils colorValue:color];
		UIButton *b = [self button];
		if (selColor!=nil)
		{
			[b setTitleColor:[selColor _color] forState:UIControlStateHighlighted];
		}
		else if (b.buttonType==UIButtonTypeCustom)
		{
			[b setTitleColor:[UIColor whiteColor] forState:UIControlStateHighlighted];
		}
	}
}

@end
