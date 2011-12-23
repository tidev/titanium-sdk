/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UISCROLLVIEW

#import "TiUIView.h"

@class TiScrollView;

@interface TiUIScrollView : TiUIView<TiUIScrollView,UIScrollViewDelegate> {

@private
	TiScrollView * scrollView;
	UIView * wrapperView;
	TiDimension contentWidth;
	TiDimension contentHeight;
	
	CGFloat minimumContentHeight;
	
	BOOL needsHandleContentSize;
	
	id	lastFocusedView; //DOES NOT RETAIN.
}

@property(nonatomic,retain,readonly) UIScrollView * scrollView;

-(void)setNeedsHandleContentSize;
-(void)setNeedsHandleContentSizeIfAutosizing;
-(BOOL)handleContentSizeIfNeeded;
-(void)handleContentSize;

-(UIView *)wrapperView;


@end

#endif