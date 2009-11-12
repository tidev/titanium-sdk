/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>

typedef struct {

	CGFloat z;
	
	CGFloat left;
	CGFloat right;
	CGFloat width;
	
	CGFloat top;
	CGFloat bottom;
	CGFloat height;
	
	BOOL hasZConstraint;
	
	BOOL hasLeftConstraint;
	BOOL hasRightConstraint;
	BOOL hasWidthConstraint;

	BOOL hasTopConstraint;
	BOOL hasBottomConstraint;
	BOOL hasHeightConstraint;

} LayoutConstraint;

CGRect ApplyConstraintToRectWithResizing(LayoutConstraint * constraint,CGRect viewBounds,UIViewAutoresizing * resultResizing);
void ApplyConstraintToViewWithinViewWithBounds(LayoutConstraint * constraint,UIView * subView,UIView * superView,CGRect viewBounds);
void ReadConstraintFromDictionary(LayoutConstraint * constraint, NSDictionary * inputDict, LayoutConstraint * inheritance);


