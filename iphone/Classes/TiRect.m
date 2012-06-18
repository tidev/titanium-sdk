/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiRect.h"
#import "TiDimension.h"

@implementation TiRect

-(void)setRect:(CGRect)rect_
{
	rect = rect_;
}

-(CGRect)rect
{
	return rect;
}

-(id)x
{
	return [NSNumber numberWithFloat:rect.origin.x];
}

-(void)setX:(id)x
{
	ENSURE_SINGLE_ARG(x,NSNumber);
	rect.origin.x = [x floatValue];
}

-(id)y
{
	return [NSNumber numberWithFloat:rect.origin.y];
}

-(void)setY:(id)y
{
	ENSURE_SINGLE_ARG(y,NSNumber);
	rect.origin.y = [y floatValue];
}

-(id)width
{
	return [NSNumber numberWithFloat:rect.size.width];
}

-(void)setWidth:(id)w
{
	ENSURE_SINGLE_ARG(w,NSNumber);
	rect.size.width = [w floatValue];
}

-(id)height
{
	return [NSNumber numberWithFloat:rect.size.height];
}

-(void)setHeight:(id)h
{
	ENSURE_SINGLE_ARG(h,NSNumber);
	rect.size.height = [h floatValue];
}

-(id)left
{
	return [NSNumber numberWithFloat:rect.origin.x];
}

-(id)right
{
	return [NSNumber numberWithFloat:(rect.origin.x + rect.size.width)];
}

-(id)top
{
	return [NSNumber numberWithFloat:rect.origin.y];
}

-(id)bottom
{
	return [NSNumber numberWithFloat:(rect.origin.y + rect.size.height)];
}

-(void)convertToUnit:(NSString *)unit
{    
    if ([unit caseInsensitiveCompare:kTiUnitCm] == NSOrderedSame) {
        rect.origin.x = convertDipToInch(rect.origin.x) * INCH_IN_CM;
        rect.origin.y = convertDipToInch(rect.origin.y) * INCH_IN_CM;
        rect.size.width = convertDipToInch(rect.size.width) * INCH_IN_CM;
        rect.size.height = convertDipToInch(rect.size.width) * INCH_IN_CM;
    }
    else if ([unit caseInsensitiveCompare:kTiUnitInch] == NSOrderedSame) {
        rect.origin.x = convertDipToInch(rect.origin.x);
        rect.origin.y = convertDipToInch(rect.origin.y);
        rect.size.width = convertDipToInch(rect.size.width);
        rect.size.height = convertDipToInch(rect.size.height);
    }
    else if ([unit caseInsensitiveCompare:kTiUnitMm] == NSOrderedSame) {
        rect.origin.x = convertDipToInch(rect.origin.x) * INCH_IN_MM;
        rect.origin.y = convertDipToInch(rect.origin.y) * INCH_IN_MM;
        rect.size.width = convertDipToInch(rect.size.width) * INCH_IN_MM;
        rect.size.height = convertDipToInch(rect.size.height) * INCH_IN_MM;
    }
    else if ([unit caseInsensitiveCompare:kTiUnitPixel] == NSOrderedSame) {
        rect.origin.x = convertDipToPixels(rect.origin.x);
        rect.origin.y = convertDipToPixels(rect.origin.y);
        rect.size.width = convertDipToPixels(rect.size.width);
        rect.size.height = convertDipToPixels(rect.size.height);
    }
}

@end
