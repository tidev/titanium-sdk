/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiPoint.h"


@implementation TiPoint

-(id)initWithPoint:(CGPoint)point_
{
	if (self = [super init])
	{
		point = point_;
	}
	return self;
}

-(void)setPoint:(CGPoint)point_
{
	point = point_;
}

-(CGPoint)point
{
	return point;
}

-(id)x
{
	return [NSNumber numberWithFloat:point.x];
}

-(void)setX:(id)x
{
	ENSURE_SINGLE_ARG(x,NSNumber);
	point.x = [x floatValue];
}

-(id)y
{
	return [NSNumber numberWithFloat:point.y];
}

-(void)setY:(id)y
{
	ENSURE_SINGLE_ARG(y,NSNumber);
	point.y = [y floatValue];
}

@end
