/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

@interface TiRect : TiProxy {
	CGRect rect;
}

-(void)setRect:(CGRect)rect_;
-(CGRect)rect;

@property(nonatomic,retain) NSNumber *x;
@property(nonatomic,retain) NSNumber *y;
@property(nonatomic,retain) NSNumber *width;
@property(nonatomic,retain) NSNumber *height;

@end
