/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>
#import "TiDimension.h"

@protocol LayoutAutosizing

@optional

-(CGFloat)minimumParentWidthForWidth:(CGFloat)suggestedWidth;
-(CGFloat)minimumParentHeightForWidth:(CGFloat)suggestedWidth;

-(CGFloat)autoWidthForWidth:(CGFloat)suggestedWidth;
-(CGFloat)autoHeightForWidth:(CGFloat)width;

-(CGFloat)verifyWidth:(CGFloat)suggestedWidth;
-(CGFloat)verifyHeight:(CGFloat)suggestedHeight;

-(UIViewAutoresizing)verifyAutoresizing:(UIViewAutoresizing)suggestedResizing;

@end

typedef enum {
	LayoutRuleAbsolute,
	LayoutRuleVertical,
} LayoutRule;



typedef struct LayoutConstraint {

	TiDimension centerX;
	TiDimension left;
	TiDimension right;
	TiDimension width;
	
	TiDimension centerY;
	TiDimension top;
	TiDimension bottom;
	TiDimension height;
	
	LayoutRule layout;
	
} LayoutConstraint;


void ApplyConstraintToViewWithinViewWithBounds(LayoutConstraint * constraint,UIView * subView,UIView * superView,CGRect viewBounds,BOOL addToSuperview);
void ReadConstraintFromDictionary(LayoutConstraint * constraint, NSDictionary * inputDict, LayoutConstraint * inheritance);
CGFloat WidthFromConstraintGivenWidth(LayoutConstraint * constraint,CGFloat viewWidth);
CGSize SizeConstraintViewWithSizeAddingResizing(LayoutConstraint * constraint, UIView * subView, CGSize boundSize, UIViewAutoresizing * resultResizing);
BOOL IsLayoutUndefined(LayoutConstraint *constraint);
