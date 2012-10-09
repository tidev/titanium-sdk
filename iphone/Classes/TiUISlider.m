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
#import "ImageLoader.h"

@implementation TiUISlider

-(void)dealloc
{
	[sliderView removeTarget:self action:@selector(sliderChanged:) forControlEvents:UIControlEventValueChanged];
	[sliderView removeTarget:self action:@selector(sliderBegin:) forControlEvents:UIControlEventTouchDown];
	[sliderView removeTarget:self action:@selector(sliderEnd:) forControlEvents:(UIControlEventTouchUpInside | UIControlEventTouchUpOutside | UIControlEventTouchCancel)];
	RELEASE_TO_NIL(sliderView);
	RELEASE_TO_NIL(lastTouchUp);
	[super dealloc];
}

-(void)layoutSubviews
{
    [super layoutSubviews];
    [sliderView setFrame:[self bounds]];
}

-(UISlider*)sliderView
{
	if (sliderView==nil)
	{
		sliderView = [[UISlider alloc] initWithFrame:[self bounds]];
		
		// We have to do this to force the slider subviews to appear, in the case where value<=min==0.
		// If the slider doesn't register a value change (or already have its subviews drawn in a nib) then
		// it will NEVER draw them.
		[sliderView setValue:0.1 animated:NO];
		[sliderView setValue:0 animated:NO];
		
		[sliderView addTarget:self action:@selector(sliderChanged:) forControlEvents:UIControlEventValueChanged];
		[sliderView addTarget:self action:@selector(sliderBegin:) forControlEvents:UIControlEventTouchDown];
		[sliderView addTarget:self action:@selector(sliderEnd:) forControlEvents:(UIControlEventTouchUpInside | UIControlEventTouchUpOutside | UIControlEventTouchCancel)];
		[self addSubview:sliderView];
		lastTouchUp = [[NSDate alloc] init];
		lastTimeInterval = 1.0; // Short-circuit so that we don't ignore the first fire
		
		thumbImageState = UIControlStateNormal;
		leftTrackImageState = UIControlStateNormal;
		rightTrackImageState = UIControlStateNormal;
	}
	return sliderView;
}

- (id)accessibilityElement
{
	return [self sliderView];
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
    NSURL *url = [TiUtils toURL:value proxy:[self proxy]];
    if (url==nil)
    {
        DebugLog(@"[WARN] could not find image: %@",[url absoluteString]);
        return;
    }
    
    UIImage* ret = [[ImageLoader sharedLoader] loadImmediateStretchableImage:url withLeftCap:rightTrackLeftCap topCap:rightTrackTopCap];

    [[self sliderView] setMaximumTrackImage:ret forState:state];
}

-(void)setLeftTrack:(id)value forState:(UIControlState)state
{
    NSURL *url = [TiUtils toURL:value proxy:[self proxy]];
    if (url==nil)
    {
        DebugLog(@"[WARN] could not find image: %@",[url absoluteString]);
        return;
    }
    
    UIImage* ret = [[ImageLoader sharedLoader] loadImmediateStretchableImage:url withLeftCap:leftTrackLeftCap topCap:leftTrackTopCap];


    [[self sliderView] setMinimumTrackImage:ret forState:state];
}


#pragma mark View controller stuff

-(void)setThumbImage_:(id)value
{
	[self setThumb:value forState:UIControlStateNormal];
	
	if ((thumbImageState & UIControlStateSelected)==0) {
		[self setThumb:value forState:UIControlStateSelected];
	}
	if ((thumbImageState & UIControlStateHighlighted)==0) {
		[self setThumb:value forState:UIControlStateHighlighted];
	}
	if ((thumbImageState & UIControlStateDisabled)==0) {
		[self setThumb:value forState:UIControlStateDisabled];
	}
}

-(void)setSelectedThumbImage_:(id)value
{
	[self setThumb:value forState:UIControlStateSelected];
	thumbImageState = thumbImageState | UIControlStateSelected;
}

-(void)setHighlightedThumbImage_:(id)value
{
	[self setThumb:value forState:UIControlStateHighlighted];
	thumbImageState = thumbImageState | UIControlStateHighlighted;
}

-(void)setDisabledThumbImage_:(id)value
{
	[self setThumb:value forState:UIControlStateDisabled];
	thumbImageState = thumbImageState | UIControlStateSelected;
}


-(void)setLeftTrackImage_:(id)value
{
	[self setLeftTrack:value forState:UIControlStateNormal];
	
	if ((leftTrackImageState & UIControlStateSelected)==0) {
		[self setLeftTrack:value forState:UIControlStateSelected];
	}
	if ((leftTrackImageState & UIControlStateHighlighted)==0) {
		[self setLeftTrack:value forState:UIControlStateHighlighted];
	}
	if ((leftTrackImageState & UIControlStateDisabled)==0) {
		[self setLeftTrack:value forState:UIControlStateDisabled];
	}
}

-(void)setSelectedLeftTrackImage_:(id)value
{
	[self setLeftTrack:value forState:UIControlStateSelected];
	leftTrackImageState = leftTrackImageState | UIControlStateSelected;
}

-(void)setHighlightedLeftTrackImage_:(id)value
{
	[self setLeftTrack:value forState:UIControlStateHighlighted];
	leftTrackImageState = leftTrackImageState | UIControlStateHighlighted;
}

-(void)setDisabledLeftTrackImage_:(id)value
{
	[self setLeftTrack:value forState:UIControlStateDisabled];
	leftTrackImageState = leftTrackImageState | UIControlStateDisabled;
}


-(void)setRightTrackImage_:(id)value
{
	[self setRightTrack:value forState:UIControlStateNormal];
	
	if ((rightTrackImageState & UIControlStateSelected)==0) {
		[self setRightTrack:value forState:UIControlStateSelected];
	}
	if ((rightTrackImageState & UIControlStateHighlighted)==0) {
		[self setRightTrack:value forState:UIControlStateHighlighted];
	}
	if ((rightTrackImageState & UIControlStateDisabled)==0) {
		[self setRightTrack:value forState:UIControlStateDisabled];
	}
}

-(void)setSelectedRightTrackImage_:(id)value
{
	[self setRightTrack:value forState:UIControlStateSelected];
	rightTrackImageState = rightTrackImageState | UIControlStateSelected;
}

-(void)setHighlightedRightTrackImage_:(id)value
{
	[self setRightTrack:value forState:UIControlStateHighlighted];
	rightTrackImageState = rightTrackImageState | UIControlStateHighlighted;
}

-(void)setDisabledRightTrackImage_:(id)value
{
	[self setRightTrack:value forState:UIControlStateDisabled];
	rightTrackImageState = rightTrackImageState | UIControlStateDisabled;
}

-(void)setLeftTrackLeftCap_:(id)value
{
	leftTrackLeftCap = TiDimensionFromObject(value);
}
-(void)setLeftTrackTopCap_:(id)value
{
	leftTrackTopCap = TiDimensionFromObject(value);
}
-(void)setRightTrackLeftCap_:(id)value
{
    rightTrackLeftCap = TiDimensionFromObject(value);
}
-(void)setRightTrackTopCap_:(id)value
{
	rightTrackTopCap = TiDimensionFromObject(value);
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
	// APPLE BUG: Sometimes in a double-click our 'UIControlEventTouchUpInside' event is fired more than once.  This is
	// ALWAYS indicated by a sub-0.1s difference between the clicks, and results in an additional fire of the event.
	// We have to track the PREVIOUS (not current) inverval and prevent these ugly misfires!
	
	NSDate* now = [[NSDate alloc] init];
	NSTimeInterval currentTimeInterval = [now timeIntervalSinceDate:lastTouchUp];
	if (!(lastTimeInterval < 0.1 && currentTimeInterval < 0.1)) {
		NSNumber * newValue = [NSNumber numberWithFloat:[(UISlider*)sender value]];
		if ([[self proxy] _hasListeners:@"touchend"])
		{
			[[self proxy] fireEvent:@"touchend" withObject:[NSDictionary dictionaryWithObject:newValue forKey:@"value"]];
		}	
	}
	lastTimeInterval = currentTimeInterval;
	RELEASE_TO_NIL(lastTouchUp);
	lastTouchUp = now;

}

@end

#endif