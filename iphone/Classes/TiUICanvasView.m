/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UICANVAS

#import "TiUICanvasView.h"
#import "TiUtils.h"
#import "Webcolor.h"

enum  
{
	TiCanvasFillStyle = 0,
	TiCanvasFillRect,
	TiCanvasClearRect,
	TiCanvasStrokeRect,
	TiCanvasStrokeStyle,
	TiCanvasLineWidth,
	TiCanvasFillElipse,
	TiCanvasLineJoin,
	TiCanvasLineCap,
	TiCanvasLineTo,
	TiCanvasMoveTo,
	TiCanvasBeginPath,
	TiCanvasClosePath,
	TiCanvasFill,
	TiCanvasShadow,
	TiCanvasClip,
	TiCanvasArc,
	TiCanvasArcTo,
	TiCanvasBezierCurveTo,
	TiCanvasQuadraticCurveTo,
	TiCanvasStroke,
	TiCanvasGlobalAlpha,
	TiCanvasGlobalCompositeOperation,
	TiCanvasFont,
	TiCanvasTextAlign,
	TiCanvasTextBaseline,
	TiCanvasFillText,
};

//TODO:  font, textAlign, textBaseline, fillText
//TODO:  measureText, strokeText, drawImage
//TODO:  gradients, patterns, toImage
//TODO:  rotate, scale, transform, translate



@implementation TiUICanvasView

-(void)dealloc
{
	RELEASE_TO_NIL(operations);
	[super dealloc];
}

-(void)begin
{
	RELEASE_TO_NIL(operations);
	operations = [[NSMutableArray array] retain];
}

-(void)commit
{
	if (operations!=nil)
	{
		[self performSelectorOnMainThread:@selector(setNeedsDisplay) withObject:nil waitUntilDone:NO];
	}
}

-(CGRect)rectFromArray:(NSArray*)args
{
	assert([args count]==4);
	return CGRectMake([TiUtils floatValue:[args objectAtIndex:0]], 
					  [TiUtils floatValue:[args objectAtIndex:1]], 
					  [TiUtils floatValue:[args objectAtIndex:2]], 
					  [TiUtils floatValue:[args objectAtIndex:3]]);
}

-(CGPoint)pointFromArray:(NSArray*)args
{
	return CGPointMake([TiUtils floatValue:[args objectAtIndex:0]], 
					  [TiUtils floatValue:[args objectAtIndex:1]]);
}

-(CGSize)sizeFromArray:(NSArray*)args
{
	return CGSizeMake([TiUtils floatValue:[args objectAtIndex:0]], 
					   [TiUtils floatValue:[args objectAtIndex:1]]);
}

-(CGLineJoin)lineJoinFromString:(NSString*)value 
{
	if ([value isEqualToString:@"miter"])
	{
		return kCGLineJoinMiter;
	}
	else if ([value isEqualToString:@"round"])
	{
		return kCGLineJoinRound;
	}
	return kCGLineJoinBevel;
}

-(CGLineCap)lineCapFromString:(NSString*)value
{
	if ([value isEqualToString:@"butt"])
	{
		return kCGLineCapButt;
	}
	else if ([value isEqualToString:@"round"])
	{
		return kCGLineCapRound;
	}
	return kCGLineCapSquare;
}

#define BLEND_MODE(a,b) \
if ([value isEqualToString:@#a])\
{\
   return b;\
}\

-(CGBlendMode)blendModeFromString:(NSString*)value
{
	BLEND_MODE(copy,kCGBlendModeCopy);
	BLEND_MODE(destination-atop,kCGBlendModeDestinationAtop);
	BLEND_MODE(destination-in,kCGBlendModeDestinationIn);
	BLEND_MODE(destination-out,kCGBlendModeDestinationOut);
	BLEND_MODE(destination-over,kCGBlendModeDestinationOver);
	BLEND_MODE(lighter,kCGBlendModeLighten);
	BLEND_MODE(source-atop,kCGBlendModeSourceAtop);
	BLEND_MODE(source-in,kCGBlendModeSourceIn);
	BLEND_MODE(source-out,kCGBlendModeSourceOut);
	BLEND_MODE(source-over,kCGBlendModeNormal);
	BLEND_MODE(xor,kCGBlendModeXOR);
	return kCGBlendModeNormal; //default by HTML canvas spec
}

-(void)draw:(CGContextRef)context operation:(int)operation args:(NSArray*)args
{
	switch(operation)
	{
		case TiCanvasFillStyle:
		{
			UIColor *color = UIColorWebColorNamed([args objectAtIndex:0]);
			const CGFloat *complements = CGColorGetComponents(color.CGColor);
			size_t count = CGColorGetNumberOfComponents(color.CGColor);
			CGContextSetRGBFillColor(context, complements[0], complements[1], complements[2], count > 3 ? complements[3] : 1);
			break;
		}
		case TiCanvasFillRect:
		{
			CGContextFillRect(context, [self rectFromArray:args]);
			break;
		}
		case TiCanvasClearRect:
		{
			CGContextClearRect(context,[self rectFromArray:args]);
			break;
		}
		case TiCanvasStrokeRect:
		{
			CGContextStrokeRect(context, [self rectFromArray:args]);
			break;
		}
		case TiCanvasStrokeStyle:
		{
			UIColor *color = UIColorWebColorNamed([args objectAtIndex:0]);
			const CGFloat *complements = CGColorGetComponents(color.CGColor);
			size_t count = CGColorGetNumberOfComponents(color.CGColor);
			CGContextSetRGBStrokeColor(context, complements[0], complements[1], complements[2], count > 3 ? complements[3] : 1);
			break;
		}
		case TiCanvasLineWidth:
		{
			CGContextSetLineWidth(context, [TiUtils floatValue:[args objectAtIndex:0]]);
			break;
		}
		case TiCanvasFillElipse:
		{
			CGContextFillEllipseInRect(context, [self rectFromArray:args]);
			break;
		}
		case TiCanvasLineJoin:
		{
			CGLineJoin join = [self lineJoinFromString:[args objectAtIndex:0]];
			CGContextSetLineJoin(context, join);
			break;
		}
		case TiCanvasLineCap:
		{
			CGLineCap cap = [self lineCapFromString:[args objectAtIndex:0]];
			CGContextSetLineCap(context, cap);
			break;
		}
		case TiCanvasLineTo:
		{
			ENSURE_ARG_COUNT(args,2);
			CGContextAddLineToPoint(context, [TiUtils floatValue:[args objectAtIndex:0]], [TiUtils floatValue:[args objectAtIndex:1]]);
			break;
		}
		case TiCanvasMoveTo:
		{
			ENSURE_ARG_COUNT(args,2);
			CGContextMoveToPoint(context, [TiUtils floatValue:[args objectAtIndex:0]], [TiUtils floatValue:[args objectAtIndex:1]]);
			break;
		}
		case TiCanvasBeginPath:
		{
			CGContextBeginPath(context);
			break;
		}
		case TiCanvasClosePath:
		{
			CGContextClosePath(context);
			break;
		}
		case TiCanvasFill:
		{
			CGContextFillPath(context);
			break;
		}
		case TiCanvasShadow:
		{
			ENSURE_ARG_COUNT(args,4);
			UIColor *color = UIColorWebColorNamed([args objectAtIndex:3]);
			CGContextSetShadowWithColor(context, [self sizeFromArray:args], [TiUtils floatValue:[args objectAtIndex:2]], color.CGColor);
			break;
		}
		case TiCanvasClip:
		{
			CGContextClip(context);
			break;
		}
		case TiCanvasArc:
		{
			ENSURE_ARG_COUNT(args,6);
			CGContextAddArc(context, [TiUtils floatValue:[args objectAtIndex:0]], [TiUtils floatValue:[args objectAtIndex:1]], [TiUtils floatValue:[args objectAtIndex:2]], [TiUtils floatValue:[args objectAtIndex:3]], [TiUtils floatValue:[args objectAtIndex:4]], [TiUtils intValue:[args objectAtIndex:5]]);
			break;
		}
		case TiCanvasArcTo:
		{
			ENSURE_ARG_COUNT(args,5);
			CGContextAddArcToPoint(context, [TiUtils floatValue:[args objectAtIndex:0]], [TiUtils floatValue:[args objectAtIndex:1]], [TiUtils floatValue:[args objectAtIndex:2]], [TiUtils floatValue:[args objectAtIndex:3]], [TiUtils floatValue:[args objectAtIndex:4]]);
			break;
		}
		case TiCanvasBezierCurveTo:
		{
			ENSURE_ARG_COUNT(args,6);
			CGContextAddCurveToPoint(context, [TiUtils floatValue:[args objectAtIndex:0]], [TiUtils floatValue:[args objectAtIndex:1]], [TiUtils floatValue:[args objectAtIndex:2]], [TiUtils floatValue:[args objectAtIndex:3]], [TiUtils floatValue:[args objectAtIndex:4]], [TiUtils intValue:[args objectAtIndex:5]]);
			break;
		}
		case TiCanvasStroke:
		{
			CGContextStrokePath(context);
			break;
		}
		case TiCanvasQuadraticCurveTo:
		{
			ENSURE_ARG_COUNT(args,4);
			CGContextAddQuadCurveToPoint(context, [TiUtils floatValue:[args objectAtIndex:0]], [TiUtils floatValue:[args objectAtIndex:1]], [TiUtils floatValue:[args objectAtIndex:2]], [TiUtils floatValue:[args objectAtIndex:3]]);
			break;
		}
		case TiCanvasGlobalAlpha:
		{
			ENSURE_ARG_COUNT(args,1);
			CGContextSetAlpha(context, [TiUtils floatValue:[args objectAtIndex:0]]);
			break;
		}
		case TiCanvasGlobalCompositeOperation:
		{
			ENSURE_ARG_COUNT(args,1);
			CGContextSetBlendMode(context, [self blendModeFromString:[TiUtils stringValue:[args objectAtIndex:0]]]);
			break;
		}
		case TiCanvasFont:
		{
			ENSURE_ARG_COUNT(args,1);
			CGContextSelectFont(context,[[args objectAtIndex:0] UTF8String],40,kCGEncodingMacRoman);
			//CGContextSetFont(context, fontRef);
			break;
		}
		case TiCanvasTextAlign:
		{
			//TODO: how to do this in core graphics?
			break;
		}
		case TiCanvasTextBaseline:
		{
			//TODO: how to do this in core graphics?
			break;
		}			
		case TiCanvasFillText:
		{
			//NOTE: Core Graphics doesn't support Unicode text drawing. Suggests ATSUI or Cocoa
			NSString *text = [args objectAtIndex:0];
			CGFloat x = [TiUtils floatValue:[args objectAtIndex:1]];
			CGFloat y = [TiUtils floatValue:[args objectAtIndex:2]];
			//TODO: max support
			CGContextShowTextAtPoint(context, x, y, [text UTF8String], [text length]);
			break;
		}
	}
}

-(void)drawRect:(CGRect)rect
{
	CGContextRef ctx = UIGraphicsGetCurrentContext();
	
	CGContextClearRect(ctx, rect);
	
	// invert origin to be left,top
	CGContextTranslateCTM(ctx, 0, rect.size.height);
	CGContextScaleCTM(ctx, 1.0, -1.0);
	
	for (NSArray *operation in operations)
	{
		int op = [TiUtils intValue:[operation objectAtIndex:0]];
		NSArray *args = operation!=nil && [operation count] > 1 ? [operation objectAtIndex:1] : nil;
		[self draw:ctx operation:op args:args];
	}

	RELEASE_TO_NIL(operations);
}

#define MAKE_OP(name,name2) \
-(void)name:(NSArray*)args\
{\
	[operations addObject:[NSArray arrayWithObjects:NUMINT(TiCanvas##name2),args,nil]];\
}\
\
-(void)set##name2##_:(id)arg\
{\
	[operations addObject:[NSArray arrayWithObjects:NUMINT(TiCanvas##name2),[NSArray arrayWithObject:arg],nil]];\
}\


#pragma mark Public

MAKE_OP(fillStyle,FillStyle);
MAKE_OP(fillRect,FillRect);
MAKE_OP(clearRect,ClearRect);
MAKE_OP(strokeRect,StrokeRect);
MAKE_OP(strokeStyle,StrokeStyle);
MAKE_OP(lineWidth,LineWidth);
MAKE_OP(fillElipse,FillElipse);
MAKE_OP(lineJoin,LineJoin);
MAKE_OP(lineCap,LineCap);
MAKE_OP(lineTo,LineTo);
MAKE_OP(moveTo,MoveTo);
MAKE_OP(beginPath,BeginPath);
MAKE_OP(closePath,ClosePath);
MAKE_OP(fill,Fill);
MAKE_OP(shadow,Shadow);
MAKE_OP(clip,Clip);
MAKE_OP(arc,Arc);
MAKE_OP(arcTo,ArcTo);
MAKE_OP(bezierCurveTo,BezierCurveTo);
MAKE_OP(stroke,Stroke);
MAKE_OP(quadraticCurveTo,QuadraticCurveTo);
MAKE_OP(globalAlpha,GlobalAlpha);
MAKE_OP(globalCompositeOperation,GlobalCompositeOperation);
MAKE_OP(font,Font);
MAKE_OP(textAlign,TextAlign);
MAKE_OP(textBaseline,TextBaseline);
MAKE_OP(fillText,FillText);

@end

#endif