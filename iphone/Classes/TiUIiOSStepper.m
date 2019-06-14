/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSSTEPPER
#import "TiUIiOSStepper.h"
#import "TiUIiOSStepperProxy.h"
#import <TitaniumKit/TiUtils.h>

@implementation TiUIiOSStepper

- (UIStepper *)stepper
{
  if (stepper == nil) {
    stepper = [[UIStepper alloc] init];
    [stepper setMaximumValue:100];
    [stepper setMinimumValue:0];
    [stepper addTarget:self action:@selector(stepperChanged:) forControlEvents:UIControlEventValueChanged];
    [stepper addTarget:self action:@selector(controlAction:forEvent:) forControlEvents:UIControlEventAllTouchEvents];
    [self addSubview:stepper];
  }
  return stepper;
}

- (void)dealloc
{
  [stepper removeTarget:self action:@selector(stepperChanged:) forControlEvents:UIControlEventValueChanged];
  [stepper removeTarget:self action:@selector(controlAction:forEvent:) forControlEvents:UIControlEventAllTouchEvents];
  RELEASE_TO_NIL(stepper);
  RELEASE_TO_NIL(backgroundImageCache);
  [super dealloc];
}

- (void)setContinuous_:(id)value
{
  ENSURE_TYPE(value, NSNumber);
  [[self stepper] setContinuous:[TiUtils boolValue:value def:YES]];
}

- (void)setAutorepeat_:(id)value
{
  ENSURE_TYPE(value, NSNumber);
  [[self stepper] setAutorepeat:[TiUtils boolValue:value def:YES]];
}

- (void)setWraps_:(id)value
{
  ENSURE_TYPE(value, NSNumber);
  [[self stepper] setWraps:[TiUtils boolValue:value def:NO]];
}

- (void)setMaximum_:(id)value
{
  ENSURE_TYPE(value, NSNumber);
  double newValue = [TiUtils doubleValue:value];

  if ([[self stepper] minimumValue] >= newValue) {
    NSLog(@"[WARN] The maximum value must not be smaller or equal to the minimum value");
  } else {
    [[self stepper] setMaximumValue:newValue];
  }
}

- (void)setMinimum_:(id)value
{
  ENSURE_TYPE(value, NSNumber);
  double newValue = [TiUtils doubleValue:value];

  if ([[self stepper] maximumValue] <= newValue) {
    NSLog(@"[WARN] The maximum value must not be smaller or equal to the minimum value");
  } else {
    [[self stepper] setMinimumValue:newValue];
  }
}

- (void)setSteps_:(id)value
{
  ENSURE_TYPE(value, NSNumber);
  NSNumber *stepValue = [NSNumber numberWithDouble:[TiUtils doubleValue:value]];
  if (stepValue.intValue > 0) {
    [[self stepper] setStepValue:[TiUtils doubleValue:value]];
  } else {
    NSLog(@"[WARN] The steps must be bigger than 0.");
  }
}

- (void)setValue_:(id)value
{
  ENSURE_TYPE(value, NSNumber);
  double newValue = [TiUtils doubleValue:value];

  if (newValue <= [[self stepper] maximumValue] && newValue >= [[self stepper] minimumValue]) {
    [[self stepper] setValue:newValue];
  } else {
    NSNumber *currentValue = [NSNumber numberWithDouble:[[self stepper] value]];
    [self.proxy replaceValue:currentValue forKey:@"value" notification:NO];
    NSLog(@"[WARN] The value passed in must be smaller than the maximum and bigger than the minimum stepper values");
  }
}

- (void)setTintColor_:(id)value
{
  TiColor *color = [TiUtils colorValue:value];
  if (color != nil) {
    [[self stepper] setTintColor:[[TiUtils colorValue:color] color]];
  }
}

- (void)setEnabled_:(id)value
{
  ENSURE_TYPE(value, NSNumber);
  [[self stepper] setEnabled:[TiUtils boolValue:value]];
}

- (NSNumber *)value
{
  return NUMDOUBLE([[self stepper] value]);
}

#pragma mark backgroundImage

- (void)setBackgroundImage_:(id)value
{
  backgroundImageCache = [self imageWithImage:[self loadImage:value] fullScale:YES];
  if (backgroundImageCache != nil) {
    [[self stepper] setBackgroundImage:backgroundImageCache forState:UIControlStateNormal];
  }
}

#pragma mark Decrement backgroundImage

- (void)setDecrementImage_:(id)value
{
  backgroundImageCache = [self imageWithImage:[self loadImage:value] fullScale:NO];
  if (backgroundImageCache != nil) {
    [[self stepper] setDecrementImage:backgroundImageCache forState:UIControlStateNormal];
  }
}

- (void)setDecrementDisabledImage_:(id)value
{
  backgroundImageCache = [self imageWithImage:[self loadImage:value] fullScale:NO];
  if (backgroundImageCache != nil) {
    [[self stepper] setDecrementImage:backgroundImageCache forState:UIControlStateDisabled];
  }
}

#pragma mark Increment backgroundImage

- (void)setIncrementImage_:(id)value
{
  backgroundImageCache = [self imageWithImage:[self loadImage:value] fullScale:NO];
  if (backgroundImageCache != nil) {
    [[self stepper] setIncrementImage:backgroundImageCache forState:UIControlStateNormal];
  }
}

- (void)setIncrementDisabledImage_:(id)value
{
  backgroundImageCache = [self imageWithImage:[self loadImage:value] fullScale:NO];
  if (backgroundImageCache != nil) {
    [[self stepper] setIncrementImage:backgroundImageCache forState:UIControlStateDisabled];
  }
}

- (void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
  [TiUtils setView:[self stepper] positionRect:bounds];
  [super frameSizeChanged:frame bounds:bounds];
}

- (CGFloat)contentWidthForWidth:(CGFloat)value
{
  return [[self stepper] sizeThatFits:CGSizeMake(value, 0)].width;
}

- (CGFloat)contentHeightForWidth:(CGFloat)value
{
  return [[self stepper] sizeThatFits:CGSizeMake(value, 0)].height;
}

- (BOOL)hasTouchableListener
{
  // since this guy only works with touch events, we always want them
  // just always return YES no matter what listeners we have registered
  return YES;
}

- (IBAction)stepperChanged:(id)sender
{
  NSNumber *newValue = [NSNumber numberWithDouble:[[self stepper] value]];
  [self.proxy replaceValue:newValue forKey:@"value" notification:NO];

  if ([self.proxy _hasListeners:@"change"]) {
    [self.proxy fireEvent:@"change"
               withObject:[NSDictionary dictionaryWithObjectsAndKeys:
                                            [NSNumber numberWithDouble:stepper.value], @"value",
                                        [NSNumber numberWithDouble:stepper.minimumValue], @"minimum",
                                        [NSNumber numberWithFloat:stepper.maximumValue], @"maximum",
                                        nil]];
  }
}

- (void)controlAction:(id)sender forEvent:(UIEvent *)event
{
  UITouch *touch = [[event allTouches] anyObject];
  NSString *fireEvent;
  NSString *fireActionEvent = nil;
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
    if (stepper.highlighted) {
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

  NSMutableDictionary *evt = [NSMutableDictionary dictionaryWithDictionary:[TiUtils touchPropertiesToDictionary:touch andView:self]];
  if ((fireActionEvent != nil) && [self.proxy _hasListeners:fireActionEvent]) {
    [self.proxy fireEvent:fireActionEvent withObject:evt];
  }
  if ([self.proxy _hasListeners:fireEvent]) {
    [self.proxy fireEvent:fireEvent withObject:evt];
  }
}

- (UIImage *)imageWithImage:(UIImage *)image fullScale:(bool)full
{
  //UIGraphicsBeginImageContext(newSize);
  // In next line, pass 0.0 to use the current device's pixel scaling factor (and thus account for Retina resolution).
  // Pass 1.0 to force exact pixel size.
  [self stepper];
  CGRect bounds = [stepper bounds];

  if (full != YES) {
    bounds.size.height = bounds.size.height / 2;
    bounds.size.width = bounds.size.width / 2;
  }

  if (image.size.height > bounds.size.height && image.size.width > bounds.size.width) {
    UIImageView *theView = [[UIImageView alloc] initWithFrame:bounds];
    [theView setImage:image];
    UIGraphicsBeginImageContextWithOptions(bounds.size, [theView.layer isOpaque], 0.0);
    [theView.layer renderInContext:UIGraphicsGetCurrentContext()];
    UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    [theView release];
    return [[image retain] autorelease];
  }
  return image;
}
@end
#endif
