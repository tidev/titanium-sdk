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
    BOOL ignorePercent = NO;
    CGSize parentSize = CGSizeZero;
    
    if ([autoSizer isKindOfClass:[TiViewProxy class]]) {
        TiViewProxy* parent = [(TiViewProxy*)autoSizer parent];
        if (parent != nil && (!TiLayoutRuleIsAbsolute([parent layoutProperties]->layoutStyle))) {
            //Sandbox with percent values is garbage
            ignorePercent = YES;
            parentSize = [parent size].rect.size;
        }      
    }
    

	if(resultResizing != NULL)
	{
		*resultResizing &= ~(UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight);
	}

    switch (constraint->width.type)
    {
        case TiDimensionTypeDip:
            width = TiDimensionCalculateValue(constraint->width, referenceSize.width);
            break;
        case TiDimensionTypePercent:
            if (ignorePercent) {
                width = TiDimensionCalculateValue(constraint->width, parentSize.width);
            }
            else {
                width = TiDimensionCalculateValue(constraint->width, referenceSize.width);
            }
            break;
        case TiDimensionTypeUndefined:
            if (!TiDimensionIsUndefined(constraint->left) && !TiDimensionIsUndefined(constraint->centerX) ) {
                width = 2 * ( TiDimensionCalculateValue(constraint->centerX, referenceSize.width) - TiDimensionCalculateValue(constraint->left, referenceSize.width) );
                break;
            }
            else if (!TiDimensionIsUndefined(constraint->left) && !TiDimensionIsUndefined(constraint->right) ) {
                width = TiDimensionCalculateMargins(constraint->left, constraint->right, referenceSize.width);
                break;
            }
            else if (!TiDimensionIsUndefined(constraint->centerX) && !TiDimensionIsUndefined(constraint->right) ) {
                width = 2 * ( referenceSize.width - TiDimensionCalculateValue(constraint->right, referenceSize.width) - TiDimensionCalculateValue(constraint->centerX, referenceSize.width));
                break;
            }
        case TiDimensionTypeAuto:
        case TiDimensionTypeAutoSize:
        case TiDimensionTypeAutoFill:
        {
            width = TiDimensionCalculateMargins(constraint->left, constraint->right, referenceSize.width);
            BOOL autoFill = NO;
            //Undefined falls to auto behavior
            if ( TiDimensionIsUndefined(constraint->width) || TiDimensionIsAuto(constraint->width) ) 
            {
                //Check if default auto behavior is fill
                if ([autoSizer respondsToSelector:@selector(defaultAutoWidthBehavior:)]) {
                    if (TiDimensionIsAutoFill([autoSizer defaultAutoWidthBehavior:nil])) {
                        autoFill = YES;
                    }
                }
            }
            if (TiDimensionIsAutoFill(constraint->width) || autoFill) {
                if(resultResizing != NULL){
                    *resultResizing |= UIViewAutoresizingFlexibleWidth;
                }
                break;
            }
            //If it comes here it has to follow SIZE behavior
            if ([autoSizer respondsToSelector:@selector(autoWidthForSize:)])
            {
                CGFloat desiredWidth = [autoSizer autoWidthForSize:CGSizeMake(width, referenceSize.height)];
                width = width < desiredWidth?width:desiredWidth;
            }
            else if(resultResizing != NULL)
            {
                *resultResizing |= UIViewAutoresizingFlexibleWidth;
            }
            break;
        }
    }
	
    //Should we always do this or only for auto
    if ([autoSizer respondsToSelector:@selector(verifyWidth:)])
    {
        width = [autoSizer verifyWidth:width];
    }
	
    CGFloat height;

    switch (constraint->height.type)
    {
        case TiDimensionTypeDip:
            height = TiDimensionCalculateValue(constraint->height, referenceSize.height);
            break;
        case TiDimensionTypePercent:
            if (ignorePercent) {
                height = TiDimensionCalculateValue(constraint->height, parentSize.height);
            }
            else {
                height = TiDimensionCalculateValue(constraint->height, referenceSize.height);
            }
            break;
        case TiDimensionTypeUndefined:
            if (!TiDimensionIsUndefined(constraint->top) && !TiDimensionIsUndefined(constraint->centerY) ) {
                height = 2 * ( TiDimensionCalculateValue(constraint->centerY, referenceSize.height) - TiDimensionCalculateValue(constraint->top, referenceSize.height) );
                break;
            }
            else if (!TiDimensionIsUndefined(constraint->top) && !TiDimensionIsUndefined(constraint->bottom) ) {
                height = TiDimensionCalculateMargins(constraint->top, constraint->bottom, referenceSize.height);
                break;
            }
            else if (!TiDimensionIsUndefined(constraint->centerY) && !TiDimensionIsUndefined(constraint->bottom) ) {
                height = 2 * ( referenceSize.height - TiDimensionCalculateValue(constraint->centerY, referenceSize.height) - TiDimensionCalculateValue(constraint->bottom, referenceSize.height) );
                break;
            }
        case TiDimensionTypeAuto:
        case TiDimensionTypeAutoSize:
        case TiDimensionTypeAutoFill:
        {
            height = TiDimensionCalculateMargins(constraint->top, constraint->bottom, referenceSize.height);
            BOOL autoFill = NO;
            //Undefined falls to auto behavior
            if ( TiDimensionIsUndefined(constraint->height) || TiDimensionIsAuto(constraint->height) ) 
            {
                //Check if default auto behavior is fill
                if ([autoSizer respondsToSelector:@selector(defaultAutoHeightBehavior:)]) {
                    if (TiDimensionIsAutoFill([autoSizer defaultAutoHeightBehavior:nil])) {
                        autoFill = YES;
                    }
                }
            }
            if (TiDimensionIsAutoFill(constraint->height) || autoFill) {
                if(resultResizing != NULL){
                    *resultResizing |= UIViewAutoresizingFlexibleHeight;
                }
                break;
            }
            //If it comes here it has to follow size behavior
            if ([autoSizer respondsToSelector:@selector(autoHeightForSize:)])
            {
                CGFloat desiredHeight = [autoSizer autoHeightForSize:CGSizeMake(width, height)];
                height = height < desiredHeight?height:desiredHeight;
            }
            else if(resultResizing != NULL)
            {
                *resultResizing |= UIViewAutoresizingFlexibleHeight;
            }
			break;
        }
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
    
    CGFloat centerX = 0.0f;
    
    BOOL ignoreMargins = NO;
    BOOL isSizeUndefined = TiDimensionIsUndefined(constraint->width);
    
    CGFloat frameLeft = 0.0;
    if (!flexibleSize) {
        if (TiDimensionIsUndefined(constraint->width)) {
            ignoreMargins = TiDimensionDidCalculateValue(constraint->centerX, referenceSize.width, &centerX);
        }
        else if(!TiDimensionDidCalculateValue(constraint->left, referenceSize.width, &frameLeft))
        {
            ignoreMargins = TiDimensionDidCalculateValue(constraint->centerX, referenceSize.width, &centerX);
        }
    }
	
    if (!ignoreMargins)
    {
        //Either the view has flexible width or pins were not defined for positioning
        int marginSuggestions=0;
        
        if(TiDimensionDidCalculateValue(constraint->left, referenceSize.width, &frameLeft))
        {
            marginSuggestions++;
        }
        else if (!flexibleSize)
        {
            *resultResizing |= UIViewAutoresizingFlexibleLeftMargin;
        }
        
        if (isSizeUndefined || (marginSuggestions == 0) || flexibleSize) {
            
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
    
    
    isSizeUndefined = TiDimensionIsUndefined(constraint->height);
    ignoreMargins = NO;
    CGFloat frameTop = 0.0;
    if(!flexibleSize) {
        if (TiDimensionIsUndefined(constraint->height)) {
            ignoreMargins = TiDimensionDidCalculateValue(constraint->centerY, referenceSize.height, &centerY);
        }
        else if(!TiDimensionDidCalculateValue(constraint->top, referenceSize.height, &frameTop))
        {
            ignoreMargins = TiDimensionDidCalculateValue(constraint->centerY, referenceSize.height, &centerY);;
        }
    }
 
	
    if (!ignoreMargins)
    {
        //Either the view has flexible height or pins were not defined for positioning
        int marginSuggestions=0;
        
        if(TiDimensionDidCalculateValue(constraint->top, referenceSize.height, &frameTop))
        {
            marginSuggestions++;
        }
        else if (!flexibleSize)
        {
            *resultResizing |= UIViewAutoresizingFlexibleTopMargin;
        }
        if (isSizeUndefined || (marginSuggestions == 0) || flexibleSize) {
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
    
    return CGPointMake(centerX, centerY);
}

void ApplyConstraintToViewWithBounds(LayoutConstraint * constraint, TiUIView * subView, CGRect viewBounds)
{
	if(constraint == NULL)
	{
		DebugLog(@"[ERROR] No constraints available for view %@.", subView);
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