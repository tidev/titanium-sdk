/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiAnimation.h"
#import "Ti2DMatrix.h"
#import "Ti3DMatrix.h"
#import "TiUtils.h"
#import "TiViewProxy.h"
#import "LayoutConstraint.h"
#import "KrollCallback.h"

#import <QuartzCore/QuartzCore.h>

#ifdef DEBUG 
	#define ANIMATION_DEBUG 0
#endif


@implementation TiAnimation

@synthesize delegate;
@synthesize zIndex, left, right, top, bottom, width, height;
@synthesize duration, color, backgroundColor, opacity, opaque, view;
@synthesize visible, curve, repeat, autoreverse, delay, transform, transition;
@synthesize animatedView, callback, isReverse, reverseAnimation;

-(id)initWithDictionary:(NSDictionary*)properties context:(id<TiEvaluator>)context_ callback:(KrollCallback*)callback_
{
	if (self = [super _initWithPageContext:context_])
	{
#define SET_FLOAT_PROP(p,d) \
{\
id v = d==nil ? nil : [d objectForKey:@#p];\
if (v!=nil && ![v isKindOfClass:[NSNull class]]) {\
 self.p = [NSNumber numberWithFloat:[TiUtils floatValue:v]];\
}\
}\

#define SET_INT_PROP(p,d) \
{\
id v = d==nil ? nil : [d objectForKey:@#p];\
if (v!=nil && ![v isKindOfClass:[NSNull class]]) {\
self.p = [NSNumber numberWithInt:[TiUtils intValue:v]];\
}\
}\

#define SET_BOOL_PROP(p,d) \
{\
id v = d==nil ? nil : [d objectForKey:@#p];\
if (v!=nil && ![v isKindOfClass:[NSNull class]]) {\
self.p = [NSNumber numberWithBool:[TiUtils boolValue:v]];\
}\
}\

#define SET_POINT_PROP(p,d) \
{\
id v = d==nil ? nil : [d objectForKey:@#p];\
if (v!=nil && ![v isKindOfClass:[NSNull class]]) {\
self.p = [[[TiPoint alloc] initWithPoint:[TiUtils pointValue:v]] autorelease];\
}\
}\

#define SET_COLOR_PROP(p,d) \
{\
id v = d==nil ? nil : [d objectForKey:@#p];\
if (v!=nil && ![v isKindOfClass:[NSNull class]]) {\
self.p = [TiUtils colorValue:v];\
}\
}\

#define SET_ID_PROP(p,d) \
{\
id v = d==nil ? nil : [d objectForKey:@#p];\
if (v!=nil && ![v isKindOfClass:[NSNull class]]) {\
self.p = v;\
}\
}\

#define SET_PROXY_PROP(p,d) \
{\
id v = d==nil ? nil : [d objectForKey:@#p];\
if (v!=nil && ![v isKindOfClass:[NSNull class]]) {\
self.p = v;\
}\
}\
		
		SET_FLOAT_PROP(zIndex,properties);
		SET_ID_PROP(left,properties);
		SET_ID_PROP(right,properties);
		SET_ID_PROP(top,properties);
		SET_ID_PROP(bottom,properties);
		SET_ID_PROP(width,properties);
		SET_ID_PROP(height,properties);
		SET_FLOAT_PROP(duration,properties);
		SET_FLOAT_PROP(opacity,properties);
		SET_FLOAT_PROP(delay,properties);
		SET_INT_PROP(curve,properties);
		SET_INT_PROP(repeat,properties);
		SET_BOOL_PROP(visible,properties);
		SET_BOOL_PROP(opaque,properties);
		SET_BOOL_PROP(autoreverse,properties);
		SET_POINT_PROP(center,properties);
		SET_COLOR_PROP(backgroundColor,properties);
		SET_COLOR_PROP(color,properties);
		SET_ID_PROP(transform,properties);
		SET_INT_PROP(transition,properties);
		SET_PROXY_PROP(view,properties);

		if (context_!=nil)
		{
			callback = [[ListenerEntry alloc] initWithListener:callback_ context:context_ proxy:self];
		}
	}
	return self;
}

-(id)initWithDictionary:(NSDictionary*)properties context:(id<TiEvaluator>)context_
{
	if (self = [self initWithDictionary:properties context:context_ callback:nil])
	{
	}
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(zIndex);
	RELEASE_TO_NIL(left);
	RELEASE_TO_NIL(right);
	RELEASE_TO_NIL(top);
	RELEASE_TO_NIL(bottom);
	RELEASE_TO_NIL(width);
	RELEASE_TO_NIL(height);
	RELEASE_TO_NIL(duration);
	RELEASE_TO_NIL(center);
	RELEASE_TO_NIL(color);
	RELEASE_TO_NIL(backgroundColor);
	RELEASE_TO_NIL(opacity);
	RELEASE_TO_NIL(opaque);
	RELEASE_TO_NIL(visible);
	RELEASE_TO_NIL(curve);
	RELEASE_TO_NIL(repeat);
	RELEASE_TO_NIL(autoreverse);
	RELEASE_TO_NIL(delay);
	RELEASE_TO_NIL(transform);
	RELEASE_TO_NIL(transition);
	RELEASE_TO_NIL(callback);
	RELEASE_TO_NIL(view);
	RELEASE_TO_NIL(animatedView);
    [animatedViewProxy release];
	[super dealloc];
}

+(TiAnimation*)animationFromArg:(id)args context:(id<TiEvaluator>)context create:(BOOL)yn
{
	id arg = nil;
	BOOL isArray = NO;
	
	if ([args isKindOfClass:[TiAnimation class]])
	{
		return (TiAnimation*)args;
	}
	else if ([args isKindOfClass:[NSArray class]])
	{
		isArray = YES;
		arg = [args objectAtIndex:0];
		if ([arg isKindOfClass:[TiAnimation class]])
		{
			return (TiAnimation*)arg;
		}
	}
	else 
	{
		arg = args;
	}

	if ([arg isKindOfClass:[NSDictionary class]])
	{
		NSDictionary *properties = arg;
		KrollCallback *cb = nil;
		
		if (isArray && [args count] > 1)
		{
			cb = [args objectAtIndex:1];
			ENSURE_TYPE(cb,KrollCallback);
		}
		
		// old school animated type properties
		if ([TiUtils boolValue:@"animated" properties:properties def:NO])
		{
			float duration = [TiUtils floatValue:@"animationDuration" properties:properties def:1000];
			UIViewAnimationTransition transition = [TiUtils intValue:@"animationStyle" properties:properties def:UIViewAnimationTransitionNone];
			TiAnimation *animation = [[[TiAnimation alloc] initWithDictionary:properties context:context callback:cb] autorelease];
			animation.duration = [NSNumber numberWithFloat:duration];
			animation.transition = [NSNumber numberWithInt:transition];
			return animation;
		}
		
		return [[[TiAnimation alloc] initWithDictionary:properties context:context callback:cb] autorelease];
	}
	
	if (yn)
	{
		return [[[TiAnimation alloc] _initWithPageContext:context] autorelease];
	}
	return nil;
}

-(void)setCenter:(id)center_
{
    if (center != center_) {
        [center release];
        center = [[TiPoint alloc] initWithPoint:[TiUtils pointValue:center_]];
    }
}

-(TiPoint*)center
{
    return center;
}

-(id)description
{
	return [NSString stringWithFormat:@"[object TiAnimation<%d>]",[self hash]];
}

-(void)animationStarted:(NSString *)animationID context:(void *)context
{
#if ANIMATION_DEBUG==1	
	NSLog(@"[DEBUG] ANIMATION: STARTING %@, %@",self,(id)context);
#endif
	
	TiAnimation* animation = (TiAnimation*)context;
	if ([(id)animation.animatedView isKindOfClass:[TiUIView class]]) {
		TiUIView *v = (TiUIView*)animation.animatedView;
		animatedViewProxy = [(TiViewProxy*)v.proxy retain];
	}
	if (animation.delegate!=nil && [animation.delegate respondsToSelector:@selector(animationDidStart:)])
	{
		[animation.delegate performSelector:@selector(animationDidStart:) withObject:animation];
	}
	
	// fire the event to any listeners on the animation object
	if ([animation _hasListeners:@"start"])
	{
		[animation fireEvent:@"start" withObject:nil];
	}
}

-(void)animationCompleted:(NSString *)animationID finished:(NSNumber *)finished context:(void *)context
{
#if ANIMATION_DEBUG==1	
	NSLog(@"[DEBUG] ANIMATION: COMPLETED %@, %@",self,(id)context);
#endif
	
	TiAnimation* animation = (TiAnimation*)context;
    if ([animation isReverse]) {
        RELEASE_TO_NIL(animation.animatedView);
        
        animation = [animation reverseAnimation]; // Use the original animation for correct eventing
    }
    
	if (animation.delegate!=nil && [animation.delegate respondsToSelector:@selector(animationWillComplete:)])
	{
		[animation.delegate animationWillComplete:self];
	}	
	
	// fire the event and call the callback
	if ([animation _hasListeners:@"complete"])
	{
		[animation fireEvent:@"complete" withObject:nil];
	}
	
	if (animation.callback!=nil && [animation.callback context]!=nil)
	{
		[animation _fireEventToListener:@"animated" withObject:animation listener:[animation.callback listener] thisObject:nil];
	}
	
	// tell our view that we're done
	if (animatedViewProxy != nil) {
		[animatedViewProxy animationCompleted:animation];
	}
	
	if (animation.delegate!=nil && [animation.delegate respondsToSelector:@selector(animationDidComplete:)])
	{
		[animation.delegate animationDidComplete:animation];
	}	
	
    RELEASE_TO_NIL(animatedViewProxy);
	RELEASE_TO_NIL(animation.animatedView);
}

-(BOOL)isTransitionAnimation
{
	if (transition!=nil)
	{
		UIViewAnimationTransition t = [transition intValue];
		if (t!=0 && t!=UIViewAnimationTransitionNone)
		{
			return YES;
		}
	}
	return NO;
}

-(NSTimeInterval)animationDuration
{
    NSTimeInterval animationDuration = ([self isTransitionAnimation]) ? 1 : 0.2;
    if (duration!=nil)
	{
		animationDuration = [duration doubleValue]/1000;
	}
    return animationDuration;
}

-(void)animate:(id)args
{
	ENSURE_UI_THREAD(animate,args);

#if ANIMATION_DEBUG==1
	NSLog(@"[DEBUG] ANIMATION: starting %@, %@, retain: %d",self,args,[self retainCount]);
#endif
	
	UIView *theview = nil;
	
	if ([args isKindOfClass:[NSArray class]])
	{
		//
		// this is something like:
		//
		// animation.animate(view)
		//
		// vs.
		//
		// view.animate(animation)
		// 
		// which is totally fine, just hand it to the view and let him callback
		//
		theview = [args objectAtIndex:0];
		ENSURE_TYPE(theview,TiViewProxy);
		[(TiViewProxy*)theview animate:[NSArray arrayWithObject:self]];
		return;
	}
	else if ([args isKindOfClass:[TiViewProxy class]])
	{
		// called by the view to cause himself to be animated
		theview = args;
	}
	else if ([args isKindOfClass:[UIView class]])
	{
		// this is OK too
		theview = args;
	}
	
	BOOL transitionAnimation = [self isTransitionAnimation];
	
	TiUIView *view_ = (transitionAnimation && view!=nil) ? 
        [view view] : 
        (([theview isKindOfClass:[TiViewProxy class]]) ? 
            [(TiViewProxy*)theview view] : 
            (TiUIView *)theview);
	TiUIView *transitionView = transitionAnimation ? 
        (([theview isKindOfClass:[TiViewProxy class]]) ? 
            (TiUIView*)[(TiViewProxy*)theview view] : 
            (TiUIView*)theview) : 
        nil;
	
	if (transitionView!=nil)
	{
		// we need to first make sure our new view that we're transitioning to is sized but we don't want
		// to add to the view hiearchry inside the animation block or you'll get the sizings as part of the
		// animation.. which we don't want
		TiViewProxy * ourProxy = (TiViewProxy*)[view_ proxy];
		LayoutConstraint *contraints = [ourProxy layoutProperties];
		ApplyConstraintToViewWithBounds(contraints, view_, transitionView.bounds);
		[ourProxy layoutChildren:NO];
	}
	else
	{
		CALayer * modelLayer = [view_ layer];
		CALayer * transitionLayer = [modelLayer presentationLayer];
		NSArray * animationKeys = [transitionLayer animationKeys];
		for (NSString * thisKey in animationKeys)
		{
			[modelLayer setValue:[transitionLayer valueForKey:thisKey] forKey:thisKey];
		}
	}

	animatedView = [theview retain];
    
    if (!transitionAnimation) {
        UIViewAnimationOptions options = (UIViewAnimationOptionAllowUserInteraction); // Backwards compatible
        if ([view_ animating]) {
            //TIMOB-10318
            //Start from current state if animations are already running. Otherwise from initial value.
            options = options | UIViewAnimationOptionBeginFromCurrentState;
        }
        else {
            [view_ animationStarted];
        }
        NSTimeInterval animationDuration = [self animationDuration];
        
        options |= [curve intValue];
        // Autoreverse must always be combined with repeat: see docs
        options |= ([autoreverse boolValue] ? (UIViewAnimationOptionAutoreverse | UIViewAnimationOptionRepeat) : 0);
        options |= (([repeat intValue] > 0) ? UIViewAnimationOptionRepeat : 0);
        
        void (^animation)() = ^{
            CGFloat repeatCount = [repeat intValue];
            if ((options & UIViewAnimationOptionAutoreverse)) {
                // What we have to do here in order to get the 'correct' animation 
                // (where the view doesn't end up with the wrong settings) is reduce the repeat count
                // by a half-step so the animation ends MIDWAY through the autoreverse (on the wrong frame)
                // and then perform a SECOND animation upon completion - one which takes it back to the initial
                // state.
                //
                // Works around radar #11919161 as a fix suggested by apple in animation documentation. Very unlikely
                // that this bug will be fixed.
                
                reverseAnimation = [[TiAnimation alloc] initWithDictionary:nil context:[self pageContext] callback:[[self callback] listener]];
                [reverseAnimation setReverseAnimation:self];
                [reverseAnimation setIsReverse:YES];
                [reverseAnimation setDuration:duration];
                [reverseAnimation setDelay:[NSNumber numberWithInt:0]];
                [reverseAnimation setCurve:curve];
                repeatCount -= 0.5;
                
                // A repeat count of 0 means the animation cycles once.
                if (repeatCount < 0.0) {
                    repeatCount = 0.5;
                }
            }
            
            if (options & UIViewAnimationOptionRepeat) {
                if (repeatCount != 0.0) {
                    [UIView setAnimationRepeatCount:repeatCount];
                }
                else {
                    [UIView setAnimationRepeatCount:1.0];
                }
            }
            
            // Allow the animation delegate to set up any additional animation information
            if (![self isReverse]) {
                if (delegate!=nil && [delegate respondsToSelector:@selector(animationWillStart:)])
                {
                    [delegate animationWillStart:self];
                }
                
                [self animationStarted:[self description] context:self];
            }
            
            if (transform!=nil)
            {
                if (reverseAnimation != nil) {
                    id transformMatrix = [(TiUIView*)view_ transformMatrix];
                    if (transformMatrix == nil) {
                        transformMatrix = [[[Ti2DMatrix alloc] init] autorelease];
                    }
                    [reverseAnimation setTransform:transformMatrix];
                }
                [(TiUIView *)view_ setTransform_:transform];
            }
            
            if ([view_ isKindOfClass:[TiUIView class]])
            {	//TODO: Shouldn't we be updating the proxy's properties to reflect this?
                TiUIView *uiview = (TiUIView*)view_;
                LayoutConstraint *layoutProperties = [(TiViewProxy *)[uiview proxy] layoutProperties];
                
                BOOL doReposition = NO;
                
#define CHECK_LAYOUT_CHANGE(a) \
if (a!=nil && layoutProperties!=NULL) \
{\
id cacheValue = [[(TiUIView*)view_ proxy] valueForKey:@#a]; \
[reverseAnimation setValue:cacheValue forKey:@#a]; \
layoutProperties->a = TiDimensionFromObject(a); \
doReposition = YES;\
}

                CHECK_LAYOUT_CHANGE(left);
                CHECK_LAYOUT_CHANGE(right);
                CHECK_LAYOUT_CHANGE(width);
                CHECK_LAYOUT_CHANGE(height);
                CHECK_LAYOUT_CHANGE(top);
                CHECK_LAYOUT_CHANGE(bottom);
                if (center!=nil && layoutProperties != NULL)
                {
                    [reverseAnimation setCenter:[[[TiPoint alloc] initWithPoint:[(TiUIView*)view_ center]] autorelease]];

                    layoutProperties->centerX = [center xDimension];
                    layoutProperties->centerY = [center yDimension];
                    doReposition = YES;
                }
                
                if (zIndex!=nil)
                {
                    [reverseAnimation setZIndex:[(TiViewProxy*)[(TiUIView*) view_ proxy] zIndex]];
                    [(TiViewProxy *)[uiview proxy] setVzIndex:[zIndex intValue]];
                }
                
//                if (doReposition)
//                {
//                    [(TiViewProxy *)[uiview proxy] reposition];
//                }
                if (doReposition)
                {
                    CABasicAnimation *theAnimation = [CABasicAnimation animationWithKeyPath:@"shadowPath"];
                    theAnimation.fromValue = (id)[UIBezierPath bezierPathWithRoundedRect:[uiview bounds] cornerRadius:uiview.layer.cornerRadius].CGPath;
                    theAnimation.duration = animationDuration;
                    theAnimation.timingFunction = [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseInEaseOut];
                    [(TiViewProxy *)[uiview proxy] reposition];
                    theAnimation.toValue = (id)[UIBezierPath bezierPathWithRoundedRect:[uiview bounds] cornerRadius:uiview.layer.cornerRadius].CGPath;
                    if (repeatCount > 0) {
                        theAnimation.autoreverses = (reverseAnimation != nil);
                        theAnimation.repeatCount = repeatCount;
                    }
                    [[uiview layer] addAnimation:theAnimation forKey:@"animateShadowPath"];
                }
            }
            
            if (backgroundColor!=nil)
            {
                [reverseAnimation setBackgroundColor:[TiUtils colorValue:[(TiViewProxy*)[(TiUIView*)view_ proxy] valueForKey:@"backgroundColor"]]];
                TiColor *color_ = [TiUtils colorValue:backgroundColor];
                [view_ setBackgroundColor:[color_ _color]];
            }
            
            
            if (color!=nil && [view_ respondsToSelector:@selector(setColor_:)])
            {
                [reverseAnimation setColor:[TiUtils colorValue:[(TiViewProxy*)[(TiUIView*)view_ proxy] valueForKey:@"color"]]];
                [view_ performSelector:@selector(setColor_:) withObject:color];
            }
            
            if (opacity!=nil)
            {
                [reverseAnimation setOpacity:[NSNumber numberWithFloat:[(TiUIView*)view_ alpha]]];
                view_.alpha = [opacity floatValue];
            }
            
            if (opaque!=nil)
            {
                // TODO: Opacity is actually controlled only manually (by us) or via animations. We need to
                // add a way to set it through the view.
                
                [reverseAnimation setOpaque:[NSNumber numberWithBool:[(TiUIView*)view_ isOpaque]]];
                view_.opaque = [opaque boolValue];
            }
            
            if (visible!=nil)
            {
                [reverseAnimation setVisible:[NSNumber numberWithBool:[TiUtils boolValue:[(TiViewProxy*)[(TiUIView*)view_ proxy] valueForKey:@"visible"]]]];
                view_.hidden = ![visible boolValue];
            }
        };
        
        void (^complete)(BOOL) = ^(BOOL finished) {
            if ((reverseAnimation != nil) && ![self isReverse] && finished) {
                [reverseAnimation animate:args];
                RELEASE_TO_NIL(reverseAnimation);
            }
            else {
                [self animationCompleted:[self description] finished:[NSNumber numberWithBool:finished] context:self];
            }
        };
        
        [UIView animateWithDuration:animationDuration
                              delay:([delay doubleValue] / 1000)
                            options:options
                         animations:animation
                         completion:complete];
    }
    else {
		BOOL perform = YES;
		
		// allow a delegate to control transitioning
		if (delegate!=nil && [delegate respondsToSelector:@selector(animationShouldTransition:)])
		{
			perform = [delegate animationShouldTransition:self];
		}
		if (perform)
		{
            // NOTE: This results in a behavior change from previous versions, where interaction
            // with animations was allowed. In particular, with the new block system, animations can
            // be concurrent or interrupted, as opposed to being synchronous.
            [view_ animationStarted];
            [UIView transitionWithView:transitionView
                              duration:[self animationDuration]
                               options:[transition unsignedIntegerValue]
                            animations:^{
                                // transitions are between 2 views so we need to remove existing views (normally only one)
                                // and then we need to add our new view
                                for (UIView *subview in [transitionView subviews])
                                {
                                    if (subview != view_) {
                                        //Making sure the view being transitioned off is properly removed
                                        //from the view hierarchy.
                                        if ([subview isKindOfClass:[TiUIView class]]){
                                            TiUIView *subView = (TiUIView *)subview;
                                            TiViewProxy *ourProxy = (TiViewProxy *)subView.proxy ;
                                            [[ourProxy parent] remove:ourProxy];
                                        }
                                        
                                        [subview removeFromSuperview];
                                    }
                                }
                                [transitionView addSubview:view_];
                                
                                //AnimationStarted needs to be called here, otherwise the animation flags for 
                                //the view being transitioned will end up in a improper state, resulting in 
                                //layout warning.
                                [self animationStarted:[NSString stringWithFormat:@"%X",(void *)theview] 
                                               context:self];                               
                            }
                            completion:^(BOOL finished) {
                                [self animationCompleted:[NSString stringWithFormat:@"%X",(void *)theview]
                                                finished:[NSNumber numberWithBool:finished]
                                                 context:self];
                                
                                //Adding the new view to the transition view's hierarchy.
                                TiViewProxy * parentProxy = (TiViewProxy *)transitionView.proxy;
                                TiViewProxy * child = (TiViewProxy *)view_.proxy;
                                [parentProxy add:child];
                            }
             ];
		}
	}

	
#if ANIMATION_DEBUG==1	
	NSLog(@"[DEBUG] ANIMATION: committed %@, %@",self,args);
#endif
}

@end
