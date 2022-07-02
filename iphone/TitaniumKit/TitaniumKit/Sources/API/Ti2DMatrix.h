/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiProxy.h"

/**
 The proxy representing a 2D matrix for an affine transform.
 */
@interface Ti2DMatrix : TiProxy {
  @protected
  CGAffineTransform matrix;
}

/**
 Initializes the proxy with properties.
 @param dict_ The properties dictionary.
 */
- (id)initWithProperties:(NSDictionary *)dict_;

/**
 Initializes the proxy with the specified transform matrix.
 @param matrix_ The transform matrix.
 */
- (id)initWithMatrix:(CGAffineTransform)matrix_;

/**
 Returns transform matrix.
 @return The transform matrix.
 */
@property (nonatomic, readonly) CGAffineTransform matrix;

- (Ti2DMatrix *)translate:(id)args;
- (Ti2DMatrix *)scale:(id)args;
- (Ti2DMatrix *)rotate:(id)args;
- (Ti2DMatrix *)invert:(id)args;
- (Ti2DMatrix *)multiply:(id)args;

@property (nonatomic, readwrite, retain) NSNumber *a;
@property (nonatomic, readwrite, retain) NSNumber *b;
@property (nonatomic, readwrite, retain) NSNumber *c;
@property (nonatomic, readwrite, retain) NSNumber *d;
@property (nonatomic, readwrite, retain) NSNumber *tx;
@property (nonatomic, readwrite, retain) NSNumber *ty;

@end
