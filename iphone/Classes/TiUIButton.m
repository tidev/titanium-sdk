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
#import "TiUIView.h"

@implementation TiUIButton

#pragma mark Internal

-(void)dealloc
{
	[button removeTarget:self action:NULL forControlEvents:UIControlEventAllTouchEvents];
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

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	[button setFrame:bounds];
    [super frameSizeChanged:frame bounds:bounds];
}

- (void)controlAction:(id)sender forEvent:(UIEvent *)event
{
    UITouch *touch = [[event allTouches] anyObject];
    NSString *fireEvent;
    NSString * fireActionEvent = nil;
    switch (touch.phase) {
        case UITouchPhaseBegan:
            if (touchStarted) {
                return;
            }
            touchStarted = YES;
            fireEvent = @"touchstart";
            break;
        case UITouchPhaseMoved:
            fireEvent = @"touchmove";
            break;
        case UITouchPhaseEnded:
            touchStarted = NO;
            fireEvent = @"touchend";
            if (button.highlighted) {
                fireActionEvent = [touch tapCount] < 2 ? @"click" : @"dblclick";
            }
            break;
        case UITouchPhaseCancelled:
            touchStarted = NO;
            fireEvent = @"touchcancel";
            break;
        default:
            return;
    }
    [self setHighlighting:button.highlighted];
    NSMutableDictionary *evt = [NSMutableDictionary dictionaryWithDictionary:[TiUtils pointToDictionary:[touch locationInView:self]]];
    if ((fireActionEvent != nil) && [self.proxy _hasListeners:fireActionEvent]) {
        [self.proxy fireEvent:fireActionEvent withObject:evt];
    }
	if ([self.proxy _hasListeners:fireEvent]) {
		[self.proxy fireEvent:fireEvent withObject:evt];
	}
}

-(UIButton*)button
{
	if (button==nil)
	{
		TiUIButtonProxy * ourProxy = (TiUIButtonProxy *)[self proxy];
		id backgroundImage = [ourProxy valueForKey:@"backgroundImage"];
        id backgroundImageS = [ourProxy valueForKey:@"backgroundSelectedImage"];
        id backgroundImageD = [ourProxy valueForKey:@"backgroundDisabledImage"];
        id backgroundImageF = [ourProxy valueForKey:@"backgroundFocusedImage"];
        
        hasBackgroundForStateNormal = backgroundImage  != nil;
        hasBackgroundForStateDisabled = backgroundImageD != nil;
        hasBackgroundForStateSelected = backgroundImageS != nil;
        hasBackgroundForStateFocused = backgroundImageF != nil;
        
        BOOL hasImage = hasBackgroundForStateDisabled||hasBackgroundForStateNormal;
		
        UIButtonType defaultType = (hasImage==YES) ? UIButtonTypeCustom : UIButtonTypeRoundedRect;
		style = [TiUtils intValue:[ourProxy valueForKey:@"style"] def:defaultType];
		UIView *btn = [TiButtonUtil buttonWithType:style];
		button = (UIButton*)[btn retain];
		[self addSubview:button];
		[TiUtils setView:button positionRect:self.bounds];
		if (style==UIButtonTypeCustom)
		{
			[button setTitleColor:[UIColor whiteColor] forState:UIControlStateHighlighted];
			//Enable Touch Highlight with Custom Button Type 
			//when no selectedstate background image is specified 
			//or selectedstate background image is same as main backgroundImage
			
			id test = hasBackgroundForStateNormal ? backgroundImage : backgroundImageD;
			if (!hasBackgroundForStateSelected || [test isEqual:backgroundImageS] )
			{
				/*
				 *	TIMOB-8054: SuppressGlow is to bring the old 1.7.x behavior while not
				 *	regressing on 1.8 behavior. We should revisit the behavior if possible.
				 */
				BOOL useGlow = ![TiUtils boolValue:[ourProxy valueForKey:@"suppressGlow"] def:NO];
				[button setShowsTouchWhenHighlighted:useGlow];
			}
		}
		[button addTarget:self action:@selector(controlAction:forEvent:) forControlEvents:UIControlEventAllTouchEvents];
		button.exclusiveTouch = YES;
	}
	return button;
}

#pragma mark Public APIs

-(void)setSuppressGlow_:(id)value
{
	/*
	 *	TIMOB-8054: SuppressGlow is to bring the old 1.7.x behavior while not
	 *	regressing on 1.8 behavior. The odd logic here is to replicate the
	 *	1.8 decisions made during -[TiUIButton button]. We should revisit the
	 *	behavior at a later date if needed.
	 */
	if (button == nil) {
		return;
	}
	BOOL newSuppress = [TiUtils boolValue:value def:NO];
	if (newSuppress || (style != UIButtonTypeCustom)) {
		[button setShowsTouchWhenHighlighted:NO];
		return;
	}
	if (!hasBackgroundForStateSelected){
		[button setShowsTouchWhenHighlighted:YES];
		return;
	}
	TiUIButtonProxy * ourProxy = (TiUIButtonProxy *)[self proxy];
	id backgroundImageS = [ourProxy valueForKey:@"backgroundSelectedImage"];
	NSString * testString = hasBackgroundForStateNormal?@"backgroundImage":@"backgroundDisabledImage";
	id test = [ourProxy valueForKey:testString];
	
	[button setShowsTouchWhenHighlighted:[backgroundImageS isEqual:test]];
}

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
			layoutProperties->width.type = TiDimensionTypeDip;
			reposition = YES;
		}
		if (TiDimensionIsUndefined(layoutProperties->height) || TiDimensionIsAuto(layoutProperties->height))
		{
			layoutProperties->height.value = image.size.height;
			layoutProperties->height.type = TiDimensionTypeDip;
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
        [[self button] setBackgroundImage:[self loadImage:value] forState:UIControlStateSelected];
    if(!hasBackgroundForStateSelected)
        [[self button] setBackgroundImage:[self loadImage:value] forState:UIControlStateHighlighted];
    
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
        [[self button] setBackgroundImage:[self loadImage:value] forState:UIControlStateSelected];
    if(!hasBackgroundForStateSelected)
        [[self button] setBackgroundImage:[self loadImage:value] forState:UIControlStateHighlighted];
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

-(CGFloat)contentWidthForWidth:(CGFloat)value
{
	return [[self button] sizeThatFits:CGSizeMake(value, 0)].width;
}

-(CGFloat)contentHeightForWidth:(CGFloat)value
{
	return [[self button] sizeThatFits:CGSizeMake(value, 0)].height;
}

@end

#endif