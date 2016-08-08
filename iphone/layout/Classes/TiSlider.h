/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiLayoutView.h"

@interface TiSlider : TiLayoutView

@property(nonatomic, copy) void (^onValueChanged)(TiSlider* sender, NSInteger value);
-(NSInteger)sliderValue;
-(void)setMin:(NSInteger)min andMax:(NSInteger)max;
-(void)setSliderValue:(NSInteger)value;
@end
