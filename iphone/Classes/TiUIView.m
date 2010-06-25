/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <QuartzCore/QuartzCore.h>
#import "TiBase.h"
#import "TiUIView.h"
#import "TiColor.h"
#import "TiRect.h"
#import "TiUtils.h"
#import "ImageLoader.h"
#ifdef USE_TI_UI2DMATRIX	
	#import "Ti2DMatrix.h"
#endif
#ifdef USE_TI_UI3DMATRIX	
	#import "Ti3DMatrix.h"
#endif
#import "TiViewProxy.h"
#import "TiApp.h"


void ModifyScrollViewForKeyboardHeightAndContentHeightWithResponderRect(UIScrollView * scrollView,CGFloat keyboardTop,CGFloat minimumContentHeight,CGRect responderRect)
{
	CGRect scrollVisibleRect;
	scrollVisibleRect = [scrollView convertRect:[scrollView bounds] toView:nil];
	if (UIInterfaceOrientationIsLandscape([[UIApplication sharedApplication] statusBarOrientation]))
	{
		scrollVisibleRect.origin = CGPointMake(scrollVisibleRect.origin.y, scrollVisibleRect.origin.x);
		scrollVisibleRect.size = CGSizeMake(scrollVisibleRect.size.height, scrollVisibleRect.size.width);
	}
	//First, find out how much we have to compensate.

	CGFloat obscuredHeight = scrollVisibleRect.origin.y + scrollVisibleRect.size.height - keyboardTop;	
	//ObscuredHeight is how many vertical pixels the keyboard obscures of the scroll view. Some of this may be acceptable.

	CGFloat unimportantArea = MAX(scrollVisibleRect.size.height - minimumContentHeight,0);
	//It's possible that some of the covered area doesn't matter. If it all matters, unimportant is 0.

	//As such, obscuredHeight is now how much actually matters of scrollVisibleRect.

	[scrollView setContentInset:UIEdgeInsetsMake(0, 0, MAX(0,obscuredHeight-unimportantArea), 0)];

	scrollVisibleRect.size.height -= MAX(0,obscuredHeight);
	
	//Okay, the scrollVisibleRect.size now represents the actually visible area.
	
	CGPoint offsetPoint = [scrollView contentOffset];

	CGPoint offsetForBottomRight;
	offsetForBottomRight.x = responderRect.origin.x + responderRect.size.width - scrollVisibleRect.size.width;
	offsetForBottomRight.y = responderRect.origin.y + responderRect.size.height - scrollVisibleRect.size.height;
	
	offsetPoint.x = MIN(responderRect.origin.x,MAX(offsetPoint.x,offsetForBottomRight.x));
	offsetPoint.y = MIN(responderRect.origin.y,MAX(offsetPoint.y,offsetForBottomRight.y));

	[scrollView setContentOffset:offsetPoint animated:YES];
}

void RestoreScrollViewFromKeyboard(UIScrollView * scrollView)
{
	CGSize scrollContentSize = [scrollView contentSize];
	CGPoint scrollOffset = [scrollView contentOffset];
	
	[scrollView setContentInset:UIEdgeInsetsZero];

	//Reposition the scroll to handle the uncovered area.
	CGRect scrollVisibleRect = [scrollView bounds];
	CGFloat maxYScrollOffset = scrollContentSize.height - scrollVisibleRect.size.height;
	if (maxYScrollOffset < scrollOffset.y)
	{
		scrollOffset.y = MAX(0.0,maxYScrollOffset);
		[scrollView setContentOffset:scrollOffset animated:YES];
	}
}


CGFloat AutoWidthForView(UIView * superView,CGFloat suggestedWidth)
{
	CGFloat result = 0.0;
	for (TiUIView * thisChildView in [superView subviews])
	{
		//TODO: This should be an unnecessary check, but this happening means the child class didn't override AutoWidth when it should have.
		if(![thisChildView respondsToSelector:@selector(minimumParentWidthForWidth:)])
		{
			NSLog(@"[WARN] %@ contained %@, but called AutoWidthForView was called for it anyways."
					"This typically means that -[TIUIView autoWidthForWidth] should have been overridden.",superView,thisChildView);
			//Treating this as if we had no autosize, and thus, 
			return suggestedWidth;
		}
		//END TODO
		result = MAX(result,[thisChildView minimumParentWidthForWidth:suggestedWidth]);
	}
	return result;
}

CGFloat AutoHeightForView(UIView * superView,CGFloat suggestedWidth,BOOL isVertical)
{
	CGFloat neededAbsoluteHeight=0.0;
	CGFloat neededVerticalHeight=0.0;

	for (TiUIView * thisChildView in [superView subviews])
	{
		if (![thisChildView respondsToSelector:@selector(minimumParentHeightForWidth:)])
		{
			continue;
		}
		CGFloat thisHeight = [thisChildView minimumParentHeightForWidth:suggestedWidth];
		if (isVertical)
		{
			neededVerticalHeight += thisHeight;
		}
		else
		{
			neededAbsoluteHeight = MAX(neededAbsoluteHeight,thisHeight);
		}
	}
	return MAX(neededVerticalHeight,neededAbsoluteHeight);
}



NSInteger zindexSort(TiUIView* view1, TiUIView* view2, void *reverse)
{
	int v1 = view1.zIndex;
	int v2 = view2.zIndex;
	
	int result = 0;
	
	if (v1 < v2)
	{
		result = -1;
	}
	else if (v1 > v2)
	{
		result = 1;
	}
	
	return result;
}


@interface TiGradientLayer : CALayer
{
	TiGradient * gradient;
}
@property(nonatomic,readwrite,retain) TiGradient * gradient;
@end

@implementation TiGradientLayer
@synthesize gradient;

- (void) dealloc
{
	[gradient release];
	[super dealloc];
}

-(void)drawInContext:(CGContextRef)ctx
{
	[gradient paintContext:ctx bounds:[self bounds]];
}

@end





#define DOUBLE_TAP_DELAY		0.35
#define HORIZ_SWIPE_DRAG_MIN	12
#define VERT_SWIPE_DRAG_MAX		4

@implementation TiUIView

DEFINE_EXCEPTIONS

@synthesize proxy,parent,touchDelegate,backgroundImage;

#pragma mark Internal Methods

-(void)dealloc
{
	RELEASE_TO_NIL(transformMatrix);
	RELEASE_TO_NIL(animation);
    RELEASE_TO_NIL(backgroundImage);
	[super dealloc];
}

- (id) init
{
	self = [super init];
	if (self != nil)
	{
		
	}
	return self;
}

-(BOOL)viewSupportsBaseTouchEvents
{
	// give the ability for the subclass to turn off our event handling
	// if it wants too
	return YES;
}


-(BOOL)proxyHasTapListener
{
	return [proxy _hasListeners:@"singletap"] ||
			[proxy _hasListeners:@"doubletap"] ||
			[proxy _hasListeners:@"twofingertap"];
}

-(BOOL)proxyHasTouchListener
{
	return [proxy _hasListeners:@"touchstart"] ||
			[proxy _hasListeners:@"touchcancel"] ||
			[proxy _hasListeners:@"touchend"] ||
			[proxy _hasListeners:@"touchmove"] ||
			[proxy _hasListeners:@"click"] ||
			[proxy _hasListeners:@"dblclick"];
} 

-(void)updateTouchHandling
{
	BOOL touchEventsSupported = [self viewSupportsBaseTouchEvents];
	handlesTaps = touchEventsSupported && [self proxyHasTapListener];
	handlesTouches = touchEventsSupported && [self proxyHasTouchListener];
	handlesSwipes = touchEventsSupported && [proxy _hasListeners:@"swipe"];
	
	self.multipleTouchEnabled = handlesTaps;
}

-(void)initializeState
{
	virtualParentTransform = CGAffineTransformIdentity;
	multipleTouches = NO;
	twoFingerTapIsPossible = NO;
	touchEnabled = YES;
	self.userInteractionEnabled = YES;
	
	[self updateTouchHandling];
	 
	self.backgroundColor = [UIColor clearColor]; 
	self.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
}

-(void)willSendConfiguration
{
}

-(void)didSendConfiguration
{
	configured = YES;
}

-(void)configurationSet
{
	// can be used to trigger things after all properties are set
}

-(BOOL)viewConfigured
{
	return configured;
}

-(void)setProxy:(TiProxy *)p
{
	proxy = p;
	proxy.modelDelegate = self;
}

-(void)setParent:(TiViewProxy *)p
{
	parent = p;
}

-(UIImage*)loadImage:(id)image 
{
	if (image==nil) return nil;
	NSURL *url = [TiUtils toURL:image proxy:proxy];
	if (url==nil)
	{
		NSLog(@"[WARN] could not find image: %@",[url absoluteString]);
		return nil;
	}
	return [[ImageLoader sharedLoader] loadImmediateStretchableImage:url withLeftCap:leftCap topCap:topCap];
}

-(id)transformMatrix
{
	return transformMatrix;
}

#pragma mark Legacy layout calls
/*	These methods are due to layoutProperties and such things origionally being a property of UIView
	and not the proxy. To lessen dependance on UIView (In cases where layout is needed without views
	such as TableViews), this was moved to the proxy. In order to degrade gracefully, these shims are
	left here. They should not be relied upon, but instead used to find methods that still incorrectly
	rely on the view, and fix those methods.
*/

-(LayoutConstraint*)layoutProperties
{
	NSLog(@"[DEBUG] Using view proxy via redirection instead of directly for %@.",self);
	return [(TiViewProxy *)proxy layoutProperties];
}

-(void)setLayoutProperties:(LayoutConstraint *)layout_
{
	NSLog(@"[DEBUG] Using view proxy via redirection instead of directly for %@.",self);
	[(TiViewProxy *)proxy setLayoutProperties:layout_];
}

-(CGFloat)minimumParentWidthForWidth:(CGFloat)value
{
	NSLog(@"[DEBUG] Using view proxy via redirection instead of directly for %@.",self);
	return [(TiViewProxy *)[self proxy] minimumParentWidthForWidth:value];
}

-(CGFloat)minimumParentHeightForWidth:(CGFloat)value
{
	NSLog(@"[DEBUG] Using view proxy via redirection instead of directly for %@.",self);
	return [(TiViewProxy *)[self proxy] minimumParentHeightForWidth:value];
}

-(CGFloat)autoWidthForWidth:(CGFloat)value
{
	NSLog(@"[DEBUG] Using view proxy via redirection instead of directly for %@.",self);
	return [(TiViewProxy *)[self proxy] autoWidthForWidth:value];
}

-(CGFloat)autoHeightForWidth:(CGFloat)value
{
	NSLog(@"[DEBUG] Using view proxy via redirection instead of directly for %@.",self);
	return [(TiViewProxy *)[self proxy] autoHeightForWidth:value];
}




#pragma mark Layout 


-(void)insertIntoView:(UIView*)newSuperview bounds:(CGRect)bounds
{
	if (newSuperview==self)
	{
		NSLog(@"[ERROR] invalid call to insertIntoView, new super view is same as myself");
		return;
	}
	ApplyConstraintToViewWithinViewWithBounds([(TiViewProxy *)proxy layoutProperties], self, newSuperview, bounds,YES);
	[(TiViewProxy *)[self proxy] clearNeedsReposition];
}

-(void)relayout:(CGRect)bounds
{
	if (repositioning==NO)
	{
		repositioning = YES;
		if ([self superview] == nil)
		{
			[[(TiViewProxy *)proxy parent] layoutChild:(TiViewProxy *)proxy optimize:NO];
		}
		ApplyConstraintToViewWithinViewWithBounds([(TiViewProxy *)proxy layoutProperties], self, [self superview], bounds, YES);
		[(TiViewProxy *)[self proxy] clearNeedsReposition];
		repositioning = NO;
	}
}


-(void)updateLayout:(LayoutConstraint*)layout_ withBounds:(CGRect)bounds
{
	if (animating)
	{
#ifdef DEBUG		
		// changing the layout while animating is bad, ignore for now
		NSLog(@"[DEBUG] ignoring new layout while animating..");
#endif		
		return;
	}
	[self relayout:bounds];
}

-(void)performZIndexRepositioning
{
	if ([[self subviews] count] == 0)
	{
		return;
	}
	
	if (![NSThread isMainThread])
	{
		[self performSelectorOnMainThread:@selector(performZIndexRepositioning) withObject:nil waitUntilDone:NO];
		return;
	}
	
	// sort by zindex
	NSArray *children = [[NSArray arrayWithArray:[self subviews]] sortedArrayUsingFunction:zindexSort context:NULL];
						 
	// re-configure all the views by zindex order
	for (TiUIView *child in children)
	{
		[child retain];
		[child removeFromSuperview];
		[self addSubview:child];
		[child release];
	}
}

-(unsigned int)zIndex
{
	return zIndex;
}

-(void)repositionZIndex
{
	if (parent!=nil && [parent viewAttached])
	{
		[self removeFromSuperview];
		[parent layoutChild:(TiViewProxy *)[self proxy] optimize:NO];
	}
}

-(BOOL)animationFromArgument:(id)args
{
	// should happen already in completed callback but in case it didn't complete or was implicitly cancelled
	RELEASE_TO_NIL(animation);
	animation = [[TiAnimation animationFromArg:args context:[self.proxy pageContext] create:NO] retain];
	return (animation!=nil);
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	// for subclasses to do crap
}


-(void)setFrame:(CGRect)frame
{
	[super setFrame:frame];
	
	// this happens when a view is added to another view but not
	// through the framework (such as a tableview header) and it
	// means we need to force the layout of our children
	if (childrenInitialized==NO && 
		CGRectIsEmpty(frame)==NO &&
		[self.proxy isKindOfClass:[TiViewProxy class]])
	{
		childrenInitialized=YES;
		[(TiViewProxy*)self.proxy layoutChildren:NO];
	}
}

-(void)checkBounds
{
	CGRect newBounds = [self bounds];
	if(!CGSizeEqualToSize(oldSize, newBounds.size))
	{
		oldSize = newBounds.size;
		[gradientLayer setFrame:newBounds];
		[self frameSizeChanged:[TiUtils viewPositionRect:self] bounds:newBounds];
	}
}

-(void)setBounds:(CGRect)bounds
{
	[super setBounds:bounds];
	[self checkBounds];
}

-(void)layoutSubviews
{
	[super layoutSubviews];
	[self checkBounds];
}

-(void)updateTransform
{
#ifdef USE_TI_UI2DMATRIX	
	if ([transformMatrix isKindOfClass:[Ti2DMatrix class]])
	{
		self.transform = CGAffineTransformConcat(virtualParentTransform, [(Ti2DMatrix*)transformMatrix matrix]);
		return;
	}
#endif
#ifdef USE_TI_UI3DMATRIX	
	if ([transformMatrix isKindOfClass:[Ti3DMatrix class]])
	{
		self.layer.transform = CATransform3DConcat(CATransform3DMakeAffineTransform(virtualParentTransform),[(Ti3DMatrix*)transformMatrix matrix]);
		return;
	}
#endif
	self.transform = virtualParentTransform;
}


-(void)setVirtualParentTransform:(CGAffineTransform)newTransform
{
	virtualParentTransform = newTransform;
	[self updateTransform];
}

-(void)fillBoundsToRect:(TiRect*)rect
{
	CGRect r = [self bounds];
	[rect setRect:r];
}

#pragma mark Public APIs

-(void)setBorderColor_:(id)color
{
	TiColor *ticolor = [TiUtils colorValue:color];
	self.layer.borderWidth = MAX(self.layer.borderWidth,1);
	self.layer.borderColor = [ticolor _color].CGColor;
}
 
-(void)setBorderWidth_:(id)w
{ 
	self.layer.borderWidth = [TiUtils sizeValue:w];
}

-(void)setBackgroundColor_:(id)color
{
	if ([color isKindOfClass:[UIColor class]])
	{
		super.backgroundColor = color;
	}
	else
	{
		TiColor *ticolor = [TiUtils colorValue:color];
		super.backgroundColor = [ticolor _color];
	}
}

-(void)setOpacity_:(id)opacity
{
	self.alpha = [TiUtils floatValue:opacity];
}

-(void)setBackgroundImage_:(id)image
{
	NSURL *bgURL = [TiUtils toURL:image proxy:proxy];
	UIImage *resultImage = [[ImageLoader sharedLoader] loadImmediateStretchableImage:bgURL
                                                                         withLeftCap:leftCap
                                                                          topCap:topCap];
	if (resultImage==nil && [image isEqualToString:@"Default.png"])
	{
		// special case where we're asking for Default.png and it's in Bundle not path
		resultImage = [UIImage imageNamed:image];
	}
	self.layer.contents = (id)resultImage.CGImage;
	self.clipsToBounds = image!=nil;
    self.backgroundImage = image;
}

-(void)setBackgroundLeftCap_:(id)value
{
    TiDimension cap = TiDimensionFromObject(value);
    if (!TiDimensionEqual(leftCap, cap)) {
        leftCap = cap;
        [self setBackgroundImage_:backgroundImage];
    }
}

-(void)setBackgroundTopCap_:(id)value
{
    TiDimension cap = TiDimensionFromObject(value);
    if (!TiDimensionEqual(topCap, cap)) {
        topCap = cap;
        [self setBackgroundImage_:backgroundImage];
    }
}

-(void)setBorderRadius_:(id)radius
{
	self.layer.cornerRadius = [TiUtils floatValue:radius];
	self.clipsToBounds = YES;
}

-(void)setAnchorPoint_:(id)point
{
	self.layer.anchorPoint = [TiUtils pointValue:point];
}

-(void)setTransform_:(id)transform_
{
	RELEASE_TO_NIL(transformMatrix);
	transformMatrix = [transform_ retain];
	[self updateTransform];
}

-(void)setCenter_:(id)point
{
	self.center = [TiUtils pointValue:point];
}

-(void)setVisible_:(id)visible
{
	self.hidden = ![TiUtils boolValue:visible];
}

-(void)setZIndex_:(id)z
{
	zIndex = [TiUtils intValue:z];
	[self repositionZIndex];
}

-(void)setAnimation_:(id)arg
{
	[self.proxy replaceValue:nil forKey:@"animation" notification:NO];
	[self animate:arg];
}

-(void)setTouchEnabled_:(id)arg
{
	touchEnabled = [TiUtils boolValue:arg];
}

-(void)setBackgroundGradient_:(id)arg
{
	if (arg == nil)
	{
		[gradientLayer removeFromSuperlayer];
		RELEASE_TO_NIL(gradientLayer);
	}
	else if (gradientLayer == nil)
	{
		gradientLayer = [[TiGradientLayer alloc] init];
		[(TiGradientLayer *)gradientLayer setGradient:arg];
		[gradientLayer setNeedsDisplayOnBoundsChange:YES];
//		[gradientLayer setDelegate:self];
		[gradientLayer setFrame:[self bounds]];
		[gradientLayer setNeedsDisplay];
//		[[self layer] addSublayer:gradientLayer];
		[[self layer] insertSublayer:gradientLayer atIndex:0];
	}
	else
	{
		[(TiGradientLayer *)gradientLayer setGradient:arg];
		[gradientLayer setNeedsDisplay];
	}
}


-(void)animate:(id)arg
{
	ENSURE_UI_THREAD(animate,arg);
	RELEASE_TO_NIL(animation);
	
	if ([self.proxy isKindOfClass:[TiViewProxy class]] && [(TiViewProxy*)self.proxy viewReady]==NO)
	{
#ifdef DEBUG
		NSLog(@"[DEBUG] animated called and we're not ready ... (will try again) %@",self);
#endif		
		if (animationDelayGuard++ > 5)
		{
#ifdef DEBUG
			NSLog(@"[DEBUG] animation guard triggered, we exceeded the timeout on waiting for view to become ready");
#endif		
			return;
		}
		[self performSelector:@selector(animate:) withObject:arg afterDelay:0.01];
		return;
	}
	
	animationDelayGuard = 0;

	if ([self animationFromArgument:arg])
	{
		animating = YES;
		[animation animate:self];
	}	
	else
	{
		NSLog(@"[WARN] animate called with %@ but couldn't make an animation object",arg);
	}
}

-(void)animationCompleted
{
	animating = NO;
}

#pragma mark Property Change Support

-(SEL)selectorForProperty:(NSString*)key
{
	NSString *method = [NSString stringWithFormat:@"set%@%@_:", [[key substringToIndex:1] uppercaseString], [key substringFromIndex:1]];
	return NSSelectorFromString(method);
}

-(void)readProxyValuesWithKeys:(id<NSFastEnumeration>)keys
{
	DoProxyDelegateReadValuesWithKeysFromProxy(self, keys, proxy);
}

-(void)propertyChanged:(NSString*)key oldValue:(id)oldValue newValue:(id)newValue proxy:(TiProxy*)proxy_
{
	DoProxyDelegateChangedValuesWithProxy(self, key, oldValue, newValue, proxy_);
}


//Todo: Generalize.
-(void)setKrollValue:(id)value forKey:(NSString *)key withObject:(id)props
{
	if(value == [NSNull null])
	{
		value = nil;
	}

	SEL method = SetterWithObjectForKrollProperty(key);
	if([self respondsToSelector:method])
	{
		[self performSelector:method withObject:value withObject:props];
		return;
	}		

	method = SetterForKrollProperty(key);
	if([self respondsToSelector:method])
	{
		[self performSelector:method withObject:value];
	}	
}

-(void)transferProxy:(TiViewProxy*)newProxy
{
	TiViewProxy * oldProxy = (TiViewProxy *)[self proxy];
	NSArray * oldProperties = (NSArray *)[oldProxy allKeys];
	NSArray * newProperties = (NSArray *)[newProxy allKeys];
	NSArray * keySequence = [newProxy keySequence];
	[oldProxy retain];
	[self retain];

	[oldProxy setView:nil];
	[newProxy setView:self];
	[self setProxy:[newProxy retain]];

	//The important sequence first:
	for (NSString * thisKey in keySequence)
	{
		id newValue = [newProxy valueForKey:thisKey];
		[self setKrollValue:newValue forKey:thisKey withObject:nil];
	}

	for (NSString * thisKey in oldProperties)
	{
		if([newProperties containsObject:thisKey] || [keySequence containsObject:thisKey])
		{
			continue;
		}
		[self setKrollValue:nil forKey:thisKey withObject:nil];
	}

	for (NSString * thisKey in newProperties)
	{
		if ([keySequence containsObject:thisKey])
		{
			continue;
		}
	
		id newValue = [newProxy valueForKey:thisKey];
		id oldValue = [oldProxy valueForKey:thisKey];
		if([newValue isEqual:oldValue])
		{
			continue;
		}
		
		[self setKrollValue:newValue forKey:thisKey withObject:nil];
	}

	[oldProxy release];
	[self release];
}


-(id)proxyValueForKey:(NSString *)key
{
	return [proxy valueForKey:key];
}

#pragma mark First Responder delegation

-(void)makeRootViewFirstResponder
{
	[[[TiApp app] controller].view becomeFirstResponder];
}

#pragma mark Touch Events

- (void)handleSwipeLeft
{
	NSMutableDictionary *evt = 
		[NSMutableDictionary dictionaryWithDictionary:[TiUtils pointToDictionary:[self convertPoint:touchLocation fromView:nil]]];
	[evt setValue:[TiUtils pointToDictionary:touchLocation] forKey:@"globalPoint"];
	[evt setValue:@"left" forKey:@"direction"];
	[proxy fireEvent:@"swipe" withObject:evt];
}

- (void)handleSwipeRight
{
	NSMutableDictionary *evt = 
		[NSMutableDictionary dictionaryWithDictionary:[TiUtils pointToDictionary:[self convertPoint:touchLocation fromView:nil]]];
	[evt setValue:[TiUtils pointToDictionary:touchLocation] forKey:@"globalPoint"];
	[evt setValue:@"right" forKey:@"direction"];
	[proxy fireEvent:@"swipe" withObject:evt];
}

- (void)handleSingleTap 
{
	if ([proxy _hasListeners:@"singletap"])
	{
		NSMutableDictionary *evt = [NSMutableDictionary dictionaryWithDictionary:[TiUtils pointToDictionary:tapLocation]];
		[evt setValue:[TiUtils pointToDictionary:[self convertPoint:tapLocation toView:nil]] forKey:@"globalPoint"];
		[proxy fireEvent:@"singletap" withObject:evt];
	}
}

- (void)handleDoubleTap 
{
	if ([proxy _hasListeners:@"doubletap"])
	{
		NSMutableDictionary *evt = [NSMutableDictionary dictionaryWithDictionary:[TiUtils pointToDictionary:tapLocation]];
		[evt setValue:[TiUtils pointToDictionary:[self convertPoint:tapLocation toView:nil]] forKey:@"globalPoint"];
		[proxy fireEvent:@"doubletap" withObject:evt];
	}
}	

- (void)handleTwoFingerTap 
{
	if ([proxy _hasListeners:@"twofingertap"])
	{
		NSDictionary *evt = [NSMutableDictionary dictionaryWithDictionary:[TiUtils pointToDictionary:tapLocation]];
		[evt setValue:[TiUtils pointToDictionary:[self convertPoint:tapLocation toView:nil]] forKey:@"globalPoint"];
		[proxy fireEvent:@"twofingertap" withObject:evt];
	}
}

- (BOOL)interactionDefault
{
	return YES;
}

- (BOOL)interactionEnabled
{
	if (touchEnabled)
	{
		// we allow the developer to turn off touch with this property but make the default the
		// result of the internal method interactionDefault. some components (like labels) by default
		// don't want or need interaction if not explicitly enabled through an addEventListener
		return [self interactionDefault];
	}
	return NO;
}

- (BOOL)hasTouchableListener
{
	return (handlesSwipes|| handlesTaps || handlesTouches);
}

- (UIView *)hitTest:(CGPoint) point withEvent:(UIEvent *)event 
{
	BOOL hasTouchListeners = [self hasTouchableListener];

	// if we don't have any touch listeners, see if interaction should
	// be handled at all.. NOTE: we don't turn off the views interactionEnabled
	// property since we need special handling ourselves and if we turn it off
	// on the view, we'd never get this event
	if (hasTouchListeners == NO && [self interactionEnabled]==NO)
	{
		return nil;
	}
	
	// delegate to our touch delegate if we're hit but it's not for us
	if (hasTouchListeners==NO && touchDelegate!=nil)
	{
		return touchDelegate;
	}
	
    return [super hitTest:point withEvent:event];
}

// TODO: Revisit this design decision in post-1.3.0
-(void)handleControlEvents:(UIControlEvents)events
{
	// For subclasses (esp. buttons) to override when they have event handlers.
	if ([parent viewAttached] && [parent canHaveControllerParent]) {
		[[parent view] handleControlEvents:events];
	}
}

// TODO: Take a very close look at event handling.  Make sure that parent controls get the right messages.
// It's kind of broken for tables right now, but there are a couple
// hacks to get around it.
- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event 
{
	UITouch *touch = [touches anyObject];
	
	if (handlesSwipes)
	{
		touchLocation = [touch locationInView:nil];
	}
	
	if (handlesTaps)
	{
		// cancel any pending handleSingleTap messages 
		[NSObject cancelPreviousPerformRequestsWithTarget:self selector:@selector(handleSingleTap) object:nil];
		
		int count = [[event touchesForView:self] count];
		
		// update our touch state
		if (count > 1)
		{
			multipleTouches = YES;
		}
		if (count > 2)
		{
			twoFingerTapIsPossible = NO;
		}
	}
	
	if (handlesTouches)
	{
		NSMutableDictionary *evt = [NSMutableDictionary dictionaryWithDictionary:[TiUtils pointToDictionary:[touch locationInView:self]]];
		[evt setValue:[TiUtils pointToDictionary:[touch locationInView:nil]] forKey:@"globalPoint"];
		
		if ([proxy _hasListeners:@"touchstart"])
		{
			[proxy fireEvent:@"touchstart" withObject:evt propagate:YES];
			[self handleControlEvents:UIControlEventTouchDown];
		}
        
        // Click handling is special; don't propagate if we have a delegate,
        // but DO invoke the touch delegate.
		// clicks should also be handled by any control the view is embedded in.
		if ([touch tapCount] == 1 && [proxy _hasListeners:@"click"])
		{
			if (touchDelegate == nil) {
				[proxy fireEvent:@"click" withObject:evt propagate:YES];
			}
			else {
				[touchDelegate touchesBegan:touches withEvent:event];
			}
		}
		else if ([touch tapCount] == 2 && [proxy _hasListeners:@"dblclick"])
		{
			[proxy fireEvent:@"dblclick" withObject:evt propagate:YES];
		}
	}
}

- (void)touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event 
{
	UITouch *touch = [touches anyObject];
	if (handlesTouches)
	{
		NSMutableDictionary *evt = [NSMutableDictionary dictionaryWithDictionary:[TiUtils pointToDictionary:[touch locationInView:self]]];
		[evt setValue:[TiUtils pointToDictionary:[touch locationInView:nil]] forKey:@"globalPoint"];
		if ([proxy _hasListeners:@"touchmove"])
		{
			[proxy fireEvent:@"touchmove" withObject:evt propagate:YES];
		}
	}
	if (handlesSwipes)
	{
		CGPoint point = [touch locationInView:nil];
		// To be a swipe, direction of touch must be horizontal and long enough.
		if (fabsf(touchLocation.x - point.x) >= HORIZ_SWIPE_DRAG_MIN &&
			fabsf(touchLocation.y - point.y) <= VERT_SWIPE_DRAG_MAX)
		{
			// It appears to be a swipe.
			if (touchLocation.x < point.x)
			{
				[self handleSwipeRight];
			}
			else 
			{
				[self handleSwipeLeft];
			}
		}
	}
	
	if (touchDelegate!=nil)
	{
		[touchDelegate touchesMoved:touches withEvent:event];
	}
}

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event 
{
	if (handlesTaps)
	{
		BOOL allTouchesEnded = ([touches count] == [[event touchesForView:self] count]);
		
		// first check for plain single/double tap, which is only possible if we haven't seen multiple touches
		if (!multipleTouches) 
		{
			UITouch *touch = [touches anyObject];
			tapLocation = [touch locationInView:self];
			
			if ([touch tapCount] == 1) 
			{
				[self performSelector:@selector(handleSingleTap) withObject:nil afterDelay:DOUBLE_TAP_DELAY];
			} 
			else if([touch tapCount] == 2) 
			{
				[self handleDoubleTap];
			}
		}    
		
		// check for 2-finger tap if we've seen multiple touches and haven't yet ruled out that possibility
		else if (multipleTouches && twoFingerTapIsPossible) 
		{ 
			
			// case 1: this is the end of both touches at once 
			if ([touches count] == 2 && allTouchesEnded) 
			{
				int i = 0; 
				int tapCounts[2]; CGPoint tapLocations[2];
				for (UITouch *touch in touches) {
					tapCounts[i]    = [touch tapCount];
					tapLocations[i] = [touch locationInView:self];
					i++;
				}
				if (tapCounts[0] == 1 && tapCounts[1] == 1) 
				{ 
					// it's a two-finger tap if they're both single taps
					tapLocation = midpointBetweenPoints(tapLocations[0], tapLocations[1]);
					[self handleTwoFingerTap];
				}
			}
			
			// case 2: this is the end of one touch, and the other hasn't ended yet
			else if ([touches count] == 1 && !allTouchesEnded) 
			{
				UITouch *touch = [touches anyObject];
				if ([touch tapCount] == 1) 
				{
					// if touch is a single tap, store its location so we can average it with the second touch location
					tapLocation = [touch locationInView:self];
				} 
				else 
				{
					twoFingerTapIsPossible = NO;
				}
			}
			
			// case 3: this is the end of the second of the two touches
			else if ([touches count] == 1 && allTouchesEnded) 
			{
				UITouch *touch = [touches anyObject];
				if ([touch tapCount] == 1) 
				{
					// if the last touch up is a single tap, this was a 2-finger tap
					tapLocation = midpointBetweenPoints(tapLocation, [touch locationInView:self]);
					//[self handleTwoFingerTap];
				}
			}
		}
        
		// if all touches are up, reset touch monitoring state
		if (allTouchesEnded) 
		{
			twoFingerTapIsPossible = YES;
			multipleTouches = NO;
		}
	}
	
	if (handlesTouches)
	{
		UITouch *touch = [touches anyObject];
		NSMutableDictionary *evt = [NSMutableDictionary dictionaryWithDictionary:[TiUtils pointToDictionary:[touch locationInView:self]]];
		[evt setValue:[TiUtils pointToDictionary:[touch locationInView:nil]] forKey:@"globalPoint"];
		if ([proxy _hasListeners:@"touchend"])
		{
			[proxy fireEvent:@"touchend" withObject:evt propagate:YES];
			[self handleControlEvents:UIControlEventTouchCancel];
		}
	}
	if (handlesSwipes)
	{
		touchLocation = CGPointZero;
	}
	
	if (touchDelegate!=nil)
	{
		[touchDelegate touchesEnded:touches withEvent:event];
	}
}

- (void)touchesCancelled:(NSSet *)touches withEvent:(UIEvent *)event 
{
	if (handlesTaps)
	{
		twoFingerTapIsPossible = YES;
		multipleTouches = NO;
	}
	if (handlesTouches)
	{
		UITouch *touch = [touches anyObject];
		CGPoint point = [touch locationInView:self];
		NSDictionary *evt = [TiUtils pointToDictionary:point];
		if ([proxy _hasListeners:@"touchcancel"])
		{
			[proxy fireEvent:@"touchcancel" withObject:evt propagate:YES];
		}
	}
	if (handlesSwipes)
	{
		touchLocation = CGPointZero;
	}
	
	if (touchDelegate!=nil)
	{
		[touchDelegate touchesCancelled:touches withEvent:event];
	}
}

#pragma mark Listener management

-(void)listenerAdded:(NSString*)event count:(int)count
{
	if (count == 1 && [self viewSupportsBaseTouchEvents])
	{
		if ([self proxyHasTouchListener])
		{
			handlesTouches = YES;
		}
		if ([event hasSuffix:@"tap"])
		{
			handlesTaps = YES;
		}
		if ([event isEqualToString:@"swipe"])
		{
			handlesSwipes = YES;
		}
		
		if (handlesTouches || handlesTaps || handlesSwipes)
		{
			self.userInteractionEnabled = YES;
		}
		
		if (handlesTaps)
		{
			self.multipleTouchEnabled = YES;
		}
	}
}

-(void)listenerRemoved:(NSString*)event count:(int)count
{
	if (count == 0)
	{
		// unfortunately on a remove, we have to check all of them
		// since we might be removing one but we still have others
		
		if (handlesTouches && 
			[self.proxy _hasListeners:@"touchstart"]==NO &&
			[self.proxy _hasListeners:@"touchmove"]==NO &&
			[self.proxy _hasListeners:@"touchcancel"]==NO &&
			[self.proxy _hasListeners:@"touchend"]==NO &&
			[self.proxy _hasListeners:@"click"]==NO &&
			[self.proxy _hasListeners:@"dblclick"]==NO)
		{
			handlesTouches = NO;
		}
		if (handlesTaps &&
			[self.proxy _hasListeners:@"singletap"]==NO &&
			[self.proxy _hasListeners:@"doubletap"]==NO &&
			[self.proxy _hasListeners:@"twofingertap"]==NO)
		{
			handlesTaps = NO;
		}
		if (handlesSwipes &&
			[event isEqualToString:@"swipe"])
		{
			handlesSwipes = NO;
		}
		
		if (handlesTaps == NO && handlesTouches == NO)
		{
			self.userInteractionEnabled = NO;
			self.multipleTouchEnabled = NO;
		}
	}
}

@end
