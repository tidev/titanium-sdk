/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UI3DMATRIX

#import <QuartzCore/QuartzCore.h>
#import "TiProxy.h"

@interface Ti3DMatrix : TiProxy {
@protected
	CATransform3D matrix;
}

-(id)initWithProperties:(NSDictionary*)dict_;
-(id)initWithMatrix:(CATransform3D)matrix_;

-(CATransform3D)matrix;
-(Ti3DMatrix*)translate:(id)args;
-(Ti3DMatrix*)scale:(id)args;
-(Ti3DMatrix*)rotate:(id)args;
-(Ti3DMatrix*)invert:(id)args;
-(Ti3DMatrix*)multiply:(id)args;

@property(nonatomic,readwrite,retain) NSNumber* m11;
@property(nonatomic,readwrite,retain) NSNumber* m12;
@property(nonatomic,readwrite,retain) NSNumber* m13;
@property(nonatomic,readwrite,retain) NSNumber* m14;
@property(nonatomic,readwrite,retain) NSNumber* m21;
@property(nonatomic,readwrite,retain) NSNumber* m22;
@property(nonatomic,readwrite,retain) NSNumber* m23;
@property(nonatomic,readwrite,retain) NSNumber* m24;
@property(nonatomic,readwrite,retain) NSNumber* m31;
@property(nonatomic,readwrite,retain) NSNumber* m32;
@property(nonatomic,readwrite,retain) NSNumber* m33;
@property(nonatomic,readwrite,retain) NSNumber* m34;
@property(nonatomic,readwrite,retain) NSNumber* m41;
@property(nonatomic,readwrite,retain) NSNumber* m42;
@property(nonatomic,readwrite,retain) NSNumber* m43;
@property(nonatomic,readwrite,retain) NSNumber* m44;

@end

#endif