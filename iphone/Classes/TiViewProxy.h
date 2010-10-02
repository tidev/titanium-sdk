/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"
#import "TiUIView.h"
#import <pthread.h>


#pragma mark dirtyflags used by TiViewProxy
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

@class TiAction, TiBlob;
//For TableRows, we need to have minimumParentHeightForWidth:
@interface TiViewProxy : TiProxy<LayoutAutosizing> 
{
@protected
//TODO: Actually have a rhyme and reason on keeping things @protected vs @private.
//For now, for sake of proper value grouping, we're all under one roof.

#pragma mark Layout properties
	LayoutConstraint layoutProperties;
	int zIndex;
	BOOL hidden;	//This is the boolean version of ![TiUtils boolValue:visible def:yes]
		//And has nothing to do with whether or not it's onscreen or 

#pragma mark Parent/Children relationships
	TiViewProxy *parent;
	pthread_rwlock_t childrenLock;
	NSMutableArray *children;
	NSMutableArray *pendingAdds;

#pragma mark Visual components
	TiUIView *view;
	UIBarButtonItem * barButtonItem;

#pragma mark Layout caches that can be recomputed
	CGFloat verticalLayoutBoundary;
	CGFloat horizontalLayoutBoundary;
	CGFloat horizontalLayoutRowHeight;	//Note, this has nothing to do with table views.

	CGRect sandboxBounds;
	CGPoint positionCache;	//Recomputed and stored when position changes.
	CGRect sizeCache;	//Recomputed and stored when size changes.
	UIViewAutoresizing autoresizeCache;	//Changed by repositioning or resizing.

	BOOL parentVisible;
	//In most cases, this is the same as [parent parentVisible] && ![parent hidden]
	//However, in the case of windows attached to the root view, the parent is ALWAYS visible.
	//That is, will be true if and only if all parents are visible or are the root controller.
	//Use parentWillShow and parentWillHide to set this.

#pragma mark Housecleaning that is set and used
	NSRecursiveLock *destroyLock;

	BOOL windowOpened;
	BOOL windowOpening;

	int dirtyflags;	//For atomic actions, best to be explicit about the 32 bitness.
	BOOL viewInitialized;
	BOOL repositioning;
	BOOL isUsingBarButtonItem;
}

#pragma mark public API
@property(nonatomic,readwrite,assign) int zIndex;
@property(nonatomic,readonly) NSArray *children;
@property(nonatomic,readonly) TiPoint *center;

-(void)add:(id)arg;
-(void)remove:(id)arg;
-(void)show:(id)arg;
-(void)hide:(id)arg;
-(void)animate:(id)arg;

-(void)setTop:(id)value;
-(void)setBottom:(id)value;
-(void)setLeft:(id)value;
-(void)setRight:(id)value;
-(void)setWidth:(id)value;
-(void)setHeight:(id)value;
-(void)setLayout:(id)value;
-(void)setMinWidth:(id)value;
-(void)setMinHeight:(id)value;

-(void)setSize:(id)value;
-(void)setCenter:(id)value;
-(id)animatedCenter;

-(void)setBackgroundGradient:(id)arg;
-(TiBlob*)toImage:(id)args;


#pragma mark nonpublic accessors not related to Housecleaning
@property(nonatomic,readonly) TiViewProxy *parent;
//TODO: make this a proper readwrite property declaration.
-(void)setParent:(TiProxy*)parent;

@property(nonatomic,readonly,assign) LayoutConstraint * layoutProperties;
@property(nonatomic,readwrite,assign) CGRect sandboxBounds;
	//This is unaffected by parentVisible. So if something is truely visible, it'd be [self visible] && parentVisible.
-(void)setHidden:(BOOL)newHidden withArgs:(id)args;

@property(nonatomic,retain) UIBarButtonItem * barButtonItem;
-(TiUIView *)barButtonViewForSize:(CGSize)bounds;

//NOTE: DO NOT SET VIEW UNLESS IN A TABLE VIEW, AND EVEN THEN.
@property(nonatomic,readwrite,retain)TiUIView * view;

#pragma mark Methods subclasses should override for behavior changes
-(BOOL)suppressesRelayout;
-(BOOL)supportsNavBarPositioning;
-(BOOL)canHaveControllerParent;
-(BOOL)shouldDetachViewOnUnload;
-(UIView *)parentViewForChild:(TiViewProxy *)child;

#pragma mark Event trigger methods
-(void)windowWillOpen;
-(void)windowDidOpen;
-(void)windowWillClose;
-(void)windowDidClose;

-(void)willFirePropertyChanges;
-(void)didFirePropertyChanges;

-(void)viewWillAttach;
-(void)viewDidAttach;
-(void)viewWillDetach;
-(void)viewDidDetach;

#pragma mark Housecleaning state accessors
//TODO: Sounds like the redundancy department of redundancy was here.
-(BOOL)viewAttached;
-(BOOL)viewInitialized;
-(BOOL)viewReady;
-(BOOL)windowHasOpened;
-(BOOL)windowIsOpening;

-(BOOL)isUsingBarButtonItem;

-(CGRect)appFrame;	//TODO: Why is this here? It doesn't have anything to do with a specific instance.

#pragma mark Building up and tearing down
-(void)firePropertyChanges;
-(TiUIView*)newView;

-(void)detachView;
-(void)destroy;
-(void)removeBarButtonView;

#pragma mark Callbacks

-(void)getAnimatedCenterPoint:(NSMutableDictionary *)resultDict;
-(void)addImageToBlob:(NSArray*)args;

-(void)animationCompleted:(TiAnimation*)animation;
-(void)makeViewPerformAction:(TiAction *)action;
-(void)makeViewPerformSelector:(SEL)selector withObject:(id)object createIfNeeded:(BOOL)create waitUntilDone:(BOOL)wait;

#pragma mark Layout events, internal and external

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

#pragma mark Layout actions

-(void)refreshView:(TiUIView *)transferView;

-(void)refreshSize;
-(void)refreshPosition;

//Unlike the other layout actions, this one is done by the parent of the one called by refreshView.
//This is the effect of refreshing the Z index via careful view placement.
-(void)insertSubview:(UIView *)childView forProxy:(TiViewProxy *)childProxy;


#pragma mark Layout commands that need refactoring out

-(void)layoutChildren:(BOOL)optimize;
-(void)layoutChildrenIfNeeded;
-(void)layoutChild:(TiViewProxy*)child optimize:(BOOL)optimize;

-(void)relayout;
-(void)insertIntoView:(UIView*)view bounds:(CGRect)bounds;
-(void)reposition;	//Todo: Replace
-(void)repositionIfNeeded;	//Todo: Replace
-(void)setNeedsReposition;	//Todo: Replace
-(void)clearNeedsReposition;	//Todo: Replace
-(void)setNeedsRepositionIfAutoSized;	//Todo: Replace

-(BOOL)willBeRelaying;	//Todo: Replace
-(void)childWillResize:(TiViewProxy *)child;	//Todo: Replace

-(void)childAdded:(id)child;
-(void)childRemoved:(id)child;
-(void)layoutChildOnMainThread:(id)arg;

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

