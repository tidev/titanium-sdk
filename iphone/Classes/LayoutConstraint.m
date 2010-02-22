/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "LayoutConstraint.h"
#import "QuartzCore/QuartzCore.h"
#import "TiUtils.h"

/* BEGIN PSEUDOCODE

First try width.

Width is constant or percent: create a width value appropriate. Consult view if it's a valid width.
Width is auto: Consult view on preferred width. If so, use it. If not, act as if it's undefined.

Okay, see if we have a width. If so, look to see if we have x. If so, we're done for horizontal.

If width is valid:
	if x is constant or percent:
		create a valid x
	else if left and right are defined:
		Balance springily.
	else if left is defined
		x = left + width*anchorpoint
	else if right is defined
		x = superviewwidth - right - width*anchorpoint
	else (left and right are undefined)
		x = superviewwidth/2 - width*anchorpoint
else (width is invalid)
	(Same as before)

*/




CGSize SizeConstraintViewWithSizeAddingResizing(LayoutConstraint * constraint, UIView * subView, CGSize boundSize, UIViewAutoresizing * resultResizing)
{
	//TODO: Refactor for elegance.
	CGFloat width = boundSize.width;

	switch (constraint->width.type)
	{
		case TiDimensionTypePercent:
			width *= constraint->width.value;
			break;
		case TiDimensionTypePixels:
			width = constraint->width.value;
			break;
		default:
			{
				CGFloat desiredLeft = TiDimensionCalculateValue(constraint->left,width);
				CGFloat desiredRight = TiDimensionCalculateValue(constraint->right,width);
				width -= desiredLeft + desiredRight;
				if (TiDimensionIsAuto(constraint->width) && 
					[subView respondsToSelector:@selector(autoWidthForWidth:)])
				{
					width = [(id<LayoutAutosizing>)subView autoWidthForWidth:width];
				}
				else
				{
					*resultResizing |= UIViewAutoresizingFlexibleWidth;
				}
			}
			break;
	}
	
	if ([subView respondsToSelector:@selector(verifyWidth:)])
	{
		width = [(id<LayoutAutosizing>)subView verifyWidth:width];
	}
	
	CGFloat height = boundSize.height;

	switch (constraint->height.type)
	{
		case TiDimensionTypePercent:
			height *= constraint->height.value;
			break;
		case TiDimensionTypePixels:
			height = constraint->height.value;
			break;
		default:
			{
				CGFloat desiredTop = TiDimensionCalculateValue(constraint->top,height);
				CGFloat desiredBottom = TiDimensionCalculateValue(constraint->bottom,height);
				if (TiDimensionIsAuto(constraint->height) && 
					[subView respondsToSelector:@selector(autoHeightForWidth:)])
				{
					height = [(id<LayoutAutosizing>)subView autoHeightForWidth:width];
				}
				else
				{
					height -= desiredTop + desiredBottom;
					*resultResizing |= UIViewAutoresizingFlexibleHeight;
				}
			}
			break;
	}

	if ([subView respondsToSelector:@selector(verifyHeight:)])
	{
		height = [(id<LayoutAutosizing>)subView verifyHeight:height];
	}

	if ([subView respondsToSelector:@selector(verifyAutoresizing:)])
	{
		*resultResizing = [(id<LayoutAutosizing>)subView verifyAutoresizing:*resultResizing];
	}
	
	return CGSizeMake(width, height);
}



CGPoint PositionConstraintGivenSizeBoundsAddingResizing(LayoutConstraint * constraint, CGSize viewSize, CGPoint anchorPoint, CGSize superViewSize, UIViewAutoresizing * resultResizing)
{
	BOOL flexibleSize = *resultResizing & UIViewAutoresizingFlexibleWidth;
	BOOL useMargins = YES;
	CGFloat centerX;

	if(!flexibleSize)
	{	
		//The width will be flexible if and only if it was undefined.
		switch (constraint->centerX.type)
		{
			case TiDimensionTypePercent:
			{
				centerX = superViewSize.width * constraint->centerX.value;
				useMargins = NO;
				break;
			}
			case TiDimensionTypePixels:
			{
				centerX = constraint->centerX.value;
				useMargins = NO;
				break;
			}
			//Auto and undefined are treated the same, using margins instead.
		}
	}
	
	if (useMargins)
	{
		int marginSuggestions=0;
		CGFloat frameLeft = 0.0;
		switch (constraint->left.type)
		{
			case TiDimensionTypePercent:
			{
				frameLeft += constraint->left.value * superViewSize.width;
				marginSuggestions++;
				break;
			}
			case TiDimensionTypePixels:
			{
				frameLeft += constraint->left.value;
				marginSuggestions++;
				break;
			}
			default:
			{
				if (!flexibleSize)
				{
					*resultResizing |= UIViewAutoresizingFlexibleLeftMargin;
				}
				break;
			}
		}

		switch (constraint->right.type)
		{
			case TiDimensionTypePercent:
			{
				frameLeft += (1.0-constraint->right.value) * superViewSize.width - viewSize.width;
				marginSuggestions++;
				break;
			}
			case TiDimensionTypePixels:
			{
				frameLeft += (superViewSize.width - constraint->right.value) - viewSize.width;
				marginSuggestions++;
				break;
			}
			default:
			{
				if (!flexibleSize)
				{
					*resultResizing |= UIViewAutoresizingFlexibleRightMargin;
				}
				break;
			}
		}
		
		if (marginSuggestions < 1)
		{
			centerX = superViewSize.width/2.0 + viewSize.width*(anchorPoint.x-0.5);
		}
		else
		{
			centerX = frameLeft/marginSuggestions + viewSize.width*anchorPoint.x;
		}
	}
	
	
	
	flexibleSize = *resultResizing & UIViewAutoresizingFlexibleHeight;
	useMargins = YES;
	CGFloat centerY;

	if(!flexibleSize)
	{	
		//The width will be flexible if and only if it was undefined.
		switch (constraint->centerY.type)
		{
			case TiDimensionTypePercent:
			{
				centerY = superViewSize.width * constraint->centerY.value;
				useMargins = NO;
				break;
			}
			case TiDimensionTypePixels:
			{
				centerY = constraint->centerY.value;
				useMargins = NO;
				break;
			}
			//Auto and undefined are treated the same, using margins instead.
		}
	}
	
	if (useMargins)
	{
		int marginSuggestions=0;
		CGFloat frameTop = 0.0;
		switch (constraint->top.type)
		{
			case TiDimensionTypePercent:
			{
				frameTop += constraint->top.value * superViewSize.height;
				marginSuggestions++;
				break;
			}
			case TiDimensionTypePixels:
			{
				frameTop += constraint->top.value;
				marginSuggestions++;
				break;
			}
			default:
			{
				if (!flexibleSize)
				{
					*resultResizing |= UIViewAutoresizingFlexibleTopMargin;
				}
				break;
			}
		}

		switch (constraint->bottom.type)
		{
			case TiDimensionTypePercent:
			{
				frameTop += (1.0-constraint->bottom.value) * superViewSize.height - viewSize.height;
				marginSuggestions++;
				break;
			}
			case TiDimensionTypePixels:
			{
				frameTop += (superViewSize.height - constraint->bottom.value) - viewSize.height;
				marginSuggestions++;
				break;
			}
			default:
			{
				if (!flexibleSize)
				{
					*resultResizing |= UIViewAutoresizingFlexibleBottomMargin;
				}
				break;
			}
		}
		
		if (marginSuggestions < 1)
		{
			centerY = superViewSize.height/2.0 + viewSize.height*(anchorPoint.y-0.5);
		}
		else
		{
			centerY = frameTop/marginSuggestions + viewSize.height*anchorPoint.y;
		}
	}

	return CGPointMake(centerX, centerY);
}

void ApplyConstraintToViewWithinViewWithBounds(LayoutConstraint * constraint, UIView * subView, UIView * superView, CGRect viewBounds, BOOL addToSuperView)
{
	UIViewAutoresizing resultMask = UIViewAutoresizingNone;
	CGRect resultBounds;
	resultBounds.origin = CGPointZero;
	resultBounds.size = SizeConstraintViewWithSizeAddingResizing(constraint, subView, viewBounds.size, &resultMask);
	
	CGPoint resultCenter = PositionConstraintGivenSizeBoundsAddingResizing(constraint, resultBounds.size,
			[[subView layer] anchorPoint], viewBounds.size, &resultMask);
	
	resultCenter.x += resultBounds.origin.x;
	resultCenter.y += resultBounds.origin.y;
	
	[subView setAutoresizingMask:resultMask];
	[subView setCenter:resultCenter];
	[subView setBounds:resultBounds];
	
	if(addToSuperView && [subView superview]!=superView)
	{
		[superView addSubview:subView];
	}
}

#define READ_CONSTRAINT(key,value)	\
inputVal = [inputDict objectForKey:key];	\
if(inputVal != nil) \
{ \
constraint->value = TiDimensionFromObject(inputVal); \
} \
else if(inheritance!=NULL) \
{ \
constraint->value=inheritance->value; \
} \
else \
{ \
constraint->value = TiDimensionUndefined; \
}

void ReadConstraintFromDictionary(LayoutConstraint * constraint, NSDictionary * inputDict, LayoutConstraint * inheritance)
{
	if (constraint == NULL)
	{
		return;
	}
	//If the inputdict is null, this flows through properly, inheriting properly.
	id inputVal;
	READ_CONSTRAINT(@"left",left);
	READ_CONSTRAINT(@"right",right);
	READ_CONSTRAINT(@"width",width);
	READ_CONSTRAINT(@"top",top);
	READ_CONSTRAINT(@"bottom",bottom);
	READ_CONSTRAINT(@"height",height);
	inputDict = [inputDict objectForKey:@"center"];
	READ_CONSTRAINT(@"x",centerY);
	READ_CONSTRAINT(@"y",centerX);
}

CGFloat WidthFromConstraintGivenWidth(LayoutConstraint * constraint, CGFloat viewWidth)
{
	switch (constraint->width.type)
	{
		case TiDimensionTypePixels:
		{
			return constraint->width.value;
		}
		case TiDimensionTypePercent:
		{
			return constraint->width.value * viewWidth;
		}
	}

	return viewWidth - (TiDimensionCalculateValue(constraint->left, viewWidth) + TiDimensionCalculateValue(constraint->right, viewWidth));
}

BOOL IsLayoutUndefined(LayoutConstraint *constraint)
{
	// if all values are undefined, the layout is considered undefined.
	return TiDimensionIsUndefined(constraint->top)&&
		   TiDimensionIsUndefined(constraint->left)&&
		   TiDimensionIsUndefined(constraint->right)&&
		   TiDimensionIsUndefined(constraint->bottom)&&
		   TiDimensionIsUndefined(constraint->width)&&
		   TiDimensionIsUndefined(constraint->height);
}