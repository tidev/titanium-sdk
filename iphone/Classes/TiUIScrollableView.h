/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUIView.h"

@interface TiUIScrollableView : TiUIView<UIScrollViewDelegate> {

@private
	UIScrollView * scrollingView;
	UIPageControl * pageControl;
	NSMutableIndexSet * loadedViews;
	
	BOOL showPageControl;
	CGFloat pageControlHeight;
	
	BOOL handlingPageControlEvent;
}

-(void)scrollToPageNumber:(NSNumber *)newPageNum;
- (IBAction)pageControlTouched:(id)sender;


@end
