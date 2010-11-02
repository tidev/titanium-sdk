/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UISLIDER

#import "TiUISlider.h"
#import "TiUISliderProxy.h"
#import "TiUtils.h"

@implementation TiUISlider

-(void)dealloc
{
	[sliderView removeTarget:self action:@selector(sliderChanged:) forControlEvents:UIControlEventValueChanged];
	[sliderView removeTarget:self action:@selector(sliderBegin:) forControlEvents:UIControlEventTouchDown];
	[sliderView removeTarget:self action:@selector(sliderEnd:) forControlEvents:(UIControlEventTouchUpInside | UIControlEventTouchUpOutside)];
	RELEASE_TO_NIL(sliderView);
	[super dealloc];
}

-(UISlider*)sliderView
{
	if (sliderView==nil)
	{
		sliderView = [[UISlider alloc] initWithFrame:[self bounds]];
		[sliderView setAutoresizingMask:UIViewAutoresizingFlexibleWidth];
		
		// We have to do this to force the slider subviews to appear, in the case where value<=min==0.
		// If the slider doesn't register a value change (or already have its subviews drawn in a nib) then
		// it will NEVER draw them.
		[sliderView setValue:0.1 animated:NO];
		[sliderView setValue:0 animated:NO];
		
		[sliderView addTarget:self action:@selector(sliderChanged:) forControlEvents:UIControlEventValueChanged];
		[sliderView addTarget:self action:@selector(sliderBegin:) forControlEvents:UIControlEventTouchDown];
		[sliderView addTarget:self action:@selector(sliderEnd:) forControlEvents:(UIControlEventTouchUpInside | UIControlEventTouchUpOutside)];
		[self addSubview:sliderView];
	}
	return sliderView;
}

-(BOOL)hasTouchableListener
{
	// since this guy only works with touch events, we always want them
	// just always return YES no matter what listeners we have registered
	return YES;
}

-(void)setThumb:(id)value forState:(UIControlState)state
{
	[[self sliderView] setThumbImage:[TiUtils image:value proxy:[self proxy]] forState:state];
}

-(void)setRightTrack:(id)value forState:(UIControlState)state
{
	[[self sliderView] setMaximumTrackImage:[TiUtils stretchableImage:value proxy:[self proxy]] forState:state];
}

-(void)setLeftTrack:(id)value forState:(UIControlState)state
{
	[[self sliderView] setMinimumTrackImage:[TiUtils stretchableImage:value proxy:[self proxy]] forState:state];
}


#pragma mark View controller stuff

-(void)setThumbImage_:(id)value
{
	[self setThumb:value forState:UIControlStateNormal];
}

-(void)setSelectedThumbImage_:(id)value
{
	[self setThumb:value forState:UIControlStateSelected];
}

-(void)setHighlightedThumbImage_:(id)value
{
	[self setThumb:value forState:UIControlStateHighlighted];
}

-(void)setDisabledThumbImage_:(id)value
{
	[self setThumb:value forState:UIControlStateDisabled];
}


-(void)setLeftTrackImage_:(id)value
{
	[self setLeftTrack:value forState:UIControlStateNormal];
}

-(void)setSelectedLeftTrackImage_:(id)value
{
	[self setLeftTrack:value forState:UIControlStateSelected];
}

-(void)setHighlightedLeftTrackImage_:(id)value
{
	[self setLeftTrack:value forState:UIControlStateHighlighted];
}

-(void)setDisabledLeftTrackImage_:(id)value
{
	[self setLeftTrack:value forState:UIControlStateDisabled];
}


-(void)setRightTrackImage_:(id)value
{
	[self setRightTrack:value forState:UIControlStateNormal];
}

-(void)setSelectedRightTrackImage_:(id)value
{
	[self setRightTrack:value forState:UIControlStateSelected];
}

-(void)setHighlightedRightTrackImage_:(id)value
{
	[self setRightTrack:value forState:UIControlStateHighlighted];
}

-(void)setDisabledRightTrackImage_:(id)value
{
	[self setRightTrack:value forState:UIControlStateDisabled];
}

-(void)setMin_:(id)value
{
	[[self sliderView] setMinimumValue:[TiUtils floatValue:value]];
}

-(void)setMax_:(id)value
{
	[[self sliderView] setMaximumValue:[TiUtils floatValue:value]];
}

-(void)setValue_:(id)value withObject:(id)properties
{
	CGFloat newValue = [TiUtils floatValue:value];
	BOOL animated = [TiUtils boolValue:@"animated" properties:properties def:NO];
	UISlider * ourSlider = [self sliderView];
	[ourSlider setValue:newValue animated:animated];
	[self sliderChanged:ourSlider];
}

-(void)setValue_:(id)value
{
	[self setValue_:value withObject:nil];
}

-(void)setEnabled_:(id)value
{
	[[self sliderView] setEnabled:[TiUtils boolValue:value]];
}

-(CGFloat)verifyHeight:(CGFloat)suggestedHeight
{
	CGSize fitSize = [[self sliderView] sizeThatFits:CGSizeZero];
	return fitSize.height;
}

USE_PROXY_FOR_VERIFY_AUTORESIZING

#pragma mark Delegates 

- (IBAction)sliderChanged:(id)sender
{
	NSNumber * newValue = [NSNumber numberWithFloat:[(UISlider *)sender value]];
	[self.proxy replaceValue:newValue forKey:@"value" notification:NO];
	
	if ([self.proxy _hasListeners:@"change"])
	{
		[self.proxy fireEvent:@"change" withObject:[NSDictionary dictionaryWithObject:newValue forKey:@"value"]];
	}
}

-(IBAction)sliderBegin:(id)sender
{
	NSNumber * newValue = [NSNumber numberWithFloat:[(UISlider*)sender value]];
	if ([[self proxy] _hasListeners:@"touchstart"])
	{
		[[self proxy] fireEvent:@"touchstart" withObject:[NSDictionary dictionaryWithObject:newValue forKey:@"value"]];
	 }
}

-(IBAction)sliderEnd:(id)sender
{
	NSNumber * newValue = [NSNumber numberWithFloat:[(UISlider*)sender value]];
	if ([[self proxy] _hasListeners:@"touchend"])
	{
		[[self proxy] fireEvent:@"touchend" withObject:[NSDictionary dictionaryWithObject:newValue forKey:@"value"]];
	}
}

@end

#endif