/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiProxy.h"
#import "TiViewContainer.h"
#import "LayoutConstraint.h"
#import "TiColor.h"
#import "TiPoint.h"
#import "TiAction.h"
#import "KrollCallback.h"
#import "TiAnimation.h"
#import "TiViewContainer.h"
#import "TitaniumApp.h"

//
// this macro will ensure that the action being performed
// happens after any pending animation that is taking place
// and also ensure that the action is on the main UI thread
// when it does actually occur
//
#define UI_ENSURE_AFTER_ANIMATION(method,args) \
@synchronized(self)\
{\
if (animating)\
{\
TiAction *action = [[[TiAction alloc] initWithTarget:self selector:@selector(method:) arg:args] autorelease];\
if (animationQueue==nil) { animationQueue = [[NSMutableArray alloc] init]; } \
[animationQueue addObject:action]; \
return;\
}\
}\
ENSURE_UI_THREAD(method,args);\



@protocol TiController;

@interface TiView : TiProxy<TiViewContainerDelegate>
{
@protected
	LayoutConstraint layout;
	UIViewController *controller;
	TiColor *bgColor;
	TiView *window;
	int zIndex;
	NSMutableArray *animationQueue;
	BOOL	animating;

@private
	UIView *view;
	TiView *parent;
	NSMutableArray *proxies;
	TiAnimation *animation;

	TiColor *brdColor;
	id transform;
	
	BOOL	needsRepositioning;
	BOOL	needsUpdating;
}

#pragma mark Public

@property(nonatomic,readwrite,retain) NSNumber *zIndex;

@property(nonatomic,readwrite,copy) NSNumber *top;
@property(nonatomic,readwrite,copy) NSNumber *bottom;
@property(nonatomic,readwrite,copy) NSNumber *left;
@property(nonatomic,readwrite,copy) NSNumber *right;
@property(nonatomic,readwrite,copy) NSNumber *width;
@property(nonatomic,readwrite,copy) NSNumber *height;

@property(nonatomic,readwrite,retain) NSNumber *opaque;
@property(nonatomic,readwrite,retain) NSNumber *opacity;
@property(nonatomic,readwrite,retain) NSString *bgColor;
@property(nonatomic,readwrite,retain) NSNumber *visible;
@property(nonatomic,readwrite,retain) NSNumber *borderWidth;
@property(nonatomic,readwrite,retain) NSString *borderColor;
@property(nonatomic,readwrite,retain) NSNumber *borderRadius;
@property(nonatomic,readwrite,retain) TiPoint  *anchorPoint;
@property(nonatomic,readwrite,retain) TiPoint  *center;
@property(nonatomic,readwrite,retain) id transform;
@property(nonatomic,readonly)		  TiView   *window;

-(void)add:(NSArray *)args;
-(void)remove:(NSArray *)args;
-(void)show:(NSArray *)args;
-(void)hide:(NSArray *)args;
-(void)animate:(NSArray *)args;


#pragma mark Private

-(UIViewController*)_controller;
-(UIView*)_view;
-(UIView*)_animateView;
-(void)_insertIntoView:(UIView *)newSuperView bounds:(CGRect)newBounds;
-(void)_childAdded:(TiView*)child;
-(void)_childRemoved:(TiView*)child;
-(LayoutConstraint*)_layoutConstraints;
-(void)_animationCompleted:(id)receiver;
-(void)_setWindow:(TiView*)window_;
-(void)_setParent:(TiView*)parent_;
-(int)_zIndex;
-(void)_handleNextItemInAnimationQueue;
-(UIWindow*)_appwindow;

// optional overrides
-(BOOL)_handlesTouches;
-(BOOL)_draggable;
-(BOOL)_customConfiguration;

// For repositioning
-(void)_setNeedsRepositioning; //Call when frame is changed.
-(void)_performReposition; //Call if you need to flush repositioning.
-(void)_doReposition; // Override in subclasses but call super.
-(void)_performZIndexRepositioning;

// Free for subclass reuse
-(void)_setNeedsUpdating;
-(void)_performUpdate;
-(void)_doUpdate;
-(void)_destroy;

// Touch delegation from TiViewContainer
-(void)singleTapAtPoint:(CGPoint)location view:(TiViewContainer*)view;
-(void)doubleTapAtPoint:(CGPoint)location view:(TiViewContainer*)view;
-(void)twoFingerTapAtPoint:(CGPoint)location view:(TiViewContainer*)view;


@end
