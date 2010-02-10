/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUIView.h"

@interface TiUIScrollView : TiUIView<UIScrollViewDelegate> {

@private
	UIScrollView * scrollView;
	UIView * wrapperView;
	TiDimension contentWidth;
	TiDimension contentHeight;
	BOOL needsHandleContentSize;
}

@property(nonatomic,retain,readonly) UIScrollView * scrollView;

-(void)layoutChild:(TiUIView *)childView;
-(void)setNeedsHandleContentSize;

@end
