/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"
#import "TiPoint.h"
#import "TiColor.h"
#import "ListenerEntry.h"
#import "LayoutConstraint.h"
#import <QuartzCore/QuartzCore.h>

@class TiViewProxy;

/**
 Protocol for animation delegate.
 */
@protocol TiAnimationDelegate

@optional

/**
 Returns if the animation should transition.
 @param sender The sender of the message.
 @return _YES_ if the animation should transition, _NO_ otherwise.
 */
-(BOOL)animationShouldTransition:(id)sender;

/**
 Tells the delegate that the animation will start.
 @param sender The sender of the message.
 */
-(void)animationWillStart:(id)sender;

/**
 Tells the delegate that the animation did start.
 @param sender The sender of the message.
 */
-(void)animationDidStart:(id)sender;

/**
 Tells the delegate that the animation will complete.
 @param sender The sender of the message.
 */
-(void)animationWillComplete:(id)sender;

/**
 Tells the delegate that the animation did complete.
 @param sender The sender of the message.
 */
-(void)animationDidComplete:(id)sender;

@end


/**
 The class represents animation proxy. 
 */
@interface TiAnimation : TiProxy {
@private
	NSNumber	*zIndex;
	NSNumber	*left;
	NSNumber	*right;
	NSNumber	*top;
	NSNumber	*bottom;
	NSNumber	*width;
	NSNumber	*height;
	NSNumber	*duration;
	TiPoint		*center;
	TiColor		*backgroundColor;
	TiColor		*color;
	NSNumber	*opacity;
	NSNumber	*opaque;
	NSNumber	*visible;
	NSNumber	*curve;
	NSNumber	*repeat;
	NSNumber	*autoreverse;
	NSNumber	*delay;
	TiProxy		*transform;
	NSNumber	*transition;
	TiViewProxy	*view;
    TiViewProxy *animatedViewProxy;

	// this is a temporary function passed in
	ListenerEntry *callback;
	
	NSObject<TiAnimationDelegate> *delegate;

	// for animation delegate
	UIView* animatedView;
		
	// for autoreverse
	LayoutConstraint autoreverseLayout;
	UIView *autoreverseView;
	id transformMatrix;
}

/**
 Provides access to animation delegate object.
 */
@property(nonatomic,assign,readwrite) NSObject<TiAnimationDelegate> *delegate;

/**
 Provides access to the view being animated.
 */
@property(nonatomic,readwrite,assign) UIView* animatedView;

/**
 Provides access to autoreverse view to be animated.
 */
@property(nonatomic,readwrite,assign) UIView* autoreverseView;

/**
 Provides access to animation transformation matrix.
 */
@property(nonatomic,readwrite,assign) id transformMatrix;

/**
 Returns autoreverse layout.
 */
@property(nonatomic,readonly) LayoutConstraint autoreverseLayout;

/**
 Returns the callback for the animation.
 */
@property(nonatomic,readonly) ListenerEntry* callback;

// animatable properties against what is being animated
@property(nonatomic,retain,readwrite) NSNumber	*zIndex;
@property(nonatomic,retain,readwrite) NSNumber	*left;
@property(nonatomic,retain,readwrite) NSNumber	*right;
@property(nonatomic,retain,readwrite) NSNumber	*top;
@property(nonatomic,retain,readwrite) NSNumber	*bottom;
@property(nonatomic,retain,readwrite) NSNumber	*width;
@property(nonatomic,retain,readwrite) NSNumber	*height;
@property(nonatomic,retain,readwrite) NSNumber	*duration;
@property(nonatomic,retain,readwrite) TiPoint	*center;
@property(nonatomic,retain,readwrite) TiColor	*color;
@property(nonatomic,retain,readwrite) TiColor	*backgroundColor;
@property(nonatomic,retain,readwrite) NSNumber	*opacity;
@property(nonatomic,retain,readwrite) NSNumber	*opaque;
@property(nonatomic,retain,readwrite) NSNumber	*visible;

// properties that control the animation 
@property(nonatomic,retain,readwrite) NSNumber	*curve;
@property(nonatomic,retain,readwrite) NSNumber	*repeat;
@property(nonatomic,retain,readwrite) NSNumber	*autoreverse;
@property(nonatomic,retain,readwrite) NSNumber	*delay;
@property(nonatomic,retain,readwrite) TiProxy	*transform;
@property(nonatomic,retain,readwrite) NSNumber	*transition;
@property(nonatomic,retain,readwrite) TiProxy	*view;

+(TiAnimation*)animationFromArg:(id)args context:(id<TiEvaluator>)context create:(BOOL)yn;

-(id)initWithDictionary:(NSDictionary*)properties context:(id<TiEvaluator>)context;

-(id)initWithDictionary:(NSDictionary*)properties context:(id<TiEvaluator>)context callback:(KrollCallback*)callback;

-(void)animate:(id)args;

-(BOOL)isTransitionAnimation;

-(NSTimeInterval)animationDuration;
-(void)animationCompleted:(NSString *)animationID finished:(NSNumber *)finished context:(void *)context;

@end
