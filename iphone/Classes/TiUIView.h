/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"
#import "TiAnimation.h"
#import "TiGradient.h"
#import "LayoutConstraint.h"

//By declaring a scrollView protocol, TiUITextWidget can access 
@class TiUIView;
@protocol TiUIScrollView

-(void)keyboardDidShowAtHeight:(CGFloat)keyboardTop;
-(void)scrollToShowView:(TiUIView *)firstResponderView withKeyboardHeight:(CGFloat)keyboardTop;

-(void)keyboardDidShowAtHeight:(CGFloat)keyboardTop forView:(TiUIView *)firstResponderView;

@end

void InsetScrollViewForKeyboard(UIScrollView * scrollView,CGFloat keyboardTop,CGFloat minimumContentHeight);
void OffsetScrollViewForRect(UIScrollView * scrollView,CGFloat keyboardTop,CGFloat minimumContentHeight,CGRect responderRect);

void ModifyScrollViewForKeyboardHeightAndContentHeightWithResponderRect(UIScrollView * scrollView,CGFloat keyboardTop,CGFloat minimumContentHeight,CGRect responderRect);

@class TiViewProxy;

@interface TiUIView : UIView<TiProxyDelegate,LayoutAutosizing> 
{
@private
	TiProxy *proxy;
	TiAnimation *animation;
	
	CALayer *gradientLayer;
	
	CGAffineTransform virtualParentTransform;
	id transformMatrix;
	BOOL childrenInitialized;
	BOOL touchEnabled;

	unsigned int animationDelayGuard;
	
	// Touch detection
    BOOL changedInteraction;
	BOOL handlesTouches;
	BOOL handlesTaps;
	BOOL handlesSwipes;
	UIView *touchDelegate;		 // used for touch delegate forwarding
	BOOL animating;
	
	UITapGestureRecognizer*			singleTapRecognizer;
	UITapGestureRecognizer*			doubleTapRecognizer;
	UITapGestureRecognizer*			twoFingerTapRecognizer;
	UIPinchGestureRecognizer*		pinchRecognizer;
	UISwipeGestureRecognizer*		leftSwipeRecognizer;
	UISwipeGestureRecognizer*		rightSwipeRecognizer;
	UILongPressGestureRecognizer*	longPressRecognizer;
	
	//Resizing handling
	CGSize oldSize;
    
	// Image capping/backgrounds
  id backgroundImage;
  TiDimension leftCap;
  TiDimension topCap;
}
-(BOOL)animating;

@property(nonatomic,readwrite,assign)	TiProxy *proxy;
@property(nonatomic,readwrite,assign)	UIView *touchDelegate;
@property(nonatomic,readonly)			id transformMatrix;
@property(nonatomic,readwrite,retain) id backgroundImage;
@property(nonatomic,readonly) BOOL touchEnabled;

@property(nonatomic,readonly)	UITapGestureRecognizer*			singleTapRecognizer;
@property(nonatomic,readonly)	UITapGestureRecognizer*			doubleTapRecognizer;
@property(nonatomic,readonly)	UITapGestureRecognizer*			twoFingerTapRecognizer;
@property(nonatomic,readonly)	UIPinchGestureRecognizer*		pinchRecognizer;
@property(nonatomic,readonly)	UISwipeGestureRecognizer*		leftSwipeRecognizer;
@property(nonatomic,readonly)	UISwipeGestureRecognizer*		rightSwipeRecognizer;
@property(nonatomic,readonly)	UILongPressGestureRecognizer*	longPressRecognizer;

-(CALayer *)backgroundImageLayer;

-(void)animate:(TiAnimation *)newAnimation;

#pragma mark Framework

-(void)initializeState;
-(void)configurationSet;
-(void)setVirtualParentTransform:(CGAffineTransform)newTransform;
-(void)setTransform_:(id)matrix;

-(UIImage*)loadImage:(id)image;

-(id)proxyValueForKey:(NSString *)key;
-(void)readProxyValuesWithKeys:(id<NSFastEnumeration>)keys;
-(void)transferProxy:(TiViewProxy*)newProxy;

-(void)updateTouchHandling;
-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds;
-(void)makeRootViewFirstResponder;
-(void)animationCompleted;

+(void)throwException:(NSString *) reason subreason:(NSString*)subreason location:(NSString *)location;
-(void)throwException:(NSString *) reason subreason:(NSString*)subreason location:(NSString *)location;

-(BOOL)interactionDefault; 
-(BOOL)interactionEnabled;
-(BOOL)hasTouchableListener;

-(void)handleControlEvents:(UIControlEvents)events;

-(void)setVisible_:(id)visible;

-(UIView *)gradientWrapperView;

@end

#pragma mark TO REMOVE, used only during transition.

#define USE_PROXY_FOR_METHOD(resultType,methodname,inputType)	\
-(resultType)methodname:(inputType)value	\
{	\
	NSLog(@"[DEBUG] Using view proxy via redirection instead of directly for %@.",self);	\
	return [(TiViewProxy *)[self proxy] methodname:value];	\
}

#define USE_PROXY_FOR_VERIFY_AUTORESIZING	USE_PROXY_FOR_METHOD(UIViewAutoresizing,verifyAutoresizing,UIViewAutoresizing)



