/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "LayoutConstraint.h"
#import "QuartzCore/QuartzCore.h"

CGRect ApplyConstraintToRectWithResizing(LayoutConstraint * constraint,CGRect viewBounds,UIViewAutoresizing * resultResizing)
{
	CGRect resultFrame;
	UIViewAutoresizing resultMask;
	
	if(constraint->hasLeftConstraint){
		resultFrame.origin.x = constraint->left+viewBounds.origin.x;
		if(constraint->hasRightConstraint){
			resultFrame.size.width = viewBounds.size.width-(constraint->left+constraint->right);
			resultMask = UIViewAutoresizingFlexibleWidth;
		} else if(constraint->hasWidthConstraint){
			resultFrame.size.width = constraint->width;
			resultMask = UIViewAutoresizingFlexibleRightMargin;
		} else {
			resultFrame.size.width = viewBounds.size.width-constraint->left;
			resultMask = UIViewAutoresizingFlexibleWidth;
		}
		
	} else if(constraint->hasRightConstraint){
		if(constraint->hasWidthConstraint){
			resultFrame.size.width = constraint->width;
			resultFrame.origin.x = viewBounds.origin.x + viewBounds.size.width - (constraint->right+constraint->width);
			resultMask = UIViewAutoresizingFlexibleLeftMargin;
		} else {
			resultFrame.origin.x = viewBounds.origin.x;
			resultFrame.size.width = viewBounds.size.width - constraint->right;
			resultMask = UIViewAutoresizingFlexibleWidth;
		}
		
	} else if(constraint->hasWidthConstraint){
		resultFrame.size.width = constraint->width;
		resultFrame.origin.x = viewBounds.origin.x + (viewBounds.size.width-constraint->width)/2;
		resultMask = UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleRightMargin;
		
	} else {
		resultFrame.origin.x=viewBounds.origin.x;
		resultFrame.size.width=viewBounds.size.width;
		resultMask = UIViewAutoresizingFlexibleWidth;
	}
	
	
	if(constraint->hasTopConstraint){
		resultFrame.origin.y = constraint->top+viewBounds.origin.y;
		if(constraint->hasBottomConstraint){
			resultFrame.size.height = viewBounds.size.height-(constraint->top+constraint->bottom);
			resultMask |= UIViewAutoresizingFlexibleHeight;
		} else if(constraint->hasHeightConstraint){
			resultFrame.size.height = constraint->height;
			resultMask |= UIViewAutoresizingFlexibleBottomMargin;
		} else {
			resultFrame.size.height = viewBounds.size.height-constraint->top;
			resultMask |= UIViewAutoresizingFlexibleHeight;
		}
		
	} else if(constraint->hasBottomConstraint){
		if(constraint->hasHeightConstraint){
			resultFrame.size.height = constraint->height;
			resultFrame.origin.y = viewBounds.size.height+viewBounds.origin.y - (constraint->bottom+constraint->height);
			resultMask |= UIViewAutoresizingFlexibleTopMargin;
		} else {
			resultFrame.origin.y = viewBounds.origin.y;
			resultFrame.size.height = viewBounds.size.height - constraint->bottom;
			resultMask |= UIViewAutoresizingFlexibleHeight;
		}
		
	} else if(constraint->hasHeightConstraint){
		resultFrame.size.height = constraint->height;
		resultFrame.origin.y = viewBounds.origin.y+(viewBounds.size.height-constraint->height)/2;
		resultMask |= UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleBottomMargin;
		
	} else{
		resultFrame.origin.y=viewBounds.origin.y;
		resultFrame.size.height = viewBounds.size.height;
		resultMask |= UIViewAutoresizingFlexibleHeight;
		
	}	
	
	if(resultResizing != nil)*resultResizing = resultMask;
		return resultFrame;
}

void ApplyConstraintToViewWithinViewWithBounds(LayoutConstraint * constraint,UIView * subView,UIView * superView,CGRect viewBounds)
{
	UIViewAutoresizing resultMask;
	CGRect resultFrame;
	
	resultFrame = ApplyConstraintToRectWithResizing(constraint,viewBounds,&resultMask);
	
	id layer = [subView layer];
	if ([layer respondsToSelector:@selector(setZPosition:)])
	{
		[layer setZPosition:(constraint->hasZConstraint)?constraint->z:0];
	}
	[subView setAutoresizingMask:resultMask];
	[subView setFrame:resultFrame];
	if([subView superview]!=superView)[superView addSubview:subView];
}

#define READ_CONSTRAINT(key,boolVar,floatVar)	\
inputVal = [inputDict objectForKey:key];	\
constraint->boolVar = [inputVal respondsToSelector:floatValue];	\
if(constraint->boolVar)constraint->floatVar = [inputVal floatValue]; \
else if((inputVal == nil) && (inheritance!=NULL)){	\
	constraint->boolVar=inheritance->boolVar; \
	constraint->floatVar=inheritance->floatVar; \
}

void ReadConstraintFromDictionary(LayoutConstraint * constraint, NSDictionary * inputDict, LayoutConstraint * inheritance)
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


