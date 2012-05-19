/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"
#import "TiDimension.h"

/**
 The class for point proxy.
 */
@interface TiPoint : TiProxy {
	TiDimension xDimension;
	TiDimension yDimension;
}

/**
 Initializes the point object from point struct.
 @param point_ The point struct.
 */
-(id)initWithPoint:(CGPoint)point_;

-(id)initWithObject:(id)object;

-(void)setValues:(id)object;

/**
 Provides access to point struct.
 */
@property(nonatomic,assign) CGPoint point;

/**
 Provides access to the point x coordinate.
 */
@property(nonatomic,retain) NSNumber *x;

/**
 Provides access to the point y coordiante.
 */
@property(nonatomic,retain) NSNumber *y;

/**
 Returns the point x coordinate as a dimension.
 */
@property(nonatomic,assign) TiDimension xDimension;

/**
 Returns the point y coordinate as a dimension.
 */
@property(nonatomic,assign) TiDimension yDimension;


@end
