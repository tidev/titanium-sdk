/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIMaskedImage.h"
#import "TiUtils.h"
#import "ImageLoader.h"
#import "Webcolor.h"

@implementation TiUIMaskedImage

-(CGFloat)autoWidthForWidth:(CGFloat)value
{
	if (image!=nil)
	{
		return image.size.width;
	}
	return value;
}

-(CGFloat)autoHeightForWidth:(CGFloat)value
{
	if (image!=nil)
	{
		return image.size.height;
	}
	return value;
}

- (void)dealloc 
{
	RELEASE_TO_NIL(image);
	RELEASE_TO_NIL(tint);
    [super dealloc];
}

- (void)configurationSet
{
	[[self layer] setGeometryFlipped:YES];
}

-(void)setImage_:(id)newImage
{
	RELEASE_TO_NIL(image);
	image = [[TiUtils toImage:newImage proxy:self.proxy] retain];
	[self setNeedsDisplay];
}

-(void)setMask_:(id)newMask
{
	RELEASE_TO_NIL(mask);
	mask = [[TiUtils toImage:newMask proxy:self.proxy] retain];
	[self setNeedsDisplay];
}

-(void)setTint_:(id)tint_
{
	RELEASE_TO_NIL(tint);
	tint = [UIColorWebColorNamed(tint_) retain];
	[self setNeedsDisplay];
}

-(void)setMode_:(id)value
{
	mode = [TiUtils intValue:value];
	[self setNeedsDisplay];
}

- (void)drawRect:(CGRect)rect 
{
	CGContextRef ourContext = UIGraphicsGetCurrentContext();
	CGRect bounds = [self bounds];

	if (mask != nil)
	{
		CGContextClearRect(ourContext, bounds);
		CGContextDrawImage(ourContext, bounds, [mask CGImage]);
	}
	else
	{
		CGContextSetGrayFillColor(ourContext, 1.0, 1.0);
		CGContextFillRect(ourContext, bounds);
	}

	CGContextSetBlendMode(ourContext, mode);

	if (image != nil)
	{
		CGContextDrawImage(ourContext, bounds, [image CGImage]);
	}

	if (tint != nil)
	{
		CGContextSetFillColorWithColor(ourContext, [tint CGColor]);
		CGContextFillRect(ourContext, bounds);
	}
}

@end
