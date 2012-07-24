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
	RELEASE_TO_NIL(viewGroupWrapper);
	RELEASE_TO_NIL(backgroundImageCache)
	RELEASE_TO_NIL(backgroundImageUnstretchedCache);
	[super dealloc];
}

-(UIView *) hitTest:(CGPoint)point withEvent:(UIEvent *)event {
	UIView *superResult = [super hitTest:point withEvent:event];
	
	if(superResult == nil) {
		return nil;
	}
	
	if((viewGroupWrapper == superResult) || ([superResult isKindOfClass:[TiUIView class]] 
	   && ![(TiUIView*)superResult touchEnabled])) {
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
	for (TiUIView * thisView in [viewGroupWrapper subviews])
	{
		if ([thisView respondsToSelector:@selector(setHighlighted:)])
		{
			[(id)thisView setHighlighted:isHiglighted];
		}
	}
}

-(void)updateBackgroundImage
{
	CGRect bounds = [self bounds];
	[button setFrame:bounds];
	if ((backgroundImageCache == nil) || CGSizeEqualToSize(bounds.size, CGSizeZero)) {
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

-(void)layoutSubviews
{
	[super layoutSubviews];
	[self updateBackgroundImage];
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
        BOOL hasImage = [self.proxy valueForKey:@"backgroundImage"]!=nil;
		
        UIButtonType defaultType = (hasImage==YES) ? UIButtonTypeCustom : UIButtonTypeRoundedRect;
		style = [TiUtils intValue:[self.proxy valueForKey:@"style"] def:defaultType];
		UIView *btn = [TiButtonUtil buttonWithType:style];
		button = (UIButton*)[btn retain];
		[self addSubview:button];
		if (style==UIButtonTypeCustom)
		{
			[button setTitleColor:[UIColor whiteColor] forState:UIControlStateHighlighted];
		}
		[button addTarget:self action:@selector(controlAction:forEvent:) forControlEvents:UIControlEventAllTouchEvents];
		button.exclusiveTouch = YES;
	}
	if ((viewGroupWrapper != nil) && ([viewGroupWrapper	superview]!=button)) {
		[viewGroupWrapper setFrame:[button bounds]];
		[button addSubview:viewGroupWrapper];
	}
	return button;
}

-(UIView *) viewGroupWrapper
{
	if (viewGroupWrapper == nil) {
		viewGroupWrapper = [[UIView alloc] initWithFrame:[self bounds]];
		[viewGroupWrapper setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
	}
	if (button != [viewGroupWrapper superview]) {
		if (button != nil) {
			[viewGroupWrapper setFrame:[button bounds]];
			[button addSubview:viewGroupWrapper];
		}
		else {
			[viewGroupWrapper removeFromSuperview];
		}
	}
	return viewGroupWrapper;
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

-(void)setTextAlign_:(id)alignment
{
    UIButton *b = [self button];
    [[b titleLabel] setTextAlignment:[TiUtils textAlignmentValue:alignment]];
}

-(void)setShadowColor_:(id)color
{
	UIButton *b = [self button];
	if (color==nil)
	{
		[[b titleLabel] setShadowColor:nil];
	}
	else
	{
		color = [TiUtils colorValue:color];
		[b setTitleShadowColor:[color _color] forState:UIControlStateNormal];
	}
}

-(void)setShadowOffset_:(id)value
{
	UIButton *b = [self button];
	CGPoint p = [TiUtils pointValue:value];
	CGSize size = {p.x,p.y};
	[[b titleLabel] setShadowOffset:size];
}

-(void)setTitlePadding_:(id)value
{
	UIButton *b = [self button];
	CGPoint p = [TiUtils pointValue:value];
	b.titleEdgeInsets=UIEdgeInsetsMake(p.y, p.x, p.y, p.x);
}

-(void)setWordWrap_:(id)value
{
    UIButton *b = [self button];
    BOOL shouldWordWrap = [TiUtils boolValue:value def:YES];
    if (shouldWordWrap)
        [[b titleLabel] setLineBreakMode:UILineBreakModeWordWrap];
    else 
        [[b titleLabel] setLineBreakMode:UILineBreakModeTailTruncation];
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
