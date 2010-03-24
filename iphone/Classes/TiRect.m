/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiRect.h"


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

@end
