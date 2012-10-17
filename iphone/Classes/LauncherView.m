/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */


// A good bit of this code was derived from the Three20 project
// and was customized to work inside Titanium
//
// All modifications by Appcelerator are licensed under 
// the Apache License, Version 2.0
//
//
// Copyright 2009 Facebook
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
#ifdef USE_TI_UIDASHBOARDVIEW


#ifndef TI_INVALIDATE_TIMER
#define TI_INVALIDATE_TIMER(__TIMER) { [__TIMER invalidate]; __TIMER = nil; }
#endif

#import "LauncherView.h"
#import "LauncherItem.h"
#import "LauncherButton.h"

static const CGFloat kLauncherViewMargin = 0;
static const CGFloat kLauncherViewPadding = 0;
static const CGFloat kLauncherViewPagerHeight = 20;
static const CGFloat kLauncherViewWobbleRadians = 1.5;
static const CGFloat kLauncherViewSpringLoadFraction = 0.18;
static const NSTimeInterval kLauncherViewEditHoldTimeInterval = 1;
static const NSTimeInterval kLauncherViewSpringLoadTimeInterval = 0.5;
static const NSTimeInterval kLauncherViewWobbleTime = 0.07;
static const NSInteger kLauncherViewDefaultColumnCount = 3;
static const NSTimeInterval kLauncherViewTransitionDuration = 0.3;
static const NSTimeInterval kLauncherViewFastTransitionDuration = 0.2;


@interface LauncherScrollView : UIScrollView
@end

@implementation LauncherScrollView

- (BOOL)touchesShouldCancelInContentView:(UIView *)view {
	return !self.delaysContentTouches;
}

@end

@implementation LauncherView

@synthesize columnCount, rowCount, delegate, editable;

- (id)initWithFrame:(CGRect)frame withRowCount:(int)newRowCount withColumnCount:(int)newColumnCount
{
    if ((self = [super initWithFrame:frame])) 
	{
        self.rowCount = newRowCount;
        self.columnCount = newColumnCount;
		self.currentPageIndex = 0;
        self.editable = YES;
        
        renderingButtons = NO;
		
		scrollView = [[LauncherScrollView alloc] initWithFrame:CGRectMake(0, 0, frame.size.width, frame.size.height - kLauncherViewPagerHeight - 30)];
		scrollView.delegate = self;
		scrollView.scrollsToTop = NO;
		scrollView.showsVerticalScrollIndicator = NO;
		scrollView.showsHorizontalScrollIndicator = NO;
		scrollView.alwaysBounceHorizontal = YES;
		scrollView.pagingEnabled = YES;
		scrollView.autoresizingMask = UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight;
		scrollView.delaysContentTouches = NO;
		scrollView.multipleTouchEnabled = NO;
		[self addSubview:scrollView];
		
		pager = [[UIPageControl alloc] init];
		pager.autoresizingMask = UIViewAutoresizingFlexibleLeftMargin|UIViewAutoresizingFlexibleRightMargin|UIViewAutoresizingFlexibleBottomMargin;
		[pager addTarget:self action:@selector(pageChanged) forControlEvents:UIControlEventValueChanged];
		[self addSubview:pager];
	}
    return self;
}

- (void)dealloc 
{
	delegate = nil;
	if (editing)
	{
		[self endEditing];
	}
	[pager release];
	[buttons release];
	[scrollView release];
	[pages release];
    [super dealloc];
}

-(LauncherButton*)addButtonWithItem:(LauncherItem*)item
{
    LauncherButton *button = [[LauncherButton alloc] initWithFrame:CGRectZero];
    [button addTarget:self action:@selector(buttonTouchedUpInside:) forControlEvents:UIControlEventTouchUpInside];
    [button addTarget:self action:@selector(buttonTouchedUpOutside:) forControlEvents:UIControlEventTouchUpOutside];
    [button addTarget:self action:@selector(buttonTouchedDown:withEvent:) forControlEvents:UIControlEventTouchDown];
    [scrollView addSubview:button];
    button.item = item;
    return [button autorelease];
}

-(NSInteger)rowHeight
{
	return MAX(33,(scrollView.frame.size.height / rowCount));
}

- (NSMutableArray*)pageWithFreeSpace:(NSInteger)pageIndex 
{
	for (NSInteger i = self.currentPageIndex; i < pages.count; ++i) 
	{
		NSMutableArray* page = [pages objectAtIndex:i];
		if (page.count < self.columnCount*self.rowCount) 
		{
			return page;
		}
	}
	
	NSMutableArray* page = [NSMutableArray array];
	[pages addObject:page];
	return page;
}

- (NSInteger)currentPageIndex 
{
	return floor(scrollView.contentOffset.x/scrollView.frame.size.width);
}

- (NSMutableArray*)pageWithItem:(LauncherItem*)item 
{
	for (NSMutableArray* page in pages) 
	{
		NSUInteger itemIndex = [page indexOfObject:item];
		if (itemIndex != NSNotFound) 
		{
			return page;
		}
	}
	return nil;
}

- (NSIndexPath*)indexPathOfItem:(LauncherItem*)item 
{
	for (NSUInteger pageIndex = 0; pageIndex < pages.count; ++pageIndex) 
	{
		NSArray* page = [pages objectAtIndex:pageIndex];
		NSUInteger itemIndex = [page indexOfObject:item];
		if (itemIndex != NSNotFound) 
		{
			NSUInteger path[] = {pageIndex, itemIndex};
			return [NSIndexPath indexPathWithIndexes:path length:2];
		}
	}
	return nil;
}

- (NSMutableArray*)pageWithButton:(LauncherButton*)button 
{
	NSIndexPath* path = [self indexPathOfItem:button.item];
	if (path) 
	{
		NSInteger pageIndex = [path indexAtPosition:0];
		return [buttons objectAtIndex:pageIndex];
	} 
	return nil;
}

- (void)setCurrentPageIndex:(NSInteger)pageIndex 
{
	scrollView.contentOffset = CGPointMake(scrollView.frame.size.width*pageIndex, 0);
}

- (void)updateContentSize:(NSInteger)numberOfPages 
{
	scrollView.contentSize = CGSizeMake(numberOfPages*scrollView.frame.size.width, scrollView.frame.size.height);
	if (numberOfPages != pager.numberOfPages) 
	{
		pager.numberOfPages = numberOfPages;
		[pager setCurrentPage:numberOfPages-1];
	}
}
- (void)layoutButtons 
{
	[self layoutIfNeeded];
	
	 CGFloat buttonWidth = ceil((self.frame.size.width - (kLauncherViewMargin*2 + kLauncherViewPadding*(self.columnCount-1))) / self.columnCount);
	 CGFloat buttonHeight = [self rowHeight];
	 CGFloat pageWidth = scrollView.frame.size.width;
	 
	 CGFloat x = kLauncherViewMargin, minX = 0;
	 for (NSMutableArray* buttonPage in buttons) 
	 {
		 CGFloat y = kLauncherViewMargin;
		 for (LauncherButton* button in buttonPage) 
		 {
			 CGRect frame = CGRectMake(x, y, buttonWidth, buttonHeight);
			 if (!button.dragging) 
			 {
				 button.transform = CGAffineTransformIdentity;
				 button.frame = button == dragButton ? [scrollView convertRect:frame toView:self] : frame;
			 }
			 x += buttonWidth + kLauncherViewPadding;
			 if (x >= minX+pageWidth) 
			 {
				 y += buttonHeight + kLauncherViewPadding;
				 x = minX+kLauncherViewMargin;
			 }
		 }
	 
		 minX += pageWidth;
		 x = minX;
	 }
	 
	NSInteger numberOfPages = pages.count;
	[self updateContentSize:numberOfPages];
}

- (void)recreateButtons 
{
    if (![NSThread isMainThread]) {
        dispatch_async(dispatch_get_main_queue(), ^{
            [self recreateButtons];
        });
        return;
    }
    
    renderingButtons = YES;
	[self layoutIfNeeded];
	
	NSInteger curIndex = self.currentPageIndex;
	
	for (UIView *view in [scrollView subviews])
	{
		[view removeFromSuperview];
	}
	
	[buttons release];
	buttons = [[NSMutableArray alloc] init];
	
	for (NSArray* page in pages) 
	{
		NSMutableArray* buttonPage = [NSMutableArray array];
		[buttons addObject:buttonPage];
		for (LauncherItem* item in page) 
		{
			LauncherButton* button = [self addButtonWithItem:item];
			[buttonPage addObject:button];
		}
	}
    renderingButtons = NO;
    
	[self layoutButtons];
	
	[pager setCurrentPage:curIndex];
}

- (void)scrollToItem:(LauncherItem*)item animated:(BOOL)animated 
{
	NSIndexPath* path = [self indexPathOfItem:item];
	if (path!=nil) 
	{
		NSUInteger page = [path indexAtPosition:0];
		CGFloat x = page * scrollView.frame.size.width;
		[scrollView setContentOffset:CGPointMake(x, 0) animated:animated];
	}
}

- (void)addItem:(LauncherItem*)item animated:(BOOL)animated 
{
	if (pages==nil) 
	{
		pages = [[NSMutableArray arrayWithObject:[NSMutableArray arrayWithObject:item]] retain];
	} 
	else 
	{
		NSMutableArray* page = [self pageWithFreeSpace:self.currentPageIndex];
		[page addObject:item];
	}
	
	if ([delegate respondsToSelector:@selector(launcherView:didAddItem:)]) 
	{
		[delegate launcherView:self didAddItem:item];
	}
	
	if (buttons) 
	{
		[self recreateButtons];
	}
	
}


- (void)layoutSubviews 
{
	[super layoutSubviews];
	
	pager.frame = CGRectMake(0, scrollView.frame.size.height, self.frame.size.width, kLauncherViewPagerHeight);
	
	if (buttons==nil && !renderingButtons) 
	{
		[self recreateButtons];
	}
}

- (void)startDraggingButton:(LauncherButton*)button withEvent:(UIEvent*)event 
{
	TI_INVALIDATE_TIMER(springLoadTimer);
	
	if (button) 
	{
		if ([delegate respondsToSelector:@selector(launcherView:willDragItem:)]) {
			[delegate launcherView:self willDragItem:button.item];
		}
		
		button.transform = CGAffineTransformIdentity;
		[self addSubview:button];
		
		CGPoint point = [scrollView convertPoint:button.frame.origin toView:self];
		button.frame = CGRectMake(point.x, point.y, button.frame.size.width, button.frame.size.height);
		[button layoutIfNeeded];
	}
	
	[UIView beginAnimations:nil context:nil];
	[UIView setAnimationDuration:kLauncherViewFastTransitionDuration];
	
	if (dragButton) 
	{
		[dragButton setSelected:NO];
		[dragButton setHighlighted:NO];
		dragButton.dragging = NO;
		[self layoutButtons];
	}
	
	if (button) 
	{
		dragButton = button;
		
		NSIndexPath* indexPath = [self indexPathOfItem:button.item];
		positionOrigin = [indexPath indexAtPosition:1];
		
		UITouch* touch = [[event allTouches] anyObject];
		touchOrigin = [touch locationInView:scrollView];
		dragOrigin = button.center;
		dragTouch = touch;
		
		button.dragging = YES;
		
		scrollView.scrollEnabled = NO;
	} 
	else 
	{
		[UIView setAnimationDelegate:self];
		[UIView setAnimationDidStopSelector:@selector(releaseButtonDidStop)];
		scrollView.scrollEnabled = YES;
	}
	
	[UIView commitAnimations];
}

- (void)releaseButtonDidStop 
{
	[scrollView addSubview:dragButton];
	CGPoint point = [self convertPoint:dragButton.frame.origin toView:scrollView];
	dragButton.frame = CGRectMake(point.x, point.y, dragButton.frame.size.width, dragButton.frame.size.height);
	dragButton = nil;
}

- (void)deselectButton:(LauncherButton*)button 
{
	[button setSelected:NO];
}

- (void)buttonTouchedUpInside:(LauncherButton*)button 
{
	if (editing) 
	{
		if (button == dragButton) 
		{
			[self startDraggingButton:nil withEvent:nil];
		}
	} 
	else 
	{
		TI_INVALIDATE_TIMER(editHoldTimer);
		[button setSelected:YES];
		[self performSelector:@selector(deselectButton:) withObject:button afterDelay:kLauncherViewTransitionDuration];
		
		if ([delegate respondsToSelector:@selector(launcherView:didSelectItem:)]) 
		{
			[delegate launcherView:self didSelectItem:button.item];
		}
	}
}

- (void)buttonTouchedUpOutside:(LauncherButton*)button 
{
	if (editing) 
	{
		if (button == dragButton) 
		{
			[self startDraggingButton:nil withEvent:nil];
		}
	} 
	else 
	{
		TI_INVALIDATE_TIMER(editHoldTimer);
	}
}

- (void)wobble 
{
	static BOOL wobblesLeft = NO;
	
	if (editing) 
	{
		CGFloat rotation = (kLauncherViewWobbleRadians * M_PI) / 180.0;
		CGAffineTransform wobbleLeft = CGAffineTransformMakeRotation(rotation);
		CGAffineTransform wobbleRight = CGAffineTransformMakeRotation(-rotation);
		
		[UIView beginAnimations:nil context:nil];
		
		NSInteger i = 0;
		NSInteger nWobblyButtons = 0;
		for (NSArray* buttonPage in buttons) 
		{
			for (LauncherButton* button in buttonPage) 
			{
				if (button != dragButton) 
				{
					++nWobblyButtons;
					if (i % 2) 
					{
						button.transform = wobblesLeft ? wobbleRight : wobbleLeft;
					} 
					else 
					{
						button.transform = wobblesLeft ? wobbleLeft : wobbleRight;
					}
				}
				++i;
			}
		}
		
		if (nWobblyButtons >= 1) 
		{
			[UIView setAnimationDuration:kLauncherViewWobbleTime];
			[UIView setAnimationDelegate:self];
			[UIView setAnimationDidStopSelector:@selector(wobble)];
			wobblesLeft = !wobblesLeft;
		} 
		else 
		{
			[NSObject cancelPreviousPerformRequestsWithTarget:self];
			[self performSelector:@selector(wobble) withObject:nil afterDelay:kLauncherViewWobbleTime];
		}
		
		[UIView commitAnimations];
	}
}

- (void)endEditingAnimationDidStop:(NSString*)animationID finished:(NSNumber*)finished
						   context:(void*)context 
{
	for (NSArray* buttonPage in buttons) 
	{
		for (LauncherButton* button in buttonPage) 
		{
			button.editing = NO;
		}
	}
}

- (LauncherButton*)buttonForItem:(LauncherItem*)item 
{
	NSIndexPath* path = [self indexPathOfItem:item];
	if (path) 
	{
		NSInteger pageIndex = [path indexAtPosition:0];
		NSArray* buttonPage = [buttons objectAtIndex:pageIndex];
		
		NSInteger itemIndex = [path indexAtPosition:1];
		return [buttonPage objectAtIndex:itemIndex];
	} 
	return nil;
}
	
- (void)removeItem:(LauncherItem*)item animated:(BOOL)animated 
{
	NSMutableArray* itemPage = [self pageWithItem:item];
	if (itemPage) 
	{
		LauncherButton* button = [self buttonForItem:item];
		NSMutableArray* buttonPage = [self pageWithButton:button];
		
		[itemPage removeObject:button.item];
		
		if (buttonPage) 
		{
			[buttonPage removeObject:button];
			
			if (animated) 
			{
				[UIView beginAnimations:nil context:button];
				[UIView setAnimationDuration:kLauncherViewFastTransitionDuration];
				[UIView setAnimationDelegate:self];
				[UIView setAnimationDidStopSelector:@selector(removeButtonAnimationDidStop:finished:context:)];
				[self layoutButtons];
				button.transform = CGAffineTransformMakeScale(0.01, 0.01);
				button.alpha = 0;
				[UIView commitAnimations];
			} 
			else 
			{
				[button removeFromSuperview];
				[self layoutButtons];
			}
		}
		
		if ([delegate respondsToSelector:@selector(launcherView:didRemoveItem:)]) 
		{
			[delegate launcherView:self didRemoveItem:item];
		}
	}
}

- (void)closeButtonTouchedUpInside:(LauncherButton*)closeButton
{
	for (NSArray* buttonPage in buttons) 
	{
		for (LauncherButton* button in buttonPage) 
		{
			if (button.closeButton == closeButton) 
			{
				[self removeItem:button.item animated:YES];
				return;
			}
		}
	}
}

- (NSArray*)items
{
	NSMutableArray *items = [NSMutableArray array];
	for (NSArray* buttonPage in buttons) 
	{
		for (LauncherButton* button in buttonPage) 
		{
			[items addObject:button.item.userData];
		}
	}
	return items;
}

- (LauncherItem*)itemForIndex:(NSInteger)index
{
	NSInteger c = 0;
	
	for (NSArray* buttonPage in buttons) 
	{
		for (LauncherButton* button in buttonPage) 
		{
			if (c == index)
			{
				return button.item;
			}
			c++;
		}
	}
	return nil;
}

- (void)beginEditing 
{
	editing = YES;
	scrollView.delaysContentTouches = YES;
	
	for (NSArray* buttonPage in buttons) 
	{
		for (LauncherButton* button in buttonPage) 
		{
			button.editing = YES;
			[button.closeButton addTarget:self action:@selector(closeButtonTouchedUpInside:) forControlEvents:UIControlEventTouchUpInside];
		}
	}
    
	// Add a page at the end
	[pages addObject:[NSMutableArray array]];
	[buttons addObject:[NSMutableArray array]];
	[self updateContentSize:pages.count];
	
	BOOL shouldWobble = YES;
	
	if ([delegate respondsToSelector:@selector(launcherViewShouldWobble:)])
	{
		shouldWobble = [delegate launcherViewShouldWobble:self];
	}
	
	if (shouldWobble)
	{
		[self wobble];
	}
	
	if ([delegate respondsToSelector:@selector(launcherViewDidBeginEditing:)]) 
	{
		[delegate launcherViewDidBeginEditing:self];
	}
}

- (void)endEditing 
{
	editing = NO;
	scrollView.delaysContentTouches = NO;
	
	[UIView beginAnimations:nil context:nil];
	[UIView setAnimationDuration:kLauncherViewTransitionDuration];
	[UIView setAnimationDelegate:self];
	[UIView setAnimationDidStopSelector:@selector(endEditingAnimationDidStop:finished:context:)];
	
	for (NSArray* buttonPage in buttons) 
	{
		for (LauncherButton* button in buttonPage) 
		{
			button.transform = CGAffineTransformIdentity;
			button.closeButton.alpha = 0;
		}
	}
	
	[UIView commitAnimations];
	
	NSInteger curIndex = self.currentPageIndex;
	
	for (NSInteger i = 0; i < pages.count; ++i) 
	{
		NSArray* page = [pages objectAtIndex:i];
		if (!page.count) 
		{
			[pages removeObjectAtIndex:i];
			[buttons removeObjectAtIndex:i];
			--i;
		}
	}
	
	[self layoutButtons];
	
	[pager setCurrentPage:curIndex];
	
	if ([delegate respondsToSelector:@selector(launcherViewDidEndEditing:)]) 
	{
		[delegate launcherViewDidEndEditing:self];
	}
}


- (void)editHoldTimer:(NSTimer*)timer
{
    editHoldTimer = nil;

	NSArray *data = timer.userInfo;
	LauncherButton *button = [data objectAtIndex:0];
	UIEvent *event = [data objectAtIndex:1];
    if ( button.item.userData == nil) {
        return;
    }
	
	[self beginEditing];
	
    [button setSelected:NO];
    [button setHighlighted:NO];
    [self startDraggingButton:button withEvent:event];
}


- (void)buttonTouchedDown:(LauncherButton*)button withEvent:(UIEvent*)event 
{
	if (editing) 
	{
		if (!dragButton) 
		{
			[self startDraggingButton:button withEvent:event];
		}
	} 
	else 
	{
		TI_INVALIDATE_TIMER(editHoldTimer);
        if (editable) {
            editHoldTimer = [NSTimer scheduledTimerWithTimeInterval:kLauncherViewEditHoldTimeInterval
                                                             target:self selector:@selector(editHoldTimer:)
                                                           userInfo:[NSArray arrayWithObjects:button,event,nil]
                                                            repeats:NO];
        }
	}
}

- (void)checkButtonOverflow:(NSInteger)pageIndex 
{
	NSMutableArray* buttonPage = [buttons objectAtIndex:pageIndex];
	NSInteger maxButtonsPerPage = self.columnCount*self.rowCount;
	if (buttonPage.count > maxButtonsPerPage) 
	{
		BOOL isLastPage = pageIndex == [buttons count]-1;
		
		NSMutableArray* itemsPage = [pages objectAtIndex:pageIndex];
        
		NSMutableArray* nextButtonPage = nil;
		NSMutableArray* nextItemsPage = nil;
		if (isLastPage) 
		{
			nextButtonPage = [NSMutableArray array];
			[buttons addObject:nextButtonPage];
			nextItemsPage = [NSMutableArray array];
			[pages addObject:nextItemsPage];
		} 
		else 
		{
			nextButtonPage = [buttons objectAtIndex:pageIndex+1];
			nextItemsPage = [pages objectAtIndex:pageIndex+1];
		}
		
		while (buttonPage.count > maxButtonsPerPage) 
		{
			[nextButtonPage insertObject:[buttonPage lastObject] atIndex:0];
			[buttonPage removeLastObject];
			[nextItemsPage insertObject:[itemsPage lastObject] atIndex:0];
			[itemsPage removeLastObject];
		}
		
		if (pageIndex+1 < [buttons count]) 
		{
			[self checkButtonOverflow:pageIndex+1];
		}
	}
}

- (void)updatePagerWithContentOffset:(CGPoint)contentOffset 
{
	CGFloat pageWidth = scrollView.frame.size.width;
	pager.currentPage = floor((contentOffset.x - pageWidth / 2) / pageWidth) + 1;
}

- (void)springLoadTimer:(NSTimer*)timer 
{
	springLoadTimer = nil;
	
	if ([(NSNumber*)timer.userInfo boolValue]) 
	{
		CGFloat newX = scrollView.contentOffset.x - scrollView.frame.size.width;
		if (newX >= 0) 
		{
			CGPoint offset = CGPointMake(newX, 0);
			[scrollView setContentOffset:offset animated:YES];
			[self updatePagerWithContentOffset:offset];
			dragOrigin.x += scrollView.frame.size.width;
			positionOrigin = -1;
			springing = YES;
			[self performSelector:@selector(springingDidStop) withObject:nil afterDelay:0.3];
		}
	}
	else 
	{
		CGFloat newX = scrollView.contentOffset.x + scrollView.frame.size.width;
		if (newX <= scrollView.contentSize.width - scrollView.frame.size.width) 
		{
			CGPoint offset = CGPointMake(newX, 0);
			[scrollView setContentOffset:offset animated:YES];
			[self updatePagerWithContentOffset:offset];
			dragOrigin.x -= scrollView.frame.size.width;
			positionOrigin = -1;
			springing = YES;
			[self performSelector:@selector(springingDidStop) withObject:nil afterDelay:0.3];
		}
	}
}

- (void)springingDidStop 
{
	springing = NO;
}

- (void)updateTouch 
{
	CGPoint origin = [dragTouch locationInView:scrollView];
	dragButton.center = CGPointMake(dragOrigin.x + (origin.x - touchOrigin.x),
									 dragOrigin.y + (origin.y - touchOrigin.y));
	
	CGFloat x = origin.x - scrollView.contentOffset.x;
	NSInteger column = round(x/dragButton.frame.size.width);
	NSInteger row = round(origin.y/dragButton.frame.size.height);
	NSInteger itemIndex = (row * self.columnCount) + column;
	NSInteger pageIndex = MAX(floor(scrollView.contentOffset.x/scrollView.frame.size.width),0);
	
	if (itemIndex != positionOrigin) 
	{
		NSMutableArray* currentButtonPage = [buttons objectAtIndex:pageIndex];
		if (itemIndex > currentButtonPage.count) 
		{
			itemIndex = currentButtonPage.count;
		}
		
		if (itemIndex != positionOrigin) 
		{
			[[dragButton retain] autorelease];
			
			NSMutableArray* itemPage = [self pageWithItem:dragButton.item];
			NSMutableArray* buttonPage = [self pageWithButton:dragButton];
			[itemPage removeObject:dragButton.item];
			[buttonPage removeObject:dragButton];
			
			if (itemIndex > currentButtonPage.count) 
			{
				itemIndex = currentButtonPage.count;
			}
			
			BOOL didMove = itemIndex != positionOrigin;
			
			NSMutableArray* currentItemPage = [pages objectAtIndex:pageIndex];
			[currentItemPage insertObject:dragButton.item atIndex:itemIndex];
			[currentButtonPage insertObject:dragButton atIndex:itemIndex];
			positionOrigin = itemIndex;
			
			[self checkButtonOverflow:pageIndex];
			
			if (didMove) 
			{
				if ([delegate respondsToSelector:@selector(launcherView:didMoveItem:)]) 
				{
					[delegate launcherView:self didMoveItem:dragButton.item];
				}
				
				[UIView beginAnimations:nil context:nil];
				[UIView setAnimationDuration:kLauncherViewTransitionDuration];
				[self layoutButtons];
				[UIView commitAnimations];
			}
		}
	}
	
	CGFloat springLoadDistance = dragButton.frame.size.width*kLauncherViewSpringLoadFraction;
	BOOL goToPreviousPage = dragButton.center.x - springLoadDistance < 0;
	BOOL goToNextPage = ((scrollView.frame.size.width - dragButton.center.x) - springLoadDistance) < 0;
	if (goToPreviousPage || goToNextPage) 
	{
		if (!springLoadTimer) 
		{
			springLoadTimer = [NSTimer scheduledTimerWithTimeInterval:kLauncherViewSpringLoadTimeInterval
																target:self selector:@selector(springLoadTimer:)
															  userInfo:[NSNumber numberWithBool:goToPreviousPage] repeats:NO];
		}
	} 
	else 
	{
		TI_INVALIDATE_TIMER(springLoadTimer);
	}
}

- (void)touchesMoved:(NSSet*)touches withEvent:(UIEvent *)event 
{
	[super touchesMoved:touches withEvent:event];
	if (dragButton && !springing) 
	{
		for (UITouch* touch in touches) 
		{
			if (touch == dragTouch) 
			{
				[self updateTouch];
				break;
			}
		}
	}
}

- (void)touchesEnded:(NSSet*)touches withEvent:(UIEvent *)event 
{
	[super touchesEnded:touches withEvent:event];
	
	if (dragTouch) 
	{
		for (UITouch* touch in touches) 
		{
			if (touch == dragTouch) 
			{
				dragTouch = nil;
				if ([delegate respondsToSelector:@selector(launcherView:didDragItem:)]) {
					[delegate launcherView:self didDragItem:dragButton.item];
				}
				break;
			}
		}
	}
}

- (BOOL)editing
{
	return editing;
}

- (void)pageChanged 
{
	scrollView.contentOffset = CGPointMake(pager.currentPage * scrollView.frame.size.width, 0);
}

- (void)scrollViewWillBeginDragging:(UIScrollView*)scrollView 
{
	TI_INVALIDATE_TIMER(editHoldTimer);
}

- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView_
{
	[self updatePagerWithContentOffset:scrollView.contentOffset];
}

@end

#endif