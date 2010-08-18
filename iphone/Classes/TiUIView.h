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

-(void)keyboardDidShowAtHeight:(CGFloat)keyboardTop forView:(TiUIView *)firstResponderView;
-(void)keyboardDidHideForView:(TiUIView *)hidingView;

@end

void ModifyScrollViewForKeyboardHeightAndContentHeightWithResponderRect(UIScrollView * scrollView,CGFloat keyboardTop,CGFloat minimumContentHeight,CGRect responderRect);
void RestoreScrollViewFromKeyboard(UIScrollView * scrollView);

CGFloat AutoWidthForView(UIView * superView,CGFloat suggestedWidth);
CGFloat AutoHeightForView(UIView * superView,CGFloat suggestedWidth,BOOL isVertical);
//CGFloat AutoHeightForView(UIView * superView,CGFloat suggestedWidth);


@class TiViewProxy;

@interface TiUIView : UIView<TiProxyDelegate,LayoutAutosizing> 
{
@private
	TiProxy *proxy;
	TiViewProxy *parent;
	TiAnimation *animation;
	
	CALayer *gradientLayer;
	
	CGAffineTransform virtualParentTransform;
	id transformMatrix;
	BOOL childrenInitialized;
	BOOL configured;
	BOOL touchEnabled;

	unsigned int zIndex;
	unsigned int animationDelayGuard;
	
	// Touch detection
    BOOL changedInteraction;
	BOOL handlesTouches;
	BOOL handlesTaps;
	CGPoint tapLocation;         // Needed to record location of single tap, which will only be registered after delayed perform.
	BOOL multipleTouches;        // YES if a touch event contains more than one touch; reset when all fingers are lifted.
	BOOL twoFingerTapIsPossible; // Set to NO when 2-finger tap can be ruled out (e.g. 3rd finger down, fingers touch down too far apart, etc).	
	CGPoint touchLocation;		 // Need for swipe detection
	BOOL handlesSwipes;
	UIView *touchDelegate;		 // used for touch delegate forwarding
	BOOL animating;
	BOOL repositioning;
	
	//Resizing handling
	CGSize oldSize;
    
	// Image capping/backgrounds
  id backgroundImage;
  TiDimension leftCap;
  TiDimension topCap;
}

@property(nonatomic,readwrite,assign)	TiProxy *proxy;
@property(nonatomic,readwrite,assign)	TiViewProxy *parent;
@property(nonatomic,readonly)			unsigned	int zIndex;
@property(nonatomic,readonly)			LayoutConstraint *layoutProperties;
@property(nonatomic,readwrite,assign)	UIView *touchDelegate;
@property(nonatomic,readonly)			id transformMatrix;
@property(nonatomic,readwrite,retain) id backgroundImage;

		  
#pragma mark Public API 
-(void)animate:(id)arg;

#pragma mark Framework

-(void)initializeState;
-(void)willSendConfiguration;
-(void)configurationSet;
-(void)didSendConfiguration;
-(BOOL)viewConfigured;
-(void)setVirtualParentTransform:(CGAffineTransform)newTransform;
-(void)setTransform_:(id)matrix;

-(void)performZIndexRepositioning;
-(void)repositionZIndex;
-(void)repositionZIndexIfNeeded;

-(UIImage*)loadImage:(id)image;

-(id)proxyValueForKey:(NSString *)key;
-(void)readProxyValuesWithKeys:(id<NSFastEnumeration>)keys;
-(void)transferProxy:(TiViewProxy*)newProxy;

-(void)updateLayout:(LayoutConstraint*)layout withBounds:(CGRect)bounds;
-(void)updateTouchHandling;
-(void)relayout:(CGRect)bounds;
-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds;
-(void)insertIntoView:(UIView*)view bounds:(CGRect)bounds;
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



