/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UISTEPPER
#import "TiUIStepperProxy.h"
#import "TiUIStepper.h"

@implementation TiUIStepperProxy

USE_VIEW_FOR_CONTENT_WIDTH
USE_VIEW_FOR_CONTENT_HEIGHT

-(NSString*)apiName
{
    return @"Ti.UI.Stepper";
}

-(void)_initWithProperties:(NSDictionary *)properties
{
    [super _initWithProperties:properties];
}


#ifndef TI_USE_AUTOLAYOUT
-(TiDimension)defaultAutoWidthBehavior:(id)unused
{
    return TiDimensionAutoSize;
}
-(TiDimension)defaultAutoHeightBehavior:(id)unused
{
    return TiDimensionAutoSize;
}
#endif

-(UIView *)parentViewForChild:(TiViewProxy *)child
{
    return [[(TiUIStepper*)[self view] stepper] superview];
}

-(NSNumber*)value
{
    NSNumber *value = [NSNumber numberWithDouble:[[(TiUIStepper*)[self view] stepper] value]];
    return value;
}
@end
#endif