/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"
#import "TiDimension.h"

@interface TiPoint : TiProxy {
	TiDimension xDimension;
	TiDimension yDimension;
}

-(id)initWithPoint:(CGPoint)point_;
-(id)initWithObject:(id)object;

-(void)setValues:(id)object;

//Virtual property
@property(nonatomic,assign) CGPoint point;

@property(nonatomic,retain) NSNumber *x;
@property(nonatomic,retain) NSNumber *y;

@property(nonatomic,assign) TiDimension xDimension;
@property(nonatomic,assign) TiDimension yDimension;


@end
