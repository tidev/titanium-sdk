/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSSTEPPER
#import "TiUIiOSStepper.h"
#import "TiUIiOSStepperProxy.h"
#import "TiUtils.h"

@implementation TiUIiOSStepper

-(UIStepper*)stepper
{
    if (stepper ==nil)
    {
        stepper = [[[UIStepper alloc]init] retain];
        [stepper setMaximumValue:100];
        [stepper setMinimumValue:0];
        [stepper addTarget:self action:@selector(stepperChanged:) forControlEvents:UIControlEventValueChanged];
        [stepper addTarget:self action:@selector(stepperTouch:forEvent:) forControlEvents:UIControlEventTouchDown];
        [self addSubview:stepper];

    }
    return stepper;
}

-(void)dealloc
{
    [stepper removeTarget:self action:@selector(stepperChanged:) forControlEvents:UIControlEventValueChanged];
    [stepper removeTarget:self action:@selector(stepperTouch:forEvent:) forControlEvents:UIControlEventTouchDown];
    RELEASE_TO_NIL(stepper);
    RELEASE_TO_NIL(backgroundImageCache);
    [super dealloc];
}
-(void)setContinuous_:(id)value
{
    [[self stepper] setContinuous:[TiUtils boolValue:value]];
}

-(void)setAutorepeat_:(id)value
{
    [[self stepper] setAutorepeat:[TiUtils boolValue:value]];
}

-(void)setWraps_:(id)value
{
   [[self stepper] setWraps:[TiUtils boolValue:value]];
}

-(void)setMaximumValue_:(id)value
{
    ENSURE_TYPE(value, NSNumber)
    [[self stepper] setMaximumValue:[TiUtils doubleValue:value]];
}

-(void)setMinimumValue_:(id)value
{
    ENSURE_TYPE(value, NSNumber)
    [[self stepper] setMinimumValue:[TiUtils doubleValue:value]];
}

-(void)setStepValue_:(id)value
{
    ENSURE_TYPE(value, NSNumber)
    NSNumber *stepValue = (NSNumber*)value;
    if (stepValue > 0) {
        [[self stepper] setStepValue:[TiUtils doubleValue:value]];
    } else {
        NSLog(@"[WARN]: The stepValue must be bigger than 0");
    }
}
-(void)setTintColor_:(id)value
{
    [[self stepper] setTintColor:[[TiUtils colorValue:value] color]];
}

-(void)setBackgroundImage_:(id)value
{
    backgroundImageCache = [self imageWithImage:[self loadImage:value] fullScale:YES];
    [[self stepper] setBackgroundImage:backgroundImageCache forState:UIControlStateNormal];
}

-(void)setBackgroundSelectedImage_:(id)value
{
    backgroundImageCache = [self imageWithImage:[self loadImage:value] fullScale:YES];
    [[self stepper] setBackgroundImage:backgroundImageCache forState:UIControlStateHighlighted];
}

-(void)setBackgroundDisabledImage_:(id)value
{
    backgroundImageCache = [self imageWithImage:[self loadImage:value] fullScale:YES];
    [[self stepper] setBackgroundImage:backgroundImageCache forState:UIControlStateDisabled];
}

-(void)setBackgroundFocusedImage_:(id)value
{
    backgroundImageCache = [self imageWithImage:[self loadImage:value] fullScale:YES];
    [[self stepper] setBackgroundImage:backgroundImageCache forState:UIControlStateSelected];
}
#pragma mark Decrement backGroundImage
-(void)setDecrementImage_:(id)value
{
    backgroundImageCache = [self imageWithImage:[self loadImage:value] fullScale:NO];
    [[self stepper] setDecrementImage:backgroundImageCache forState:UIControlStateNormal];
}

-(void)setDecrementSelectedImage_:(id)value
{
    backgroundImageCache = [self imageWithImage:[self loadImage:value] fullScale:NO];
    [[self stepper] setDecrementImage:[self loadImage:value] forState:UIControlStateSelected];
}
-(void)setDecrementDisabledImage_:(id)value
{
    [[self stepper] setDecrementImage:[self loadImage:value] forState:UIControlStateDisabled];
}
-(void)setDecrementFocusedImage_:(id)value
{
    backgroundImageCache = [self imageWithImage:[self loadImage:value] fullScale:NO];
    [[self stepper] setDecrementImage:[self loadImage:value] forState:UIControlStateFocused];
}

#pragma mark Increment backGroundImage
-(void)setIncrementImage_:(id)value
{
    backgroundImageCache = [self imageWithImage:[self loadImage:value] fullScale:NO];
    [[self stepper] setIncrementImage:backgroundImageCache forState:UIControlStateNormal];
}

-(void)setIncrementSelectedImage_:(id)value
{
    backgroundImageCache = [self imageWithImage:[self loadImage:value] fullScale:NO];
    [[self stepper] setIncrementImage:backgroundImageCache forState:UIControlStateSelected];
}
-(void)setIncrementDisabledImage_:(id)value
{
    backgroundImageCache = [self imageWithImage:[self loadImage:value] fullScale:NO];
    [[self stepper] setIncrementImage:backgroundImageCache forState:UIControlStateDisabled];
}
-(void)setIncrementFocusedImage_:(id)value
{
    backgroundImageCache = [self imageWithImage:[self loadImage:value] fullScale:NO];
    [[self stepper] setIncrementImage:backgroundImageCache forState:UIControlStateFocused];
}


-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
    [TiUtils setView:[self stepper] positionRect:bounds];
    [super frameSizeChanged:frame bounds:bounds];
}

-(CGFloat)contentWidthForWidth:(CGFloat)value
{
    return [[self stepper] sizeThatFits:CGSizeMake(value, 0)].width;
}

-(CGFloat)contentHeightForWidth:(CGFloat)value
{
    return [[self stepper] sizeThatFits:CGSizeMake(value, 0)].height;
}

-(BOOL)hasTouchableListener
{
    // since this guy only works with touch events, we always want them
    // just always return YES no matter what listeners we have registered
    return YES;
}

- (IBAction)stepperChanged:(id)sender
{
    NSNumber *newValue = [NSNumber numberWithDouble:[[self stepper] value]];
    [self.proxy replaceValue:newValue forKey:@"value" notification:YES];
    
    if ([self.proxy _hasListeners:@"change"]) {
        [self.proxy fireEvent:@"change" withObject:[NSDictionary dictionaryWithObject:newValue forKey:@"value"]];
    }
}

- (IBAction)stepperTouch:(id)sender forEvent:(UIEvent *)event
{
    UITouch *touch = [[event allTouches] anyObject];
    if([self.proxy _hasListeners:@"click"]) {
        [self.proxy fireEvent:@"click" withObject:[NSDictionary
                                                   dictionaryWithDictionary:[TiUtils touchPropertiesToDictionary:touch
                                                                                andPoint:[touch locationInView:self]]]];
    }
}


-(UIImage *)imageWithImage:(UIImage *)image fullScale:(bool)full {
    //UIGraphicsBeginImageContext(newSize);
    // In next line, pass 0.0 to use the current device's pixel scaling factor (and thus account for Retina resolution).
    // Pass 1.0 to force exact pixel size.
    [self stepper];
    CGRect bounds = [stepper bounds];
    CGSize imageSize = [image size];
    
    if (full != YES) {
        bounds.size.height = bounds.size.height/2;
        bounds.size.width = bounds.size.width/2;
    }
    
    if (image.size.height > bounds.size.height && image.size.width > bounds.size.width) {
        UIImageView* theView = [[UIImageView alloc] initWithFrame:bounds];
        [theView setImage:image];
        UIGraphicsBeginImageContextWithOptions(bounds.size, [theView.layer isOpaque], 0.0);
        [theView.layer renderInContext:UIGraphicsGetCurrentContext()];
        UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
        UIGraphicsEndImageContext();
        [theView release];
        return [image retain];
    }
    return image;
}
@end
#endif
