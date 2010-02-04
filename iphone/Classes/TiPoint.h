/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

@interface TiPoint : TiProxy {
	CGPoint point;
}

-(id)initWithPoint:(CGPoint)point_;
-(void)setPoint:(CGPoint)point_;
-(CGPoint)point;

@property(nonatomic,retain) NSNumber *x;
@property(nonatomic,retain) NSNumber *y;

@end
