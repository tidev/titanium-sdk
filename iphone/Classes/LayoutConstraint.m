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




CGSize SizeConstraintViewWithSizeAddingResizing(LayoutConstraint * constraint, NSObject<LayoutAutosizing> * autoSizer, CGSize referenceSize, UIViewAutoresizing * resultResizing)
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
        case TiDimensionTypeDip:
            width = TiDimensionCalculateValue(constraint->width, referenceSize.width);
            break;
        case TiDimensionTypeAutoFill:
            width = referenceSize.width;
            break;
        case TiDimensionTypeUndefined:
        case TiDimensionTypeAuto:
        case TiDimensionTypeAutoSize:
            //For undefined width, we will break out of the code early if the width can be implicitly calculated
            if (!TiDimensionIsUndefined(constraint->left) && !TiDimensionIsUndefined(constraint->centerX) ) {
                width = 2 * ( TiDimensionCalculateValue(constraint->centerX, referenceSize.width) - TiDimensionCalculateValue(constraint->left, referenceSize.width) );
                if (TiDimensionIsUndefined(constraint->width)) {
                    break;
                }
            }
            else if (!TiDimensionIsUndefined(constraint->left) && !TiDimensionIsUndefined(constraint->right) ) {
                width = TiDimensionCalculateMargins(constraint->left, constraint->right, referenceSize.width);
                if (TiDimensionIsUndefined(constraint->width)) {
                    break;
                }
            }
            else if (!TiDimensionIsUndefined(constraint->centerX) && !TiDimensionIsUndefined(constraint->right) ) {
                width = 2 * ( referenceSize.width - TiDimensionCalculateValue(constraint->right, referenceSize.width) - TiDimensionCalculateValue(constraint->centerX, referenceSize.width));
                if (TiDimensionIsUndefined(constraint->width)) {
                    break;
                }
            }
            else
            {
                //This is old code and it corresponds to the new code when above 3 conditions fail
                //width = TiDimensionCalculateMargins(constraint->left, constraint->right, referenceSize.width);
                width = referenceSize.width;
            }
            if ( (TiDimensionIsAuto(constraint->width) || TiDimensionIsAutoSize(constraint->width) ) && 
                [autoSizer respondsToSelector:@selector(autoWidthForWidth:)])
            {
                width = [autoSizer autoWidthForWidth:width];
            }
            else if(resultResizing != NULL)
            {
                *resultResizing |= UIViewAutoresizingFlexibleWidth;
            }
			break;
    }
	
    //Should we always do this or only for auto
    if ([autoSizer respondsToSelector:@selector(verifyWidth:)])
    {
        width = [autoSizer verifyWidth:width];
    }
	
    CGFloat height;

    switch (constraint->height.type)
    {
        case TiDimensionTypePercent:
        case TiDimensionTypeDip:
            height = TiDimensionCalculateValue(constraint->height, referenceSize.height);
            break;
        case TiDimensionTypeAutoFill:
            height = referenceSize.height;
            break;
        case TiDimensionTypeUndefined:
        case TiDimensionTypeAuto:
        case TiDimensionTypeAutoSize:
            //For undefined height, we will break out of the code early if the height can be implicitly calculated
            if (!TiDimensionIsUndefined(constraint->top) && !TiDimensionIsUndefined(constraint->centerY) ) {
                height = 2 * ( TiDimensionCalculateValue(constraint->centerY, referenceSize.height) - TiDimensionCalculateValue(constraint->top, referenceSize.height) );
                if (TiDimensionIsUndefined(constraint->height)) {
                    break;
                }
            }
            else if (!TiDimensionIsUndefined(constraint->top) && !TiDimensionIsUndefined(constraint->bottom) ) {
                height = TiDimensionCalculateMargins(constraint->top, constraint->bottom, referenceSize.height);
                if (TiDimensionIsUndefined(constraint->height)) {
                    break;
                }
            }
            else if (!TiDimensionIsUndefined(constraint->centerY) && !TiDimensionIsUndefined(constraint->bottom) ) {
                height = 2 * ( referenceSize.height - TiDimensionCalculateValue(constraint->centerY, referenceSize.height) - TiDimensionCalculateValue(constraint->bottom, referenceSize.height) );
                if (TiDimensionIsUndefined(constraint->height)) {
                    break;
                }
            }
            else {
                //When the above 3 conditions fail 
                height = referenceSize.height;
            }
            
            if ( (TiDimensionIsAuto(constraint->height) || TiDimensionIsAutoSize(constraint->height) )&& 
                [autoSizer respondsToSelector:@selector(autoHeightForWidth:)])
            {
                height = [autoSizer autoHeightForWidth:width];
            }
            else if(resultResizing != NULL)
            {
                *resultResizing |= UIViewAutoresizingFlexibleHeight;
            }
			break;
    }

    //Should we always do this or only for auto
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



CGPoint PositionConstraintGivenSizeBoundsAddingResizing(LayoutConstraint * constraint, TiViewProxy* viewProxy, CGSize viewSize, CGPoint anchorPoint, CGSize referenceSize, CGSize sandboxSize, UIViewAutoresizing * resultResizing)
{
    BOOL flexibleSize = *resultResizing & UIViewAutoresizingFlexibleWidth;
    
    *resultResizing &= ~(UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleRightMargin | UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleBottomMargin);
    
    //PIN PRECEDENCE IS LEFT, CENTERX, RIGHT, TOP, CENTERY, BOTTOM
    CGFloat centerX = 0.0f;
    CGFloat validVal = 0.0f;
    BOOL ignoreMargins;
    
    if (!flexibleSize) {
        //I have a valid width value. Try and calculate center from pins
        ignoreMargins = TiDimensionDidCalculateValue(constraint->left, referenceSize.width, &validVal);
        if (ignoreMargins) {
            //Got left. So center is left + viewSize.width/2
            centerX = validVal + viewSize.width/2;
        }
        else {
            ignoreMargins = TiDimensionDidCalculateValue(constraint->centerX, referenceSize.width, &validVal);
            if (ignoreMargins) {
                //Got the center itself. Use it
                centerX = validVal;
            }
            else {
                ignoreMargins = TiDimensionDidCalculateValue(constraint->right, referenceSize.width, &validVal);
                if (ignoreMargins) {
                    //Got right. So left is sandboxSize.width - right - viewSize.width
                    //Center is left + viewSize.width/2 --> sandboxSize.width - right - viewSize.width/2
                    centerX = sandboxSize.width - validVal - viewSize.width/2;
                }
            }
        }
    }
    else {
        ignoreMargins = NO;
    }
	
    if (!ignoreMargins)
    {
        //Either the view has flexible width or pins were not defined for positioning
        int marginSuggestions=0;
        CGFloat frameLeft = 0.0;
        if(TiDimensionDidCalculateValue(constraint->left, referenceSize.width, &frameLeft))
        {
            marginSuggestions++;
        }
        else if (!flexibleSize)
        {
            *resultResizing |= UIViewAutoresizingFlexibleLeftMargin;
        }
        CGFloat frameRight;
        if(TiDimensionDidCalculateValue(constraint->right, referenceSize.width, &frameRight))
        {
            marginSuggestions++;
            frameLeft += sandboxSize.width - viewSize.width - frameRight;
        }
        else if (!flexibleSize)
        {
            *resultResizing |= UIViewAutoresizingFlexibleRightMargin;
        }
        if (marginSuggestions < 1)
        {
            centerX = sandboxSize.width/2.0 + viewSize.width*(anchorPoint.x-0.5);
        }
        else
        {
            centerX = frameLeft/marginSuggestions + viewSize.width*anchorPoint.x;
        }
    }
	
    flexibleSize = *resultResizing & UIViewAutoresizingFlexibleHeight;
    CGFloat centerY = 0.0f;
    
    if(!flexibleSize)
    {
        //I have a valid height value. Try and calculate center from pins
        ignoreMargins = TiDimensionDidCalculateValue(constraint->top, referenceSize.width, &validVal);
        if (ignoreMargins) {
            //Got top. So center is top + viewSize.height/2
            centerY = validVal + viewSize.height/2;
        }
        else {
            ignoreMargins = TiDimensionDidCalculateValue(constraint->centerY, referenceSize.width, &validVal);
            if (ignoreMargins) {
                //Got the center itself. Use it
                centerY = validVal;
            }
            else {
                ignoreMargins = TiDimensionDidCalculateValue(constraint->bottom, referenceSize.width, &validVal);
                if (ignoreMargins) {
                    //Got bottom. So left is sandboxSize.height - bottom - viewSize.height/2
                    centerY = sandboxSize.height - validVal - viewSize.height/2;
                }
            }
        }
    }
    else
    {
        ignoreMargins = NO;
    }
	
    if (!ignoreMargins)
    {
        //Either the view has flexible height or pins were not defined for positioning
        int marginSuggestions=0;
        CGFloat frameTop = 0.0;
        if(TiDimensionDidCalculateValue(constraint->top, referenceSize.height, &frameTop))
        {
            marginSuggestions++;
        }
        else if (!flexibleSize)
        {
            *resultResizing |= UIViewAutoresizingFlexibleTopMargin;
        }

        CGFloat frameBottom;
        if(TiDimensionDidCalculateValue(constraint->bottom, referenceSize.height, &frameBottom))
        {
            marginSuggestions++;
            frameTop += sandboxSize.height - viewSize.height - frameBottom;
        }
        else if (!flexibleSize)
        {
            *resultResizing |= UIViewAutoresizingFlexibleBottomMargin;
        }
        if (marginSuggestions < 1)
        {
            centerY = sandboxSize.height/2.0 + viewSize.height*(anchorPoint.y-0.5);
        }
        else
        {
            centerY = frameTop/marginSuggestions + viewSize.height*anchorPoint.y;
        }
    }
    
    //padding and margin are not used in positioning but added on after positioning is determined
    CGFloat xAdjustment = 0.0;
    CGFloat yAdjustment = 0.0;
    
    if ([viewProxy parent] != nil) {
        xAdjustment += ([[viewProxy parent] padLeft] - [[viewProxy parent] padRight]);
        yAdjustment += ([[viewProxy parent] padTop] - [[viewProxy parent] padBottom]);
    }
    
    //OK to send 0 as bounding value since these are supposed to be DIP only
    xAdjustment += (TiDimensionCalculateValue(constraint->marginLeft, 0.0) - TiDimensionCalculateValue(constraint->marginRight, 0.0));
    yAdjustment += (TiDimensionCalculateValue(constraint->marginTop, 0.0) - TiDimensionCalculateValue(constraint->marginBottom, 0.0));

    return CGPointMake(centerX+xAdjustment, centerY+yAdjustment);
}

void ApplyConstraintToViewWithBounds(LayoutConstraint * constraint, TiUIView * subView, CGRect viewBounds)
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
	
	CGPoint resultCenter = PositionConstraintGivenSizeBoundsAddingResizing(constraint, (TiViewProxy *)[subView proxy], resultBounds.size,
			[[subView layer] anchorPoint], viewBounds.size, viewBounds.size, &resultMask);
	
	resultCenter.x += resultBounds.origin.x + viewBounds.origin.x;
	resultCenter.y += resultBounds.origin.y + viewBounds.origin.y;
	
	[subView setAutoresizingMask:resultMask];
	[subView setCenter:resultCenter];
	[subView setBounds:resultBounds];
}

CGFloat WidthFromConstraintGivenWidth(LayoutConstraint * constraint, CGFloat viewWidth)
{
	switch (constraint->width.type)
	{
		case TiDimensionTypeDip:
		{
			return constraint->width.value;
		}
		case TiDimensionTypePercent:
		{
			return constraint->width.value * viewWidth;
		}
		default: {
			break;
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