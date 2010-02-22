/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"
#import "TiUIView.h"

//For TableRows, we need to have minimumParentHeightForWidth:
@interface TiViewProxy : TiProxy<LayoutAutosizing> 
{
@private
	NSRecursiveLock *childLock;
	NSMutableArray *children;
	TiUIView *view;
	TiViewProxy *parent;
	BOOL viewInitialized;
}

@property(nonatomic,readonly) NSArray *children;
@property(nonatomic,readonly) TiViewProxy *parent;
@property(nonatomic,readonly) TiPoint *center;

#pragma mark Public
-(void)add:(id)arg;
-(void)remove:(id)arg;
-(void)show:(id)arg;
-(void)hide:(id)arg;
-(void)animate:(id)arg;

#pragma mark Framework
-(TiUIView*)view;
-(BOOL)viewAttached;
-(BOOL)viewInitialized;
-(void)layoutChildren:(CGRect)bounds;
-(void)layoutChild:(TiViewProxy*)child bounds:(CGRect)bounds;
-(void)animationCompleted:(TiAnimation*)animation;
-(void)detachView;
-(void)destroy;
-(void)setParent:(TiProxy*)parent;
-(BOOL)supportsNavBarPositioning;
-(UIBarButtonItem*)barButtonItem;
-(void)removeNavBarButtonView;
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

@end
