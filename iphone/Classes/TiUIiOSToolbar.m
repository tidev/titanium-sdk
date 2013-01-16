/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UIIOSTOOLBAR) || defined(USE_TI_UITOOLBAR)

#import "TiUIiOSToolbar.h"
#import "TiViewProxy.h"
#import "TiUtils.h"
#import "TiColor.h"
#import "TiToolbarButton.h"
#import "TiToolbar.h"

@implementation TiUIiOSToolbar

-(void)dealloc
{
	[self performSelector:@selector(setItems_:) withObject:nil];
	RELEASE_TO_NIL(toolBar);
	[super dealloc];
}

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

- (id)accessibilityElement
{
	return [self toolBar];
}

-(void)layoutSubviews
{
	CGRect ourBounds = [self bounds];
	CGFloat height = ourBounds.size.height;	
	if (height != [self verifyHeight:height])
	{
		[(TiViewProxy *)[self proxy] willChangeSize];
		return;
	}


	CGRect toolBounds;
	toolBounds.size = [[self toolBar] sizeThatFits:ourBounds.size];
	toolBounds.origin.x = 0.0;
	toolBounds.origin.y = hideTopBorder?-1.0:0.0;
	[toolBar setFrame:toolBounds];
}


-(void)drawRect:(CGRect)rect
{
	[super drawRect:rect];
	if (!showBottomBorder)
	{
		return;
	}

	CGRect toolFrame = [self bounds];

    CGContextRef context = UIGraphicsGetCurrentContext();
    CGContextSetGrayStrokeColor(context, 0.0, 1.0);
	CGContextSetLineWidth(context, 1.0);
	CGContextSetShouldAntialias(context,false);
	CGPoint bottomBorder[2];
	
	CGFloat x = toolFrame.origin.x;
	CGFloat y = toolFrame.origin.y+toolFrame.size.height;
	if ([self respondsToSelector:@selector(contentScaleFactor)] && [self contentScaleFactor] > 1.0)
	{ //Yes, this seems very hackish. Very low priority would be to use something more elegant.
		y -= 0.5;
	}
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
		for (TiViewProxy * thisProxy in value) {
			ENSURE_CLASS(thisProxy,proxyClass);
			if (![thisProxy supportsNavBarPositioning])
			{
				//TODO: This is an exception that should have been raised long ago.
				DebugLog(@"[ERROR] %@ does not support being in a toolbar!",thisProxy);
				//continue;
			}
			if ([thisProxy conformsToProtocol:@protocol(TiToolbarButton)])
			{
				[(id<TiToolbarButton>)thisProxy setToolbar:(id<TiToolbar>)self.proxy];
			}
            [thisProxy windowWillOpen];
			[result addObject:[thisProxy barButtonItem]];
            [thisProxy windowDidOpen];
		}
		[[self toolBar] setItems:result];
	}
	else 
	{
		UIToolbar *toolbar = [self toolBar];
		if (toolbar!=nil)
		{
			for (id thisProxy in [toolbar items])
			{
				if ([thisProxy conformsToProtocol:@protocol(TiToolbarButton)])
				{
					[(id<TiToolbarButton>)thisProxy setToolbar:nil];
				}
			}
		}
		[toolbar setItems:nil];
	}
}

-(void)setBorderTop_:(id)value
{
	hideTopBorder = ![TiUtils boolValue:value def:YES];
	[(TiViewProxy *)[self proxy] willChangeSize];
	//The default is that a top border exists.
}

-(void)setBorderBottom_:(id)value
{
	showBottomBorder = [TiUtils boolValue:value def:NO];
	[(TiViewProxy *)[self proxy] willChangeSize];
	//The default is that there is no bottom border.
}

-(void)setBarColor_:(id)value
{
	TiColor * newBarColor = [TiUtils colorValue:value];
	
	[[self toolBar] setBarStyle:[TiUtils barStyleForColor:newBarColor]];
	[toolBar setTintColor:[TiUtils barColorForColor:newBarColor]];
	[toolBar setTranslucent:[TiUtils barTranslucencyForColor:newBarColor]];
}

-(void)setTranslucent_:(id)value
{
	[toolBar setTranslucent:[TiUtils boolValue:value]];
}


-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	[super frameSizeChanged:frame bounds:bounds];
	CGFloat height = bounds.size.height;
	
	if (height != [self verifyHeight:height])
	{
		[(TiViewProxy *)[self proxy] willChangeSize];
	}
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

@end

#endif
