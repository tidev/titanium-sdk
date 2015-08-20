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
#import "UIModule.h"


@implementation TiUIButton

#pragma mark Internal

-(void)dealloc
{
	[button removeTarget:self action:NULL forControlEvents:UIControlEventAllTouchEvents];
	RELEASE_TO_NIL(button);
	RELEASE_TO_NIL(backgroundImageCache)
	RELEASE_TO_NIL(backgroundImageUnstretchedCache);
	[super dealloc];
}

-(UIView *) hitTest:(CGPoint)point withEvent:(UIEvent *)event {
	UIView *superResult = [super hitTest:point withEvent:event];
	
	if(superResult == nil) {
		return nil;
	}
	
	if ([superResult isKindOfClass:[TiUIView class]]
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
    [[self button] setHighlighted:isHiglighted];
}

-(void)postLayoutEvent
{
    [super postLayoutEvent];
    [self updateBackgroundImage];
}

-(void)updateBackgroundImage
{
	CGRect bounds = [self bounds];
	if ((backgroundImageCache == nil) || (bounds.size.width == 0) || (bounds.size.height == 0)) {
		[button setBackgroundImage:nil forState:UIControlStateNormal];
		return;
	}
	CGSize imageSize = [backgroundImageCache size];
	if((bounds.size.width>=imageSize.width) && (bounds.size.height>=imageSize.height)){
		[button setBackgroundImage:backgroundImageCache forState:UIControlStateNormal];
		return;
	}
    //If the bounds are smaller than the image size render it in an imageView and get the image of the view.
    //Should be pretty inexpensive since it happens rarely. TIMOB-9166
    CGSize unstrechedSize = (backgroundImageUnstretchedCache != nil) ? [backgroundImageUnstretchedCache size] : CGSizeZero;
    if (backgroundImageUnstretchedCache == nil || !CGSizeEqualToSize(unstrechedSize,bounds.size) ) {
        UIImageView* theView = [[UIImageView alloc] initWithFrame:bounds];
        [theView setImage:backgroundImageCache];
        UIGraphicsBeginImageContextWithOptions(bounds.size, [theView.layer isOpaque], 0.0);
        [theView.layer renderInContext:UIGraphicsGetCurrentContext()];
        UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
        UIGraphicsEndImageContext();
        RELEASE_TO_NIL(backgroundImageUnstretchedCache);
        backgroundImageUnstretchedCache = [image retain];
        [theView release];
    }
	[button setBackgroundImage:backgroundImageUnstretchedCache forState:UIControlStateNormal];	
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
                fireActionEvent = [touch tapCount] == 1 ? @"click" : ([touch tapCount] == 2 ? @"dblclick" : nil);
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

-(void)didMoveToWindow
{
    [super didMoveToWindow];
}

-(UIButton*)button
{
	if (button==nil)
	{
        BOOL hasImage = [self.proxy valueForKey:@"backgroundImage"]!=nil;
		
        UIButtonType defaultType = (hasImage==YES) ? UIButtonTypeCustom : UIButtonTypeRoundedRect;
		style = [TiUtils intValue:[self.proxy valueForKey:@"style"] def:defaultType];
		UIView *btn = [TiButtonUtil buttonWithType:style];
		button = (UIButton*)[btn retain];
        // new API for autolayout, must be called
        [self setInnerView:button];
        [self setDefaultHeight:TiDimensionAutoSize];
        [self setDefaultWidth:TiDimensionAutoSize];
		if (style==UIButtonTypeCustom)
		{
			[button setTitleColor:[UIColor whiteColor] forState:UIControlStateHighlighted];
		}
		[button addTarget:self action:@selector(controlAction:forEvent:) forControlEvents:UIControlEventAllTouchEvents];
		button.exclusiveTouch = YES;
	}
	return button;
}

- (id)accessibilityElement
{
	return [self button];
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
	[backgroundImageCache release];
	RELEASE_TO_NIL(backgroundImageUnstretchedCache);
	backgroundImageCache = [[self loadImage:value] retain];
    self.backgroundImage = value;
	[self updateBackgroundImage];
}

-(void)setBackgroundSelectedImage_:(id)value
{
	[[self button] setBackgroundImage:[self loadImage:value] forState:UIControlStateHighlighted];
}

-(void)setBackgroundDisabledImage_:(id)value
{
	[[self button] setBackgroundImage:[self loadImage:value] forState:UIControlStateDisabled];
}

-(void)setBackgroundFocusedImage_:(id)value
{
	[[self button] setBackgroundImage:[self loadImage:value] forState:UIControlStateSelected];
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

-(void)setDisabledColor_:(id)color
{
    if (color!=nil) {
        TiColor *selColor = [TiUtils colorValue:color];
        UIButton *b = [self button];
        if (selColor!=nil) {
            [b setTitleColor:[selColor _color] forState:UIControlStateDisabled];
        }
    }
}

-(void)setShadowColor_:(id)color
{
    if (color==nil) {
        [[self button] setTitleShadowColor:nil forState:UIControlStateNormal];
    } else {
        color = [TiUtils colorValue:color];
        [[self button] setTitleShadowColor:[color color] forState:UIControlStateNormal];
    }
}

-(void)setShadowOffset_:(id)value
{
	CGPoint p = [TiUtils pointValue:value];
	CGSize size = {p.x,p.y};
	[[[self button] titleLabel] setShadowOffset:size];
}

-(void)setVerticalAlign_:(id)args
{
    UIButton *b = [self button];
    if ([args isKindOfClass:[NSString class]])
    {
        if ([args isEqualToString:@"top"])
        {
            [b setContentVerticalAlignment:UIControlContentVerticalAlignmentTop];
            [b setNeedsLayout];
            return;
        }
        if ([args isEqualToString:@"middle"] || [args isEqualToString:@"center"])
        {
            [b setContentVerticalAlignment:UIControlContentVerticalAlignmentCenter];
            [b setNeedsLayout];
            return;
        }
        [b setContentVerticalAlignment:UIControlContentVerticalAlignmentBottom];
        [b setNeedsLayout];
        return;
    }
    else if ([args isKindOfClass:[NSNumber class]])
    {
        [b setContentVerticalAlignment:[TiUtils intValue:args]];
        [b setNeedsLayout];
        return;
    }
}

-(void)setTextAlign_:(id)align
{
	UIButton *b = [self button];
    if ([align isKindOfClass:[NSString class]]) {
        
        if ([align isEqual:@"left"])
        {
            [b setContentHorizontalAlignment: UIControlContentHorizontalAlignmentLeft];
            [b setNeedsLayout];
            return;
        }
        if ([align isEqual:@"right"])
        {
            [b setContentHorizontalAlignment: UIControlContentHorizontalAlignmentRight];
            [b setNeedsLayout];
            return;
        }
        if ([align isEqual:@"center"])
        {
            [b setContentHorizontalAlignment:UIControlContentHorizontalAlignmentCenter];
            [b setNeedsLayout];
            return;
        }
    } else if ([align isKindOfClass:[NSNumber class]]) {
        
        NSTextAlignment current = (NSTextAlignment)[TiUtils intValue:align];
        UIControlContentHorizontalAlignment actual = UIControlContentHorizontalAlignmentCenter;
        
        if (current == NSTextAlignmentCenter) {
            actual = UIControlContentHorizontalAlignmentCenter;
        } else if (current == NSTextAlignmentLeft) {
            actual = UIControlContentHorizontalAlignmentLeft;
        } else if (current == NSTextAlignmentRight) {
            actual = UIControlContentHorizontalAlignmentRight;
        }
        
        [b setContentHorizontalAlignment:actual];
        [b setNeedsLayout];
        return;
    }
}

@end

#endif