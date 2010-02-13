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
#import "TiUtils.h"
#import "ImageLoader.h"
#import "Ti2DMatrix.h"
#import "Ti3DMatrix.h"
#import "TiViewProxy.h"
#import "TitaniumApp.h"

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


#define DOUBLE_TAP_DELAY		0.35
#define HORIZ_SWIPE_DRAG_MIN	12
#define VERT_SWIPE_DRAG_MAX		4

@implementation TiUIView

DEFINE_EXCEPTIONS

@synthesize proxy,parent,touchDelegate;

#pragma mark Internal Methods

-(void)dealloc
{
	RELEASE_TO_NIL(transformMatrix);
	RELEASE_TO_NIL(animation);
	[super dealloc];
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

-(void)initializerState
{
	multipleTouches = NO;
	twoFingerTapIsPossible = NO;
	BOOL touchEventsSupported = [self viewSupportsBaseTouchEvents];
	handlesTaps = touchEventsSupported && [self proxyHasTapListener];
	handlesTouches = touchEventsSupported && [self proxyHasTouchListener];
	handlesSwipes = touchEventsSupported && [proxy _hasListeners:@"swipe"];
	
	self.userInteractionEnabled = YES;
	self.multipleTouchEnabled = handlesTaps;	
	 
	self.backgroundColor = [UIColor clearColor]; 
	self.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
}

-(void)setProxy:(TiViewProxy *)p
{
	proxy = p;
	proxy.modelDelegate = self;
	[self initializerState];
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
	return [[ImageLoader sharedLoader] loadImmediateStretchableImage:url];
}

-(id)transformMatrix
{
	return transformMatrix;
}

#pragma mark Layout 

-(LayoutConstraint*)layout
{
	return &layout;
}

-(void)setLayout:(LayoutConstraint *)layout_
{
	layout.left = layout_->left;
	layout.right = layout_->right;
	layout.width = layout_->width;
	layout.top = layout_->top;
	layout.bottom = layout_->bottom;
	layout.height = layout_->height;
}

-(void)insertIntoView:(UIView*)newSuperview bounds:(CGRect)bounds
{
	if (newSuperview==self)
	{
		NSLog(@"[ERROR] invalid call to insertIntoView, new super view is same as myself");
		return;
	}
	ApplyConstraintToViewWithinViewWithBounds(&layout, self, newSuperview, bounds,YES);
}

-(void)reposition
{
	if ([NSThread isMainThread])
	{	//NOTE: This will cause problems with ScrollableView, or is a new wrapper needed?
		[self relayout:[self superview].bounds];
	}
	else 
	{
		[self performSelectorOnMainThread:@selector(reposition) withObject:nil waitUntilDone:NO];
	}

}

-(void)relayout:(CGRect)bounds
{
	if (repositioning==NO)
	{
		repositioning = YES;
		ApplyConstraintToViewWithinViewWithBounds(&layout, self, [self superview], bounds, YES);
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
	[self setLayout:layout_];
	[self relayout:bounds];
}

-(void)performZIndexRepositioning
{
	// sort by zindex
	/*
	NSArray *children = [[NSArray arrayWithArray:[self subviews]] sortedArrayUsingFunction:zindexSort context:NULL];
						 
	// re-configure all the views by zindex order
	for (TiUIView *child in children)
	{
		[child retain];
		[child removeFromSuperview];
		[self addSubview:child];
		[child release];
	}*/
}

-(unsigned int)zIndex
{
	return zIndex;
}

-(void)repositionZIndex
{
	[[parent view] performZIndexRepositioning];
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

-(void)setBounds:(CGRect)bounds
{
	[super setBounds:bounds];
	[self frameSizeChanged:[TiUtils viewPositionRect:self] bounds:bounds];
}

-(CGFloat)minimumParentWidthForWidth:(CGFloat)suggestedWidth
{
	CGFloat result = TiDimensionCalculateValue(layout.left, 0)
			+ TiDimensionCalculateValue(layout.right, 0);
	switch (layout.width.type)
	{
		case TiDimensionTypePixels:
			result += layout.width.value;
			break;
		case TiDimensionTypeAuto:
			if ([self respondsToSelector:@selector(autoWidthForWidth:)])
			{
				result += [self autoWidthForWidth:suggestedWidth - result];
			}
	}
	return result;
}

-(CGFloat)minimumParentHeightForWidth:(CGFloat)suggestedWidth
{
	CGFloat result = TiDimensionCalculateValue(layout.top, 0)
			+ TiDimensionCalculateValue(layout.bottom, 0);
	switch (layout.height.type)
	{
		case TiDimensionTypePixels:
			result += layout.height.value;
			break;
		case TiDimensionTypeAuto:
			if ([self respondsToSelector:@selector(autoHeightForWidth:)])
			{
				suggestedWidth -= TiDimensionCalculateValue(layout.left, 0)
						+ TiDimensionCalculateValue(layout.right, 0);
				result += [self autoHeightForWidth:suggestedWidth];
			}
	}
	return result;
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
	UIImage *resultImage = [[ImageLoader sharedLoader] loadImmediateStretchableImage:bgURL];
	if (resultImage==nil && [image isEqualToString:@"Default.png"])
	{
		// special case where we're asking for Default.png and it's in Bundle not path
		resultImage = [UIImage imageNamed:image];
	}
	self.layer.contents = (id)resultImage.CGImage;
	self.clipsToBounds = image!=nil;
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
	if ([transformMatrix isKindOfClass:[Ti2DMatrix class]])
	{
		self.transform = [(Ti2DMatrix*)transformMatrix matrix];
	}
	else if ([transformMatrix isKindOfClass:[Ti3DMatrix class]])
	{
		self.layer.transform = [(Ti3DMatrix*)transformMatrix matrix];
	}
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

-(void)animate:(id)arg
{
	ENSURE_UI_THREAD(animate,arg);
	RELEASE_TO_NIL(animation);
	
	if ([self.proxy viewReady]==NO)
	{
#ifdef DEBUG
		NSLog(@"[DEBUG] animated called and we're not ready ... (will try again)");
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

-(BOOL)isRepositionProperty:(NSString*)key
{
	return [key isEqualToString:@"width"] ||
		[key isEqualToString:@"height"] ||
		[key isEqualToString:@"top"] ||
		[key isEqualToString:@"left"] ||
		[key isEqualToString:@"right"] ||
		[key isEqualToString:@"bottom"];
}

-(void)repositionChange:(NSString*)key value:(id)inputVal
{
#define READ_CONSTRAINT(k)	\
if ([key isEqualToString:@#k])\
{\
if(inputVal != nil) \
{ \
layout.k = TiDimensionFromObject(inputVal); \
[self reposition];\
return;\
} \
else \
{ \
layout.k = TiDimensionUndefined; \
[self reposition];\
return;\
}\
}	
	READ_CONSTRAINT(width);
	READ_CONSTRAINT(height);
	READ_CONSTRAINT(top);
	READ_CONSTRAINT(left);
	READ_CONSTRAINT(right);
	READ_CONSTRAINT(bottom);
}

-(void)readProxyValuesWithKeys:(id<NSFastEnumeration>)keys
{
	DoProxyDelegateReadValuesWithKeysFromProxy(self, keys, proxy);
}

-(void)propertyChanged:(NSString*)key oldValue:(id)oldValue newValue:(id)newValue proxy:(TiProxy*)proxy_
{
	DoProxyDelegateChangedValuesWithProxy(self, key, oldValue, newValue, proxy_);
}

//
//
//
//-(void)propertyChanged:(NSString*)key oldValue:(id)oldValue newValue:(id)newValue proxy:(TiProxy*)proxy
//{
//	// default implementation will simply invoke the setter property for this object
//	// on the main UI thread
//	SEL sel = [self selectorForProperty:key];
//	if ([self respondsToSelector:sel])
//	{
//		if ([NSThread isMainThread])
//		{
//			[self performSelector:sel withObject:newValue];
//		}
//		else
//		{
//			[self performSelectorOnMainThread:sel withObject:newValue waitUntilDone:NO];
//		}
//	}
//
//	if ([self isRepositionProperty:key] && [self superview]!=nil)
//	{
//		[self repositionChange:key value:newValue];
//	}
//}

-(id)proxyValueForKey:(NSString *)key
{
	return [proxy valueForKey:key];
}

//-(void)readProxyValuesWithKeys:(id<NSFastEnumeration>)keys
//{
//	BOOL isMainThread = [NSThread isMainThread];
//	NSNull * nullObject = [NSNull null];
//
//	for (NSString * thisKey in keys)
//	{
//		SEL sel = [self selectorForProperty:thisKey];
//		if (![self respondsToSelector:sel])
//		{
//			continue;
//		}
//		
//		id newValue = [proxy valueForKey:thisKey];
//		if (newValue == nil)
//		{
//			continue;
//		}
//		if (newValue == nullObject)
//		{
//			newValue = nil;
//		}
//		
//		if (isMainThread)
//		{
//			[self performSelector:sel withObject:newValue];
//		}
//		else
//		{
//			[self performSelectorOnMainThread:sel withObject:newValue waitUntilDone:NO];
//		}
//
//	}
//}

#pragma mark First Responder delegation

-(void)makeRootViewFirstResponder
{
	[[[TitaniumApp app] controller].view becomeFirstResponder];
}

#pragma mark Touch Events

- (void)handleSwipeLeft
{
	NSMutableDictionary *evt = [NSMutableDictionary dictionaryWithDictionary:[TiUtils pointToDictionary:touchLocation]];
	[evt setValue:@"left" forKey:@"direction"];
	[proxy fireEvent:@"swipe" withObject:evt];
}

- (void)handleSwipeRight
{
	NSMutableDictionary *evt = [NSMutableDictionary dictionaryWithDictionary:[TiUtils pointToDictionary:touchLocation]];
	[evt setValue:@"right" forKey:@"direction"];
	[proxy fireEvent:@"swipe" withObject:evt];
}

- (void)handleSingleTap 
{
	if ([proxy _hasListeners:@"singletap"])
	{
		NSDictionary *evt = [TiUtils pointToDictionary:tapLocation];
		[proxy fireEvent:@"singletap" withObject:evt];
	}
}

- (void)handleDoubleTap 
{
	if ([proxy _hasListeners:@"doubletap"])
	{
		NSDictionary *evt = [TiUtils pointToDictionary:tapLocation];
		[proxy fireEvent:@"doubletap" withObject:evt];
	}
}	

- (void)handleTwoFingerTap 
{
	if ([proxy _hasListeners:@"twofingertap"])
	{
		NSDictionary *evt = [TiUtils pointToDictionary:tapLocation];
		[proxy fireEvent:@"twofingertap" withObject:evt];
	}
}

- (UIView *)hitTest:(CGPoint) point withEvent:(UIEvent *)event 
{
    UIView* subview = [super hitTest:point withEvent:event];
	
	// delegate to our touch delegate if we're hit but it's not for us
	if (subview==nil && touchDelegate!=nil)
	{
		return touchDelegate;
	}
	
    return subview;
}

- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event 
{
	UITouch *touch = [touches anyObject];
	
	if (handlesSwipes)
	{
		touchLocation = [touch locationInView:self];
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
		CGPoint point = [touch locationInView:[self superview]];
		NSDictionary *evt = [TiUtils pointToDictionary:point];
		
		if ([proxy _hasListeners:@"touchstart"])
		{
			[proxy fireEvent:@"touchstart" withObject:evt];
		}
		
		if ([touch tapCount] == 1 && [proxy _hasListeners:@"click"])
		{
			[proxy fireEvent:@"click" withObject:evt];
		}
		else if ([touch tapCount] == 2 && [proxy _hasListeners:@"dblclick"])
		{
			[proxy fireEvent:@"dblclick" withObject:evt];
		}
	}
}

- (void)touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event 
{
	UITouch *touch = [touches anyObject];
	if (handlesTouches)
	{
		CGPoint point = [touch locationInView:[self superview]];
		NSDictionary *evt = [TiUtils pointToDictionary:point];
		if ([proxy _hasListeners:@"touchmove"])
		{
			[proxy fireEvent:@"touchmove" withObject:evt];
		}
	}
	if (handlesSwipes)
	{
		CGPoint point = [touch locationInView:self];
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
}

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event 
{
	if (handlesTaps)
	{
		BOOL allTouchesEnded = ([touches count] == [[event touchesForView:self] count]);
		
		// first check for plain single/double tap, which is only possible if we haven't seen multiple touches
		if (!multipleTouches) {
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
		CGPoint point = [touch locationInView:[self superview]];
		NSDictionary *evt = [TiUtils pointToDictionary:point];
		if ([proxy _hasListeners:@"touchend"])
		{
			[proxy fireEvent:@"touchend" withObject:evt];
		}
	}
	if (handlesSwipes)
	{
		touchLocation = CGPointZero;
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
		CGPoint point = [touch locationInView:[self superview]];
		NSDictionary *evt = [TiUtils pointToDictionary:point];
		if ([proxy _hasListeners:@"touchcancel"])
		{
			[proxy fireEvent:@"touchcancel" withObject:evt];
		}
	}
	if (handlesSwipes)
	{
		touchLocation = CGPointZero;
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
