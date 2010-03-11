/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"
#import "TiUIView.h"

#define NEEDS_REPOSITION	0
#define NEEDS_LAYOUT_CHILDREN	1

//For TableRows, we need to have minimumParentHeightForWidth:
@interface TiViewProxy : TiProxy<LayoutAutosizing> 
{
@protected
	CGFloat verticalLayoutBoundary;
	LayoutConstraint layoutProperties;

	int dirtyflags;	//For atomic actions, best to be explicit about the 32 bitness.

@private
	NSRecursiveLock *childLock;
	NSMutableArray *children;
	TiUIView *view;
	TiViewProxy *parent;
	BOOL viewInitialized;
}

@property(nonatomic,readwrite,assign) LayoutConstraint * layoutProperties;

@property(nonatomic,readonly) NSArray *children;
@property(nonatomic,readonly) TiViewProxy *parent;
@property(nonatomic,readonly) TiPoint *center;

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
-(void)layoutChildren;
-(void)layoutChild:(TiViewProxy*)child;

-(void)animationCompleted:(TiAnimation*)animation;
-(void)detachView;
-(void)destroy;
-(void)setParent:(TiProxy*)parent;

-(BOOL)supportsNavBarPositioning;
-(UIBarButtonItem*)barButtonItem;
- (TiUIView *)barButtonViewForSize:(CGSize)bounds;
-(void)removeBarButtonView;

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
-(void)exchangeView:(TiUIView*)newview;

-(void)reposition;
-(void)repositionWithBounds:(CGRect)bounds;
-(void)repositionIfNeeded;
-(void)setNeedsReposition;
-(void)clearNeedsReposition;
-(void)setNeedsRepositionIfAutoSized;

-(BOOL)willBeRelaying;
-(void)childWillResize:(TiViewProxy *)child;

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


