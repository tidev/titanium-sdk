/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "LayoutConstraint.h"
#import "QuartzCore/QuartzCore.h"
#import "TiUtils.h"
#import "TiUIView.h"
#import "TiViewProxy.h"

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




CGSize SizeConstraintViewWithSizeAddingResizing(LayoutConstraint * constraint, NSObject<LayoutAutosizing> * autoSizer, CGSize boundSize, UIViewAutoresizing * resultResizing)
{
	//TODO: Refactor for elegance.
	CGFloat width;

	if(resultResizing != NULL)
	{
		*resultResizing &= ~(UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight);
	}

	switch (constraint->width.type)
	{
		case TiDimensionTypePercent:
		case TiDimensionTypePixels:
			width = TiDimensionCalculateValue(constraint->width, boundSize.width);
			break;
		default:
			{
				width = TiDimensionCalculateMargins(constraint->left, constraint->right, boundSize.width);
				if (TiDimensionIsAuto(constraint->width) && 
					[autoSizer respondsToSelector:@selector(autoWidthForWidth:)])
				{
					width = [autoSizer autoWidthForWidth:width];
				}
				else if(resultResizing != NULL)
				{
					*resultResizing |= UIViewAutoresizingFlexibleWidth;
				}
			}
			break;
	}
	
	if ([autoSizer respondsToSelector:@selector(verifyWidth:)])
	{
		width = [autoSizer verifyWidth:width];
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
				if (TiDimensionIsAuto(constraint->height) && 
					[autoSizer respondsToSelector:@selector(autoHeightForWidth:)])
				{
					height = [autoSizer autoHeightForWidth:width];
				}
				else
				{
					height = TiDimensionCalculateMargins(constraint->top, constraint->bottom, boundSize.height);
					if(resultResizing != NULL)
					{
						*resultResizing |= UIViewAutoresizingFlexibleHeight;
					}
				}
			}
			break;
	}
	
	if ([autoSizer respondsToSelector:@selector(verifyHeight:)])
	{
		height = [autoSizer verifyHeight:height];
	}

	// when you use negative top, you get into a situation where you get smaller
	// then intended sizes when using auto.  this allows you to set a floor for
	// the height/width so that it won't be smaller than specified - defaults to 0
	height = MAX(constraint->minimumHeight,height);
	width = MAX(constraint->minimumWidth,width);
	
	if ((resultResizing != NULL) && [autoSizer respondsToSelector:@selector(verifyAutoresizing:)])
	{
		*resultResizing = [autoSizer verifyAutoresizing:*resultResizing];
	}
	
	return CGSizeMake(width, height);
}



CGPoint PositionConstraintGivenSizeBoundsAddingResizing(LayoutConstraint * constraint, CGSize viewSize, CGPoint anchorPoint, CGSize superViewSize, UIViewAutoresizing * resultResizing)
{
	BOOL flexibleSize = *resultResizing & UIViewAutoresizingFlexibleWidth;

	*resultResizing &= ~(UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleRightMargin | UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleBottomMargin);

	BOOL ignoreMargins;
	CGFloat centerX;

	if(!flexibleSize)
	{
		ignoreMargins = TiDimensionDidCalculateValue(constraint->centerX, superViewSize.width, &centerX);
	}
	else
	{
		ignoreMargins = NO;
	}

	
	if (!ignoreMargins)
	{
		int marginSuggestions=0;
		CGFloat frameLeft = 0.0;
		if(TiDimensionDidCalculateValue(constraint->left, superViewSize.width, &frameLeft))
		{
			marginSuggestions++;
		}
		else if (!flexibleSize)
		{
			*resultResizing |= UIViewAutoresizingFlexibleLeftMargin;
		}

		CGFloat frameRight;
		if(TiDimensionDidCalculateValue(constraint->right, superViewSize.width, &frameRight))
		{
			marginSuggestions++;
			frameLeft += superViewSize.width - viewSize.width - frameRight;
		}
		else if (!flexibleSize)
		{
			*resultResizing |= UIViewAutoresizingFlexibleRightMargin;
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
	CGFloat centerY;

	if(!flexibleSize)
	{
		ignoreMargins = TiDimensionDidCalculateValue(constraint->centerY, superViewSize.width, &centerY);
	}
	else
	{
		ignoreMargins = NO;
	}
	
	if (!ignoreMargins)
	{
		int marginSuggestions=0;
		CGFloat frameTop = 0.0;
		if(TiDimensionDidCalculateValue(constraint->top, superViewSize.height, &frameTop))
		{
			marginSuggestions++;
		}
		else if (!flexibleSize)
		{
			*resultResizing |= UIViewAutoresizingFlexibleTopMargin;
		}

		CGFloat frameBottom;
		if(TiDimensionDidCalculateValue(constraint->bottom, superViewSize.height, &frameBottom))
		{
			marginSuggestions++;
			frameTop += superViewSize.height - viewSize.height - frameBottom;
		}
		else if (!flexibleSize)
		{
			*resultResizing |= UIViewAutoresizingFlexibleBottomMargin;
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

void ApplyConstraintToViewWithinViewWithBounds(LayoutConstraint * constraint, TiUIView * subView, UIView * superView, CGRect viewBounds, BOOL addToSuperView)
{
	if(constraint == NULL)
	{
		NSLog(@"[ERROR] Trying to constraint a view without a proxy's layout.");
		return;
	}

	UIViewAutoresizing resultMask = UIViewAutoresizingNone;
	CGRect resultBounds;
	resultBounds.origin = CGPointZero;
	resultBounds.size = SizeConstraintViewWithSizeAddingResizing(constraint,(TiViewProxy *)[subView proxy], viewBounds.size, &resultMask);
	
	CGPoint resultCenter = PositionConstraintGivenSizeBoundsAddingResizing(constraint, resultBounds.size,
			[[subView layer] anchorPoint], viewBounds.size, &resultMask);
	
	resultCenter.x += resultBounds.origin.x + viewBounds.origin.x;
	resultCenter.y += resultBounds.origin.y + viewBounds.origin.y;
	
	[subView setAutoresizingMask:resultMask];
	[subView setCenter:resultCenter];
	[subView setBounds:resultBounds];
	
	if(addToSuperView && [subView superview]!=superView)
	{
		[superView addSubview:subView];
	}
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