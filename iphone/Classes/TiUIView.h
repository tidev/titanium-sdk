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

/**
 The protocol for scrolling.
 */
@protocol TiScrolling

/**
 Tells the scroll view that keyboard did show.
 @param keyboardTop The keyboard height.
 */
-(void)keyboardDidShowAtHeight:(CGFloat)keyboardTop;

/**
 Tells the scroll view to scroll to make the specified view visible.
 @param firstResponderView The view to make visible.
 @param keyboardTop The keyboard height.
 */
-(void)scrollToShowView:(TiUIView *)firstResponderView withKeyboardHeight:(CGFloat)keyboardTop;

@end

void InsetScrollViewForKeyboard(UIScrollView * scrollView,CGFloat keyboardTop,CGFloat minimumContentHeight);
void OffsetScrollViewForRect(UIScrollView * scrollView,CGFloat keyboardTop,CGFloat minimumContentHeight,CGRect responderRect);

void ModifyScrollViewForKeyboardHeightAndContentHeightWithResponderRect(UIScrollView * scrollView,CGFloat keyboardTop,CGFloat minimumContentHeight,CGRect responderRect);

@class TiViewProxy;

/**
 Base class for all Titanium views.
 @see TiViewProxy
 */
@interface TiUIView : UIView<TiProxyDelegate,LayoutAutosizing> 
{
@protected
    BOOL configurationSet;

@private
	TiProxy *proxy;
	TiAnimation *animation;
	
	CALayer *gradientLayer;
	
	CGAffineTransform virtualParentTransform;
	id transformMatrix;
	BOOL childrenInitialized;
	BOOL touchEnabled;

	unsigned int animationDelayGuard;
	unsigned int animationDelayGuardForLayout;
	
	// Touch detection
    BOOL changedInteraction;
	BOOL handlesTouches;
	UIView *touchDelegate;		 // used for touch delegate forwarding
	BOOL animating;
	
	UITapGestureRecognizer*			singleTapRecognizer;
	UITapGestureRecognizer*			doubleTapRecognizer;
	UITapGestureRecognizer*			twoFingerTapRecognizer;
	UIPinchGestureRecognizer*		pinchRecognizer;
	UISwipeGestureRecognizer*		leftSwipeRecognizer;
	UISwipeGestureRecognizer*		rightSwipeRecognizer;
	UISwipeGestureRecognizer*		upSwipeRecognizer;
	UISwipeGestureRecognizer*		downSwipeRecognizer;
	UILongPressGestureRecognizer*	longPressRecognizer;
	
	//Resizing handling
	CGSize oldSize;
    
	// Image capping/backgrounds
    id backgroundImage;
    BOOL backgroundRepeat;
    TiDimension leftCap;
    TiDimension topCap;
}

/**
 Returns current status of the view animation.
 @return _YES_ if view is being animated, _NO_ otherwise.
 */
-(BOOL)animating;

/**
 Provides access to a proxy object of the view. 
 */
@property(nonatomic,readwrite,assign)	TiProxy *proxy;

/**
 Provides access to touch delegate of the view.
 
 Touch delegate is the control that receives all touch events.
 */
@property(nonatomic,readwrite,assign)	UIView *touchDelegate;

/**
 Returns view's transformation matrix.
 */
@property(nonatomic,readonly)			id transformMatrix;

/**
 Provides access to background image of the view.
 */
@property(nonatomic,readwrite,retain) id backgroundImage;

/**
 Returns enablement of touch events.
 @see updateTouchHandling
 */
@property(nonatomic,readonly) BOOL touchEnabled;
@property(nonatomic,readonly) CGSize oldSize;

@property(nonatomic,readonly)	UITapGestureRecognizer*			singleTapRecognizer;
@property(nonatomic,readonly)	UITapGestureRecognizer*			doubleTapRecognizer;
@property(nonatomic,readonly)	UITapGestureRecognizer*			twoFingerTapRecognizer;
@property(nonatomic,readonly)	UIPinchGestureRecognizer*		pinchRecognizer;
@property(nonatomic,readonly)	UISwipeGestureRecognizer*		leftSwipeRecognizer;
@property(nonatomic,readonly)	UISwipeGestureRecognizer*		rightSwipeRecognizer;
@property(nonatomic,readonly)	UILongPressGestureRecognizer*	longPressRecognizer;

-(void)configureGestureRecognizer:(UIGestureRecognizer*)gestureRecognizer;
- (UIGestureRecognizer *)gestureRecognizerForEvent:(NSString *)event;

/**
 Returns CA layer for the background image of the view.
 */
-(CALayer *)backgroundImageLayer;
/**
 Returns CA layer for the background gradient of the view.
 */
-(CALayer *)gradientLayer;

/**
 Tells the view to start specified animation.
 @param newAnimation The animation to start.
 */
-(void)animate:(TiAnimation *)newAnimation;

#pragma mark Framework

/**
 Performs view's initialization procedure.
 */
-(void)initializeState;

/**
 Performs view's configuration procedure.
 */
-(void)configurationSet;

/**
 Sets virtual parent transformation for the view.
 @param newTransform The transformation to set.
 */
-(void)setVirtualParentTransform:(CGAffineTransform)newTransform;
-(void)setTransform_:(id)matrix;

/*
 Tells the view to load an image.
 @param image The string referring the image.
 @return The loaded image.
 */
-(UIImage*)loadImage:(id)image;

-(id)proxyValueForKey:(NSString *)key;
-(void)readProxyValuesWithKeys:(id<NSFastEnumeration>)keys;

/*
 Tells the view to change its proxy to the new one provided.
 @param newProxy The new proxy to set on the view.
 @param deep true for deep transfer
 */
-(void)transferProxy:(TiViewProxy*)newProxy deep:(BOOL)deep;

/*
 Returns whether the view tree matches proxy tree for later transfer.
 @param proxy The proxy to validate view tree with.
 @param deep true for deep validation
 */
-(BOOL)validateTransferToProxy:(TiViewProxy*)proxy deep:(BOOL)deep;

/**
 Tells the view to update its touch handling state.
 @see touchEnabled
 */
-(void)updateTouchHandling;

/**
 Tells the view that its frame and/or bounds has chnaged.
 @param frame The frame rect
 @param bounds The bounds rect
 */
-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds;

/**
 Tells the view to make its root view a first responder.
 */
-(void)makeRootViewFirstResponder;
-(void)animationStarted;
-(void)animationCompleted;

/**
 The convenience method to raise an exception for the view.
 @param reason The exception reason.
 @param subreason The exception subreason.
 @param location The exception location.
 */
+(void)throwException:(NSString *) reason subreason:(NSString*)subreason location:(NSString *)location;

-(void)throwException:(NSString *) reason subreason:(NSString*)subreason location:(NSString *)location;

/**
 Returns default enablement for interactions.
 
 Subclasses may override.
 @return _YES_ if the control has interactions enabled by default, _NO_ otherwise.
 */
-(BOOL)interactionDefault; 

-(BOOL)interactionEnabled;

/**
 Whether or not the view has any touchable listeners attached.
 @return _YES_ if the control has any touchable listener attached, _NO_ otherwise.
 */
-(BOOL)hasTouchableListener;

-(void)handleControlEvents:(UIControlEvents)events;

-(void)setVisible_:(id)visible;

-(void)setBackgroundImage_:(id)value;

-(UIView *)gradientWrapperView;
-(void)checkBounds;

@property (nonatomic, readonly) id accessibilityElement;

- (void)setAccessibilityLabel_:(id)accessibilityLabel;
- (void)setAccessibilityValue_:(id)accessibilityValue;
- (void)setAccessibilityHint_:(id)accessibilityHint;
- (void)setAccessibilityHidden_:(id)accessibilityHidden;

/**
 Whether or not a view not normally picked up by the Titanium view hierarchy (such as wrapped iOS UIViews) was touched.
 @return _YES_ if the view contains specialized content (such as a system view) which should register as a touch for this view, _NO_ otherwise.
 */
-(BOOL)touchedContentViewWithEvent:(UIEvent*)event;

- (void)processTouchesBegan:(NSSet *)touches withEvent:(UIEvent *)event;
- (void)processTouchesMoved:(NSSet *)touches withEvent:(UIEvent *)event;
- (void)processTouchesEnded:(NSSet *)touches withEvent:(UIEvent *)event;
- (void)processTouchesCancelled:(NSSet *)touches withEvent:(UIEvent *)event;
@end

#pragma mark TO REMOVE, used only during transition.

#define USE_PROXY_FOR_METHOD(resultType,methodname,inputType)	\
-(resultType)methodname:(inputType)value	\
{	\
	DeveloperLog(@"[DEBUG] Using view proxy via redirection instead of directly for %@.",self);	\
	return [(TiViewProxy *)[self proxy] methodname:value];	\
}

#define USE_PROXY_FOR_VERIFY_AUTORESIZING	USE_PROXY_FOR_METHOD(UIViewAutoresizing,verifyAutoresizing,UIViewAutoresizing)



