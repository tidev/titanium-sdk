/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UISCROLLVIEW

#import "TiUIView.h"

@interface TiUIScrollViewImpl : UIScrollView {
@private
    TiUIView * touchHandler;
    UIView * touchedContentView;
    //TIMOB-12988 Additions
    BOOL delay;
    BOOL ignore;
    BOOL offsetAnimated;
    CGPoint offsetPoint;
}
-(void)setTouchHandler:(TiUIView*)handler;
@end

@interface TiUIScrollView : TiUIView<TiScrolling,UIScrollViewDelegate> {

@private
	TiUIScrollViewImpl * scrollView;
	UIView * wrapperView;
	TiDimension contentWidth;
	TiDimension contentHeight;
	
	CGFloat minimumContentHeight;
	
	BOOL needsHandleContentSize;
	
	id	lastFocusedView; //DOES NOT RETAIN.
}

@property(nonatomic,retain,readonly) TiUIScrollViewImpl * scrollView;

@property(nonatomic,readonly) TiDimension contentWidth;

-(void)setNeedsHandleContentSize;
-(void)setNeedsHandleContentSizeIfAutosizing;
-(BOOL)handleContentSizeIfNeeded;
-(void)handleContentSize;
-(void)setContentOffset_:(id)value withObject:(id)property;
-(void)setZoomScale_:(id)value withObject:(id)property;
-(UIView *)wrapperView;
-(void)scrollToBottom;

@end

#endif