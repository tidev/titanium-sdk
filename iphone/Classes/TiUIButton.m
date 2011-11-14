/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIBUTTON

#import "TiUIButton.h"
#import "TiUIButtonProxy.h"

#import "TiUtils.h"
#import "ImageLoader.h"
#import "TiButtonUtil.h"

const UIControlEvents highlightingTouches = UIControlEventTouchDown|UIControlEventTouchDragEnter;
const UIControlEvents unHighlightingTouches = UIControlEventTouchCancel|UIControlEventTouchDragExit|UIControlEventTouchUpInside;


@implementation TiUIButton

#pragma mark Internal

-(void)dealloc
{
	[button removeTarget:self action:@selector(clicked:event:) forControlEvents:UIControlEventTouchUpInside];
	[button removeTarget:self action:@selector(highlightOn:) forControlEvents:highlightingTouches];
	[button removeTarget:self action:@selector(highlightOff:) forControlEvents:unHighlightingTouches];
	RELEASE_TO_NIL(button);
	[super dealloc];
}

-(UIView *) hitTest:(CGPoint)point withEvent:(UIEvent *)event {
	UIView *superResult = [super hitTest:point withEvent:event];
	
	if(superResult == nil) {
		return nil;
	}
	
	if([superResult isKindOfClass:[TiUIView class]] 
	   && ![(TiUIView*)superResult touchEnabled]) {
		return [self button];
	}

	return superResult;
}

-(BOOL)hasTouchableListener
{
	// since this guy only works with touch events, we always want them
	// just always return YES no matter what listeners we have registered
	return YES;
}

-(void)setHighlighting:(BOOL)isHiglighted
{
	TiUIButtonProxy * ourProxy = (TiUIButtonProxy *)[self proxy];
	
	NSArray * proxyChildren = [ourProxy children];
	for (TiViewProxy * thisProxy in proxyChildren)
	{
		TiUIView * thisView = [thisProxy view];
		if ([thisView respondsToSelector:@selector(setHighlighted:)])
		{
			[(id)thisView setHighlighted:isHiglighted];
		}
	}
}

-(void)handleControlEvents:(UIControlEvents)events
{
	eventAlreadyTriggered = YES;
	if (events & highlightingTouches) {
		[button setHighlighted:YES];
		[self setHighlighting:YES];
	}
	else if (events & unHighlightingTouches) {
		[button setHighlighted:NO];
		[self setHighlighting:NO];
	}
	eventAlreadyTriggered = NO;
	
	[super handleControlEvents:events];
}

-(IBAction)highlightOn:(id)sender
{
	[self setHighlighting:YES];
	if (!eventAlreadyTriggered && [self.proxy _hasListeners:@"touchstart"])
	{
		[self.proxy fireEvent:@"touchstart" withObject:nil];
	}
}

-(IBAction)highlightOff:(id)sender
{
	[self setHighlighting:NO];
	if (!eventAlreadyTriggered && [self.proxy _hasListeners:@"touchend"])
	{
		[self.proxy fireEvent:@"touchend" withObject:nil];
	}
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	[button setFrame:bounds];
}

-(void)clicked:(id)sender event:(UIEvent*)event
{
	if ([self.proxy _hasListeners:@"click"])
	{
		// TODO: This is not cool.  It COULD be that any control with 'specialized' handling like buttons does not report the same information as TiUIViews!
		// For now, let's just hack in some x and y...
		UITouch* touch = [[event touchesForView:sender] anyObject];
		NSMutableDictionary *evt = [NSMutableDictionary dictionaryWithDictionary:[TiUtils pointToDictionary:[touch locationInView:self]]];
		[evt setValue:[TiUtils pointToDictionary:[touch locationInView:nil]] forKey:@"globalPoint"];
		
		[self.proxy fireEvent:@"click" withObject:evt];
	}
}

-(UIButton*)button
{
	if (button==nil)
	{
		id backgroundImage = [self.proxy valueForKey:@"backgroundImage"];
        id backgroundImageS = [self.proxy valueForKey:@"backgroundSelectedImage"];
        id backgroundImageD = [self.proxy valueForKey:@"backgroundDisabledImage"];
        id backgroundImageF = [self.proxy valueForKey:@"backgroundFocusedImage"];
        
        hasBackgroundForStateNormal = backgroundImage  != nil ? YES :NO;
        hasBackgroundForStateDisabled = backgroundImageD != nil ? YES :NO;
        hasBackgroundForStateSelected = backgroundImageS != nil ? YES :NO;
        hasBackgroundForStateFocused = backgroundImageF != nil ? YES :NO;
        
        BOOL hasImage = hasBackgroundForStateDisabled||hasBackgroundForStateNormal;
		
        UIButtonType defaultType = (hasImage==YES) ? UIButtonTypeCustom : UIButtonTypeRoundedRect;
		style = [TiUtils intValue:[self.proxy valueForKey:@"style"] def:defaultType];
		UIView *btn = [TiButtonUtil buttonWithType:style];
		button = (UIButton*)[btn retain];
		[self addSubview:button];
		[TiUtils setView:button positionRect:self.bounds];
		if (style==UIButtonTypeCustom)
		{
			[button setTitleColor:[UIColor whiteColor] forState:UIControlStateHighlighted];
		}
		[button addTarget:self action:@selector(clicked:event:) forControlEvents:UIControlEventTouchUpInside];
		[button addTarget:self action:@selector(highlightOn:) forControlEvents:highlightingTouches];
		[button addTarget:self action:@selector(highlightOff:) forControlEvents:unHighlightingTouches];
		button.exclusiveTouch = YES;
	}
	return button;
}

#pragma mark Public APIs

-(void)setStyle_:(id)style_
{
	int s = [TiUtils intValue:style_ def:UIButtonTypeCustom];
	if (s == style)
	{
		return;
	}
	style = s;

	
	if (button==nil)
	{
		return;
	}

	RELEASE_TO_NIL(button);
	[self button];
}

-(void)setImage_:(id)value
{
	UIImage *image = value==nil ? nil : [TiUtils image:value proxy:(TiProxy*)self.proxy];
	if (image!=nil)
	{
		[[self button] setImage:image forState:UIControlStateNormal];
		
		// if the layout is undefined or auto, we need to take the size of the image
		//TODO: Refactor. This will cause problems if there's multiple setImages called,
		//Since we change the values of the proxy.
		LayoutConstraint *layoutProperties = [(TiViewProxy *)[self proxy] layoutProperties];
		BOOL reposition = NO;
		
		if (TiDimensionIsUndefined(layoutProperties->width) || TiDimensionIsAuto(layoutProperties->width))
		{
			layoutProperties->width.value = image.size.width;
			layoutProperties->width.type = TiDimensionTypePixels;
			reposition = YES;
		}
		if (TiDimensionIsUndefined(layoutProperties->height) || TiDimensionIsAuto(layoutProperties->height))
		{
			layoutProperties->height.value = image.size.height;
			layoutProperties->height.type = TiDimensionTypePixels;
		}
		if (reposition)
		{
			[(TiViewProxy *)[self proxy] contentsWillChange];			
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
	[[self button] setBackgroundImage:[self loadImage:value] forState:UIControlStateNormal];
    self.backgroundImage = value;
    
    //Match android behavior. Setting a background image sets it for all states unless overridden
    //TIMOB-5803
    if(!hasBackgroundForStateDisabled)
        [[self button] setBackgroundImage:[self loadImage:value] forState:UIControlStateDisabled];
    if(!hasBackgroundForStateFocused)
        [[self button] setBackgroundImage:[self loadImage:value] forState:UIControlStateHighlighted];
    if(!hasBackgroundForStateSelected)
        [[self button] setBackgroundImage:[self loadImage:value] forState:UIControlStateSelected];
    
}

-(void)setBackgroundDisabledImage_:(id)value
{
	[[self button] setBackgroundImage:[self loadImage:value] forState:UIControlStateDisabled];
    
    //Match android behavior. Setting a background image for disabled only sets it for all states unless overridden
    //TIMOB-5803
    if(!hasBackgroundForStateNormal)
    {
        [[self button] setBackgroundImage:[self loadImage:value] forState:UIControlStateNormal];
        self.backgroundImage = value;
    }
    if(!hasBackgroundForStateFocused)
        [[self button] setBackgroundImage:[self loadImage:value] forState:UIControlStateHighlighted];
    if(!hasBackgroundForStateSelected)
        [[self button] setBackgroundImage:[self loadImage:value] forState:UIControlStateSelected];
}

-(void)setBackgroundFocusedImage_:(id)value
{
	[[self button] setBackgroundImage:[self loadImage:value] forState:UIControlStateSelected];
}

-(void)setBackgroundSelectedImage_:(id)value
{
	[[self button] setBackgroundImage:[self loadImage:value] forState:UIControlStateHighlighted];
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

-(void)setTextAlign_:(id)align
{
	UIButton *b = [self button];
	if ([align isEqual:@"left"])
	{
		b.contentHorizontalAlignment = UIControlContentHorizontalAlignmentLeft;
		b.contentEdgeInsets = UIEdgeInsetsMake(0,10,0,0);
	}
	else if ([align isEqual:@"right"])
	{
		b.contentHorizontalAlignment = UIControlContentHorizontalAlignmentRight;
		b.contentEdgeInsets = UIEdgeInsetsMake(0,0,10,0);
	}
	else if ([align isEqual:@"center"])
	{
		b.contentHorizontalAlignment = UIControlContentHorizontalAlignmentCenter;
	}
}

-(CGFloat)autoWidthForWidth:(CGFloat)value
{
	return [[self button] sizeThatFits:CGSizeMake(value, 0)].width;
}

-(CGFloat)autoHeightForWidth:(CGFloat)value
{
	return [[self button] sizeThatFits:CGSizeMake(value, 0)].height;
}

@end

#endif