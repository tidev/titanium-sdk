/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "LayoutConstraint.h"
#import "QuartzCore/QuartzCore.h"

CGRect ApplyConstraintToSizeWithResizing(LayoutConstraint * constraint,CGSize viewBounds,UIViewAutoresizing * resultResizing)
{
	CGRect resultFrame;
	UIViewAutoresizing resultMask;
	
	if(constraint->hasLeftConstraint){
		resultFrame.origin.x = constraint->left;
		if(constraint->hasRightConstraint){
			resultFrame.size.width = viewBounds.width-(constraint->left+constraint->right);
			resultMask = UIViewAutoresizingFlexibleWidth;
		} else if(constraint->hasWidthConstraint){
			resultFrame.size.width = constraint->width;
			resultMask = UIViewAutoresizingFlexibleRightMargin;
		} else {
			resultFrame.size.width = viewBounds.width-constraint->left;
			resultMask = UIViewAutoresizingFlexibleWidth;
		}
		
	} else if(constraint->hasRightConstraint){
		if(constraint->hasWidthConstraint){
			resultFrame.size.width = constraint->width;
			resultFrame.origin.x = viewBounds.width - (constraint->right+constraint->width);
			resultMask = UIViewAutoresizingFlexibleLeftMargin;
		} else {
			resultFrame.origin.x = 0;
			resultFrame.size.width = viewBounds.width - constraint->right;
			resultMask = UIViewAutoresizingFlexibleWidth;
		}
		
	} else if(constraint->hasWidthConstraint){
		resultFrame.size.width = constraint->width;
		resultFrame.origin.x = (viewBounds.width-constraint->width)/2;
		resultMask = UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleRightMargin;
		
	} else {
		resultFrame.origin.x=0;
		resultFrame.size.width=viewBounds.width;
		resultMask = UIViewAutoresizingFlexibleWidth;
	}
	
	
	if(constraint->hasTopConstraint){
		resultFrame.origin.y = constraint->top;
		if(constraint->hasBottomConstraint){
			resultFrame.size.height = viewBounds.height-(constraint->top+constraint->bottom);
			resultMask |= UIViewAutoresizingFlexibleHeight;
		} else if(constraint->hasHeightConstraint){
			resultFrame.size.height = constraint->height;
			resultMask |= UIViewAutoresizingFlexibleBottomMargin;
		} else {
			resultFrame.size.height = viewBounds.height-constraint->top;
			resultMask |= UIViewAutoresizingFlexibleHeight;
		}
		
	} else if(constraint->hasBottomConstraint){
		if(constraint->hasHeightConstraint){
			resultFrame.size.height = constraint->height;
			resultFrame.origin.y = viewBounds.height - (constraint->bottom+constraint->height);
			resultMask |= UIViewAutoresizingFlexibleTopMargin;
		} else {
			resultFrame.origin.y = 0;
			resultFrame.size.height = viewBounds.height - constraint->bottom;
			resultMask |= UIViewAutoresizingFlexibleHeight;
		}
		
	} else if(constraint->hasHeightConstraint){
		resultFrame.size.height = constraint->height;
		resultFrame.origin.y = (viewBounds.height-constraint->height)/2;
		resultMask |= UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleBottomMargin;
		
	} else{
		resultFrame.origin.y=0;
		resultFrame.size.height = viewBounds.height;
		resultMask |= UIViewAutoresizingFlexibleHeight;
		
	}	
	
	if(resultResizing != nil)*resultResizing = resultMask;
		return resultFrame;
}

void ApplyConstraintToViewWithinViewWithBounds(LayoutConstraint * constraint,UIView * subView,UIView * superView,CGSize viewBounds)
{
	UIViewAutoresizing resultMask;
	CGRect resultFrame;
	
	resultFrame = ApplyConstraintToSizeWithResizing(constraint,viewBounds,&resultMask);
	
	[[subView layer] setZPosition:(constraint->hasZConstraint)?constraint->z:0];
	[subView setAutoresizingMask:resultMask];
	[subView setFrame:resultFrame];
	if([subView superview]!=superView)[superView addSubview:subView];
}

#define READ_CONSTRAINT(key,boolVar,floatVar)	\
inputVal = [inputDict objectForKey:key];	\
constraint->boolVar = [inputVal respondsToSelector:floatValue];	\
if(constraint->boolVar)constraint->floatVar = [inputVal floatValue];

void ReadConstraintFromDictionary(LayoutConstraint * constraint, NSDictionary * inputDict)
{
	SEL floatValue = @selector(floatValue);
	NSNumber * inputVal;
	READ_CONSTRAINT(@"zIndex",hasZConstraint,z);
	READ_CONSTRAINT(@"left",hasLeftConstraint,left);
	READ_CONSTRAINT(@"right",hasRightConstraint,right);
	READ_CONSTRAINT(@"width",hasWidthConstraint,width);
	READ_CONSTRAINT(@"top",hasTopConstraint,top);
	READ_CONSTRAINT(@"bottom",hasBottomConstraint,bottom);
	READ_CONSTRAINT(@"height",hasHeightConstraint,height);
	
}


