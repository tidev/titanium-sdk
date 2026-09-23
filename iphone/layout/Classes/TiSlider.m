/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiSlider.h"

@interface TiSlider () {
  UISlider *slider;
}
@end

@implementation TiSlider

- (instancetype)init
{
  self = [super init];
  if (self) {
    slider = [[UISlider alloc] init];
    [slider addTarget:self action:@selector(sliderValueChanged:) forControlEvents:UIControlEventValueChanged];

    [slider setTranslatesAutoresizingMaskIntoConstraints:NO];
    [self addSubview:slider];

    [self setDefaultHeight:TiDimensionFromObject(@"SIZE")];
    [self setDefaultWidth:TiDimensionFromObject(@"FILL")];
  }
  return self;
}

- (NSInteger)sliderValue
{
  return [slider value];
}

- (void)setMin:(NSInteger)min andMax:(NSInteger)max
{
  [slider setMinimumValue:min];
  [slider setMaximumValue:max];
}

- (void)setSliderValue:(NSInteger)value
{
  [slider setValue:value];
}
- (void)sliderValueChanged:(UISlider *)sender
{
  if (_onValueChanged != nil) {
    _onValueChanged(self, [sender value]);
  }
}
@end
