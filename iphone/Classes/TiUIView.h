/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"
#import "TiAnimation.h"
#import "LayoutConstraint.h"

//By declaring a scrollView protocol, TiUITextWidget can access 
@class TiUIView;
@protocol TiUIScrollView

-(void)keyboardDidShowAtHeight:(CGFloat)keyboardTop forView:(TiUIView *)firstResponderView;
-(void)keyboardDidHide;

@end



@class TiViewProxy;

@interface TiUIView : UIView<TiProxyDelegate,LayoutAutosizing> 
{
@private
	TiProxy *proxy;
	TiViewProxy *parent;
	TiAnimation *animation;
	LayoutConstraint layout;
	id transformMatrix;
	BOOL childrenInitialized;

	
	unsigned int zIndex;
	unsigned int animationDelayGuard;
	
	// Touch detection
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
}

@property(nonatomic,readwrite,assign)	TiProxy *proxy;
@property(nonatomic,readwrite,assign)	TiViewProxy *parent;
@property(nonatomic,readonly)			unsigned	int zIndex;
@property(nonatomic,readonly)			LayoutConstraint *layout;
@property(nonatomic,readwrite,assign)	UIView *touchDelegate;
@property(nonatomic,readonly)			id transformMatrix;

		  
#pragma mark Public API 
-(void)animate:(id)arg;

#pragma mark Framework
-(void)performZIndexRepositioning;
-(void)repositionZIndex;
-(UIImage*)loadImage:(id)image;

-(id)proxyValueForKey:(NSString *)key;
-(void)readProxyValuesWithKeys:(id<NSFastEnumeration>)keys;

-(void)updateLayout:(LayoutConstraint*)layout withBounds:(CGRect)bounds;
-(void)relayout:(CGRect)bounds;
-(void)reposition;
-(void)insertIntoView:(UIView*)view bounds:(CGRect)bounds;
-(void)makeRootViewFirstResponder;
-(void)animationCompleted;

+(void)throwException:(NSString *) reason subreason:(NSString*)subreason location:(NSString *)location;
-(void)throwException:(NSString *) reason subreason:(NSString*)subreason location:(NSString *)location;

@end
