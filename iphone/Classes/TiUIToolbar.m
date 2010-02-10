/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUIToolbar.h"
#import "TiUIViewProxy.h"
#import "TiUtils.h"
#import "TiColor.h"

@implementation TiUIToolbar

-(UIToolbar *)toolBar
{
	if (toolBar == nil)
	{
		toolBar = [[UIToolbar alloc] initWithFrame:[self bounds]];
		[toolBar setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleBottomMargin];
		[self addSubview:toolBar];
		[self setClipsToBounds:YES];
	}
	return toolBar;
}

-(void)layoutSubviews
{
	CGRect ourBounds = [self bounds];
	CGRect toolBounds = [[self toolBar] bounds];
	toolBounds.size = [toolBar sizeThatFits:toolBounds.size];
	CGPoint toolBarCenter = CGPointMake(ourBounds.size.width/2, toolBounds.size.height/2);
	if (hideTopBorder)
	{
		toolBarCenter.y -= 1.0;
	}

	[toolBar setBounds:toolBounds];
	[toolBar setCenter:toolBarCenter];
}


-(void)drawRect:(CGRect)rect
{
	[super drawRect:rect];
	if (!showBottomBorder)
	{
		return;
	}

	CGRect toolFrame = [TiUtils viewPositionRect:toolBar];

    CGContextRef context = UIGraphicsGetCurrentContext();
    CGContextSetGrayStrokeColor(context, 0.0, 1.0);
	CGPoint bottomBorder[2];
	
	CGFloat x = toolFrame.origin.x;
	CGFloat y = toolFrame.origin.y+toolFrame.size.height+1;
	bottomBorder[0]=CGPointMake(x,y);
	x += toolFrame.size.width;
	bottomBorder[1]=CGPointMake(x,y);
	CGContextStrokeLineSegments(context,bottomBorder,2);
}


-(void)setItems_:(id)value
{
	ENSURE_TYPE_OR_NIL(value,NSArray);
	if (value!=nil)
	{
		NSMutableArray * result = [NSMutableArray arrayWithCapacity:[value count]];
		Class proxyClass = [TiViewProxy class];
		for (TiUIViewProxy * thisProxy in value) {
			ENSURE_CLASS(thisProxy,proxyClass);
			if (![thisProxy supportsNavBarPositioning])
			{
				//TODO: This is an exception that should have been raised long ago.
				NSLog(@"ERROR: %@ does not support NavBar positioning!",thisProxy);
				//continue;
			}
			[result addObject:[thisProxy barButtonItem]];
		}
		[[self toolBar] setItems:result];
	}
	else 
	{
		[[self toolBar] setItems:nil];
	}
}

-(void)setBorderTop_:(id)value
{
	hideTopBorder = ![TiUtils boolValue:value def:YES];
	[self reposition];
	//The default is that a top border exists.
}

-(void)setBorderBottom_:(id)value
{
	showBottomBorder = [TiUtils boolValue:value def:NO];
	[self reposition];
	//The default is that there is no bottom border.
}

-(void)setBarColor_:(id)value
{
	UIColor * newBarColor = [[TiUtils colorValue:value] _color];

	if (newBarColor == nil)
	{
		[[self toolBar] setBarStyle:UIBarStyleDefault];
		[toolBar setTintColor:nil];
		[toolBar setTranslucent:NO];
		return;
	}

	if (newBarColor == [UIColor clearColor])
	{
		[[self toolBar] setTintColor:nil];
		[toolBar setTranslucent:YES];
		[toolBar setBarStyle:UIBarStyleBlack];
		return;
	}

	[toolBar setBarStyle:UIBarStyleBlack];
	[toolBar setTintColor:newBarColor];
}

-(void)setTranslucent_:(id)value
{
	[toolBar setTranslucent:[TiUtils boolValue:value]];
}

-(CGFloat)verifyHeight:(CGFloat)suggestedHeight
{
	CGFloat result = [[self toolBar] sizeThatFits:CGSizeZero].height;
	if (hideTopBorder)
	{
		result -= 1.0;
	}
	if (showBottomBorder)
	{
		result += 1.0;
	}
	return result;
}

-(UIViewAutoresizing)verifyAutoresizing:(UIViewAutoresizing)suggestedResizing
{
	return suggestedResizing & ~UIViewAutoresizingFlexibleHeight;
}

@end

