/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"
#import "TiUIView.h"
#import <pthread.h>

#define NEEDS_REPOSITION	0 
#define NEEDS_LAYOUT_CHILDREN	1

enum
{
	TiRefreshViewPosition = 2,
	TiRefreshViewChildrenPosition,
	TiRefreshViewZIndex,
	TiRefreshViewSize,

	TiRefreshViewEnqueued,
};

#define DONTSHOWHIDDEN 0 

//For TableRows, we need to have minimumParentHeightForWidth:
@interface TiViewProxy : TiProxy<LayoutAutosizing> 
{
@protected
	NSRecursiveLock *destroyLock;
	CGFloat verticalLayoutBoundary;
	CGFloat horizontalLayoutBoundary;
	CGFloat horizontalLayoutRowHeight;	//Note, this has nothing to do with table views.

	LayoutConstraint layoutProperties;

	BOOL windowOpened;
	BOOL windowOpening;

	int dirtyflags;	//For atomic actions, best to be explicit about the 32 bitness.

	BOOL isUsingBarButtonItem;
	UIBarButtonItem * barButtonItem;

@private
	pthread_rwlock_t childrenLock;
	NSMutableArray *children;
	TiUIView *view;
	TiViewProxy *parent;
	BOOL viewInitialized;
	NSMutableArray *pendingAdds;
	BOOL needsZIndexRepositioning;	//Todo: Replace
	int zIndex;

	BOOL repositioning;
	
	CGRect sandboxBounds;
	CGPoint positionCache;	//Recomputed and stored when position changes.
	CGRect sizeCache;	//Recomputed and stored when size changes.
	UIViewAutoresizing autoresizeCache;	//Changed by repositioning or resizing.

	BOOL parentVisible;
	//In most cases, this is the same as [parent parentVisible] && [parent visible]
	//However, in the case of windows attached to the root view, the parent is ALWAYS visible.
	//That is, will be true if and only if all parents are visible or are the root controller.
	//Use parentWillShow and parentWillHide to set this.
}

@property(nonatomic,readwrite,assign) int zIndex;

@property(nonatomic,readonly) BOOL visible;
@property(nonatomic,readwrite,assign) CGRect sandboxBounds;
	//This is unaffected by parentVisible. So if something is truely visible, it'd be [self visible] && parentVisible.

@property(nonatomic,readwrite,assign) LayoutConstraint * layoutProperties;

@property(nonatomic,readonly) NSArray *children;
@property(nonatomic,readonly) TiViewProxy *parent;
@property(nonatomic,readonly) TiPoint *center;

@property(nonatomic,retain) UIBarButtonItem * barButtonItem;

//NOTE: DO NOT SET VIEW UNLESS IN A TABLE VIEW, AND EVEN THEN.
@property(nonatomic,readwrite,retain)TiUIView * view;

#pragma mark Public
-(void)add:(id)arg;
-(void)remove:(id)arg;
-(void)show:(id)arg;
-(void)hide:(id)arg;
-(void)animate:(id)arg;

#pragma mark Framework

-(BOOL)viewAttached;
-(BOOL)viewInitialized;
-(void)layoutChildren:(BOOL)optimize;
-(void)layoutChildrenIfNeeded;
-(void)layoutChild:(TiViewProxy*)child optimize:(BOOL)optimize;
-(void)windowWillOpen;
-(void)windowDidOpen;
-(BOOL)windowHasOpened;
-(BOOL)windowIsOpening;

-(void)setWidth:(id)value;
-(void)setHeight:(id)value;

-(void)animationCompleted:(TiAnimation*)animation;
-(void)detachView;
-(BOOL)shouldDetachViewOnUnload;
-(void)destroy;
-(void)setParent:(TiProxy*)parent;

-(BOOL)supportsNavBarPositioning;
-(UIBarButtonItem*)barButtonItem;
- (TiUIView *)barButtonViewForSize:(CGSize)bounds;
-(void)removeBarButtonView;
- (BOOL) isUsingBarButtonItem;

-(CGRect)appFrame;
-(void)firePropertyChanges;
-(void)willFirePropertyChanges;
-(void)didFirePropertyChanges;
-(TiUIView*)newView;
-(BOOL)viewReady;
-(void)windowDidClose;
-(void)windowWillClose;
-(void)viewWillAttach;
-(void)viewDidAttach;
-(void)viewWillDetach;
-(void)viewDidDetach;

-(void)relayout;
-(void)insertIntoView:(UIView*)view bounds:(CGRect)bounds;
-(void)reposition;	//Todo: Replace
-(void)repositionIfNeeded;	//Todo: Replace
-(void)setNeedsReposition;	//Todo: Replace
-(void)clearNeedsReposition;	//Todo: Replace
-(void)setNeedsRepositionIfAutoSized;	//Todo: Replace
-(void)setNeedsZIndexRepositioning;	//Todo: Replace
-(BOOL)needsZIndexRepositioning;	//Todo: Replace

-(BOOL)willBeRelaying;	//Todo: Replace
-(void)childWillResize:(TiViewProxy *)child;	//Todo: Replace
-(BOOL)canHaveControllerParent;

-(void)makeViewPerformSelector:(SEL)selector withObject:(id)object createIfNeeded:(BOOL)create waitUntilDone:(BOOL)wait;

-(void)refreshView:(TiUIView *)transferView;
-(void)refreshZIndex;
-(void)refreshPosition;
-(void)refreshSize;

-(void)willChangeSize;
-(void)willChangePosition;
-(void)willChangeZIndex;
-(void)willChangeLayout;
-(void)willShow;
-(void)willHide;

-(void)contentsWillChange;

-(void)parentSizeWillChange;
-(void)parentWillRelay;
-(void)parentWillShow;
-(void)parentWillHide;

-(BOOL)suppressesRelayout;
-(void)performZIndexRepositioning;

@end


#define USE_VIEW_FOR_METHOD(resultType,methodname,inputType)	\
-(resultType) methodname: (inputType)value	\
{	\
	return [[self view] methodname:value];	\
}

#define USE_VIEW_FOR_UI_METHOD(methodname)	\
-(void)methodname:(id)args	\
{	\
	if ([self viewAttached])	\
	{	\
		[[self view] performSelectorOnMainThread:@selector(methodname:) withObject:args waitUntilDone:NO];	\
	}	\
}



#define USE_VIEW_FOR_VERIFY_WIDTH	USE_VIEW_FOR_METHOD(CGFloat,verifyWidth,CGFloat)
#define USE_VIEW_FOR_VERIFY_HEIGHT	USE_VIEW_FOR_METHOD(CGFloat,verifyHeight,CGFloat)
#define USE_VIEW_FOR_AUTO_WIDTH		USE_VIEW_FOR_METHOD(CGFloat,autoWidthForWidth,CGFloat)
#define USE_VIEW_FOR_AUTO_HEIGHT	USE_VIEW_FOR_METHOD(CGFloat,autoHeightForWidth,CGFloat)

#define DECLARE_VIEW_CLASS_FOR_NEWVIEW(viewClass)	\
-(TiUIView*)newView	\
{	\
	return [[viewClass alloc] init];	\
}

