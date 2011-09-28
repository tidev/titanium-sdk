/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUIiOS3DMatrix.h"

#if defined(USE_TI_UIIOS3DMATRIX) || defined(USE_TI_UI3DMATRIX)

@implementation TiUIiOS3DMatrix

-(id)init
{
	if (self = [super init])
	{
		matrix = CATransform3DIdentity;
	}
	return self;
}

-(id)initWithMatrix:(CATransform3D)matrix_
{
	if (self = [self init])
	{
		matrix = matrix_;
	}
	return self;
}

-(id)initWithProperties:(NSDictionary*)dict_
{
	if (self = [self init])
	{
		if ([dict_ objectForKey:@"scale"]!=nil)
		{
			CGFloat xyz = [[dict_ objectForKey:@"scale"] floatValue];
			matrix = CATransform3DScale(matrix,xyz,xyz,xyz);
		}
	}
	return self;
}

-(CATransform3D)matrix
{
	return matrix;
}

-(TiUIiOS3DMatrix*)translate:(id)args
{
	ENSURE_ARG_COUNT(args,3);
	CGFloat tx = [[args objectAtIndex:0] floatValue];
	CGFloat ty = [[args objectAtIndex:1] floatValue];
	CGFloat tz = [[args objectAtIndex:2] floatValue];
	CATransform3D newtransform = CATransform3DTranslate(matrix,tx,ty,tz);
	return [[[TiUIiOS3DMatrix alloc] initWithMatrix:newtransform] autorelease];
}

-(TiUIiOS3DMatrix*)scale:(id)args
{
	CGFloat sx = [[args objectAtIndex:0] floatValue];
	CGFloat sy = [args count] > 1 ? [[args objectAtIndex:1] floatValue] : sx;
	CGFloat sz = [args count] > 2 ? [[args objectAtIndex:2] floatValue] : sy;
	// if they pass in 0, they mean really small which requires at least a value!=0
	if (sx==0) sx = 0.0001;
	if (sy==0) sy = 0.0001;
	if (sz==0) sz = 0.0001;
	CATransform3D newtransform = CATransform3DScale(matrix,sx,sy,sz);
	return [[[TiUIiOS3DMatrix alloc] initWithMatrix:newtransform] autorelease];
}

-(TiUIiOS3DMatrix*)rotate:(id)args
{
	ENSURE_ARG_COUNT(args,4);
	
	CGFloat angle = [[args objectAtIndex:0] floatValue];
	CGFloat x = [[args objectAtIndex:1] floatValue];
	CGFloat y = [[args objectAtIndex:2] floatValue];
	CGFloat z = [[args objectAtIndex:3] floatValue];
	CATransform3D newtransform = CATransform3DRotate(matrix,degreesToRadians(angle),x,y,z);
	return [[[TiUIiOS3DMatrix alloc] initWithMatrix:newtransform] autorelease];
}

-(TiUIiOS3DMatrix*)invert:(id)args
{
	return [[[TiUIiOS3DMatrix alloc] initWithMatrix:CATransform3DInvert(matrix)] autorelease];
}

-(TiUIiOS3DMatrix*)multiply:(id)args
{
	ENSURE_ARG_COUNT(args,1);
	TiUIiOS3DMatrix *othermatrix = [args objectAtIndex:0];
	ENSURE_TYPE(othermatrix,TiUIiOS3DMatrix);
	CATransform3D newtransform = CATransform3DConcat(matrix,[othermatrix matrix]);
	return [[[TiUIiOS3DMatrix alloc] initWithMatrix:newtransform] autorelease];
}

#define MAKE_PROP(x) \
-(void)setM##x:(NSNumber*)m##x \
{\
	matrix.m##x = [m##x floatValue];\
}\
\
-(NSNumber*)m##x\
{\
	return [NSNumber numberWithFloat:matrix.m##x];\
}\
\


MAKE_PROP(11)
MAKE_PROP(12)
MAKE_PROP(13)
MAKE_PROP(14)
MAKE_PROP(21)
MAKE_PROP(22)
MAKE_PROP(23)
MAKE_PROP(24)
MAKE_PROP(31)
MAKE_PROP(32)
MAKE_PROP(33)
MAKE_PROP(34)
MAKE_PROP(41)
MAKE_PROP(42)
MAKE_PROP(43)
MAKE_PROP(44)

-(id)description
{
	return @"[object TiUIiOS3DMatrix]";
}

@end

#endif