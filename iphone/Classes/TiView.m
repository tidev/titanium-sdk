/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <QuartzCore/QuartzCore.h>

#import "TiView.h"
#import "TiHost.h"
#import "TiViewController.h"
#import "TiUtils.h"
#import "Ti2DMatrix.h"
#import "Ti3DMatrix.h"
#import "Webcolor.h"
#import "ImageLoader.h"
#import "TitaniumApp.h"

#define SYNTHESIZE_DIMENSION(propertyGetter,propertySetter,propertyValue)	\
-(void)propertySetter:(id)newValue	\
{	\
UI_ENSURE_AFTER_ANIMATION(propertySetter,newValue);	\
[propertyValue autorelease]; \
propertyValue = [[TiUtils dimensionValue:newValue] retain];	\
[self _setNeedsRepositioning];	\
}	\
\
BEGIN_UI_THREAD_PROTECTED_VALUE(propertyGetter,NSNumber) \
result = [TiUtils valueFromDimension:propertyValue];	\
END_UI_THREAD_PROTECTED_VALUE(propertyGetter)	\


NSInteger zIndexSort(TiView* view1, TiView* view2, void *reverse)
{
	int v1 = [view1 _zIndex];
	int v2 = [view1 _zIndex];
	
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

@implementation TiView

-(id)_initWithPageContext:(id<TiEvaluator>)context
{
	if (self = [super _initWithPageContext:context])
	{
	}
	return self;
}

#if PROXY_MEMORY_TRACK == 1
-(id)retain
{
	NSLog(@"RETAIN: %@ [%d]",self,[self retainCount]+1);
	return [super retain];
}
-(oneway void)release
{
	NSLog(@"RELEASE: %@ [%d]",self,[self retainCount]-1);
	[super release];
}
#endif

-(void)dealloc
{
	[self _destroy];
	[super dealloc];
}

#pragma mark Internal methods

-(void)_destroy
{
	if (parent!=nil)
	{
		[parent remove:[NSArray arrayWithObject:self]];
	}
	if (proxies!=nil)
	{
		NSArray *a = [NSArray arrayWithArray:proxies];
		for (TiView *child in a)
		{
			[self remove:[NSArray arrayWithObject:child]];
			[child _destroy];
		}
		[proxies removeAllObjects];
	}
	if (view!=nil && [view superview]!=nil)
	{ 
		[view removeFromSuperview];
	}
	RELEASE_TO_NIL(view);
	RELEASE_TO_NIL(transform);
	RELEASE_TO_NIL(proxies);
	RELEASE_TO_NIL(controller);
	RELEASE_TO_NIL(brdColor);
	RELEASE_TO_NIL(bgColor);
	RELEASE_TO_NIL(animation);
	RELEASE_TO_NIL(animationQueue);
	
	window=nil; //not retained
	parent = nil; //not retained

	[super _destroy];
}

-(void)_queueAfterAnimationAction:(TiAction*)action
{
	if (animationQueue==nil)
	{
		animationQueue = [[NSMutableArray alloc] init];
	}
	[animationQueue addObject:action]; 
}

-(void)didReceiveMemoryWarning:(NSNotification*)notification
{
	//FOR NOW, we're not dropping anything but we'll want to do before release
	//subclasses need to call super if overriden
}

-(UIView*)_createView:(CGRect)frame properties:(NSDictionary*)properties
{
	UIView *v = [[UIView alloc] initWithFrame:frame];
	v.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
	return [v autorelease];
}

-(BOOL)_customConfiguration
{
	return NO;
}

-(CGRect)_defaultFromIfNotSet
{
	return [TiUtils contentFrame:NO];
}

-(void)_initWithProperties:(NSDictionary*)properties
{
	ReadConstraintFromDictionary(&layout, properties, NULL);

	CGRect frame;
	if (TiDimensionIsPixels(layout.width) && TiDimensionIsPixels(layout.height))
	{
		frame = [self _defaultFromIfNotSet];
	}
	else
	{
		frame = CGRectMake(layout.left.value, layout.top.value, layout.width.value, layout.height.value);
	}
	
	//FIXME
	//zIndex = layout.z.value;

	// should return us non-retained
	UIView *delegate = [self _createView:frame properties:properties];
	if ([self _draggable])
	{
		view = [[TiViewContainer alloc] _initWithView:delegate delegate:self frame:frame handlesTouches:NO];
	}
	else 
	{
		view = [delegate retain];
	} 
	
	if ([self _customConfiguration])
	{
		// subclass is telling us he wants to do it all
		return;
	}
	
	BOOL opaque = [TiUtils boolValue:@"opaque" properties:properties def:YES];
	double alpha = [TiUtils doubleValue:@"opacity" properties:properties def:1.0];
	[view setOpaque:opaque];
	[view setAlpha:alpha];

	NSString *bgImage = [TiUtils stringValue:@"backgroundImage" properties:properties];
	if (bgImage!=nil)
	{
		NSURL *bgURL = [TiUtils toURL:bgImage proxy:self];
		UIImage *resultImage = [[ImageLoader sharedLoader] loadImmediateStretchableImage:bgURL];
		if (resultImage==nil && [bgImage isEqualToString:@"Default.png"])
		{
			// special case where we're asking for Default.png and it's in Bundle not path
			resultImage = [UIImage imageNamed:bgImage];
		}
		view.layer.contents = (id)resultImage.CGImage;
		bgColor = [[TiColor colorNamed:@"transparent"] retain];
	}
	
	TiColor *bg = [TiUtils colorValue:@"backgroundColor" properties:properties];
	if (bg!=nil)
	{
		bgColor = [bg retain];
		[view setBackgroundColor:[bg _color]];
	}
	else if (bgImage==nil)
	{
		[view setBackgroundColor:[UIColor clearColor]];
		bgColor = [[TiColor colorNamed:@"transparent"] retain];
	}
	
	float radius = [TiUtils floatValue:@"borderRadius" properties:properties];
	if (radius > 0)
	{
		view.layer.cornerRadius = radius;
	}
	
	id matrix = [properties objectForKey:@"transform"];
	if (matrix!=nil)
	{
		if ([matrix isKindOfClass:[Ti2DMatrix class]])
		{
			view.transform = [(Ti2DMatrix*)matrix matrix];
		}
		else if ([matrix isKindOfClass:[Ti3DMatrix class]])
		{
			view.layer.transform = [(Ti3DMatrix*)matrix matrix];
		}
		else
		{
			[self throwException:TiExceptionInvalidType subreason:
					[NSString stringWithFormat:@"expected either Ti2DMatrix or Ti3DMatrix, was: %@",[matrix class]]
					location:CODELOCATION];
		}
		transform = [matrix retain];
	}
	
	view.opaque = opaque;
	view.alpha = alpha;
	
	
	TiColor *borderColor_ = [TiUtils colorValue:@"borderColor" properties:properties def:nil];
	float borderWidth = [TiUtils floatValue:@"borderWidth" properties:properties];
	
	if (borderWidth > 0 || borderColor_!=nil)
	{
		// if they specify a borderColor but no borderWidth, default to 1
		view.layer.borderWidth = MAX(borderWidth,1);
		
		// if they specify a borderWidth but no borderColor, default to black
		if (borderColor_==nil)
		{
			borderColor_ = [TiColor colorNamed:@"black"];
		}
		
		brdColor = [borderColor_ retain];
		view.layer.borderColor = [borderColor_ _color].CGColor;
	}
	
	// the anchor point is which the transformation will anchor upon. defaults to the center
	CGPoint anchorPoint = [TiUtils pointValue:@"anchorPoint" properties:properties def:CGPointMake(0.5,0.5)];
	view.layer.anchorPoint = anchorPoint;

	if ([properties objectForKey:@"center"]!=nil)
	{
		CGPoint center = [TiUtils pointValue:@"center" properties:properties def:CGPointZero];
		view.center = center;
	}
	
	BOOL visible = [TiUtils boolValue:@"visible" properties:properties def:YES];
	view.hidden = !visible;
}

-(void)addEventListener:(NSArray*)args
{
	// must be done on the main UI thread
	ENSURE_UI_THREAD(addEventListener,args);
	[super addEventListener:args];
}

-(void)removeEventListener:(NSArray*)args
{
	// must be done on the main UI thread
	ENSURE_UI_THREAD(removeEventListener,args);
	[super removeEventListener:args];
}

-(void)_listenerAdded:(NSString*)type count:(int)count
{
	// only do delgate if it's a container
	if ([view isKindOfClass:[TiViewContainer class]])
	{
		[(TiViewContainer*)view _startHandlingTouches:type count:count];
	}
}

-(void)_listenerRemoved:(NSString*)type count:(int)count
{
	// only do delgate if it's a container
	if ([view isKindOfClass:[TiViewContainer class]])
	{
		[(TiViewContainer*)view _stopHandlingTouches:type count:count];
	}
}

-(UIView*)_animateView
{
	// by default the view that's animated is our view but subclasses could override 
	return [self _view];
}

-(BOOL)_handlesTouches
{
	return YES;
}

-(UIWindow*)_appwindow
{
	return [[TitaniumApp app] window];
}

-(UIViewController*)_controller
{
	if (controller == nil)
	{
		controller = [[TiViewController alloc] initWithViewProxy:self];
	}
	return controller;
}

-(UIView*)_view
{
	return view;
}
		
-(BOOL)_draggable
{
	return YES;
}

-(void)_setWindow:(TiView*)window_
{
	// don't retain
	window = window_;
}

-(void)_setParent:(TiView*)parent_
{
	// don't retain
	parent=parent_;
}

-(TiView*)window
{
	// since we don't retain, make sure we give it retained and
	// autorelease automatically
	return [[window retain] autorelease];
}

-(void)_handleNextItemInAnimationQueue
{
	id action = nil;
	BOOL doAnimation = NO;
	
	RELEASE_TO_NIL(animation);
	
	@synchronized(self)
	{
		if (animationQueue!=nil)
		{
			// we have at least one pending, we go ahead and execute it
			if ([animationQueue count]>0)
			{
				action = [animationQueue objectAtIndex:0];
				[[action retain] autorelease]; // hold while we're executing it
				[animationQueue removeObjectAtIndex:0];
				if (![action isKindOfClass:[TiAction class]])
				{
					doAnimation = YES;
				}
				else 
				{
					animating = NO;
				}
			}
			else 
			{
				// clear it out and release memory (we create again on demand)
				[animationQueue release];
				animationQueue = nil;
				animating = NO;
			}
		}
		else 
		{
			animating = NO;
		}
	}
	
	if (action!=nil)
	{
		if (doAnimation == NO)
		{
			[action execute];
			// process the next item in the queue if an action
			[self _handleNextItemInAnimationQueue];
		}
		else 
		{
			// this must be an animation action in which case we 
			// simply call animate and let it deal with the data
			[self animate:action];
		}
	}
}

-(void)_animationCompleted:(id)receiver
{
	RELEASE_TO_NIL(animation);
	
	// now check to see if we have an animation in the queue pending
	[self _handleNextItemInAnimationQueue];
}

-(BOOL)_filterMethod:(NSString*)name
{
	if ([name hasPrefix:@"touches"]) return NO;
	return [super _filterMethod:name];
}

-(BOOL)animationFromArgument:(id)args
{
	// should happen already in completed callback but in case it didn't complete or was implicitly cancelled
	RELEASE_TO_NIL(animation);
	animation = [[TiAnimation animationFromArg:args context:[self pageContext] create:NO] retain];
	return (animation!=nil);
}

#pragma mark Touch Delegate

// Touch delegation from TiViewContainer
-(void)singleTapAtPoint:(CGPoint)location view:(TiViewContainer*)view
{
	if ([self _hasListeners:@"singletap"])
	{
		NSDictionary *evt = [TiUtils pointToDictionary:location];
		[self fireEvent:@"singletap" withObject:evt];
	}
}

-(void)doubleTapAtPoint:(CGPoint)location view:(TiViewContainer*)view
{
	if ([self _hasListeners:@"doubletap"])
	{
		NSDictionary *evt = [TiUtils pointToDictionary:location];
		[self fireEvent:@"doubletap" withObject:evt];
	}
}

-(void)twoFingerTapAtPoint:(CGPoint)location view:(TiViewContainer*)view
{
	if ([self _hasListeners:@"twofingertap"])
	{
		NSDictionary *evt = [TiUtils pointToDictionary:location];
		[self fireEvent:@"twofingertap" withObject:evt];
	}
}

- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event 
{
	UITouch *touch = [touches anyObject];
	if (view != [touch view]) return;
	if ([self _hasListeners:@"touchstart"])
	{
		CGPoint point = [touch locationInView:[view superview]];
		NSDictionary *evt = [TiUtils pointToDictionary:point];
		[self fireEvent:@"touchstart" withObject:evt];
	}
	if ([self _hasListeners:@"click"] && [touch tapCount] == 1)
	{
		// single click
		[self fireEvent:@"click" withObject:self];
	}
	if ([self _hasListeners:@"dblclick"] && [touch tapCount] == 2)
	{
		// double click
		[self fireEvent:@"dblclick" withObject:self];
	}
}

- (void)touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event 
{
	UITouch *touch = [touches anyObject];
	if (view != [touch view]) return;
	if ([self _hasListeners:@"touchmove"])
	{
		CGPoint point = [touch locationInView:[view superview]];
		NSDictionary *evt = [TiUtils pointToDictionary:point];
		[self fireEvent:@"touchmove" withObject:evt];
	}
}

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event 
{
	UITouch *touch = [touches anyObject];
	if (view != [touch view]) return;
	if ([self _hasListeners:@"touchend"])
	{
		CGPoint point = [touch locationInView:[view superview]];
		NSDictionary *evt = [TiUtils pointToDictionary:point];
		[self fireEvent:@"touchend" withObject:evt];
	}
}

- (void)touchesCancelled:(NSSet *)touches withEvent:(UIEvent *)event 
{
	UITouch *touch = [touches anyObject];
	if (view != [touch view]) return;
	if ([self _hasListeners:@"touchcancel"])
	{
		CGPoint point = [touch locationInView:[view superview]];
		NSDictionary *evt = [TiUtils pointToDictionary:point];
		[self fireEvent:@"touchcancel" withObject:evt];
	}
}

#pragma mark Positional stuff

-(void)_insertIntoView:(UIView *)newSuperView bounds:(CGRect)newBounds;
{
	if (newSuperView == [self _view])
	{
		[self throwException:@"superview and subview are the same!" subreason:nil location:CODELOCATION];
	}
	ApplyConstraintToViewWithinViewWithBounds(&layout, [self _view], newSuperView, newBounds,YES);
}

-(void)_childAdded:(TiView*)child
{
	// for subclasses
}

-(void)_childRemoved:(TiView*)child
{
	// for subclasses
}

-(LayoutConstraint*)_layoutConstraints
{
	return &layout;
}

//Call when frame is changed.
-(void)_setNeedsRepositioning 
{
	@synchronized(self)
	{
		if (needsRepositioning)return;
		needsRepositioning = YES;
	}
	[self performSelectorOnMainThread:@selector(_performReposition) withObject:nil waitUntilDone:NO];
}

//Call only in main thread, when you want to do reposition.
-(void)_performReposition 
{
	[self _doReposition];
	@synchronized(self)
	{
		needsRepositioning = NO;
	}
}

// Override in subclasses but call super.
-(void)_doReposition 
{
	UIView * ourSuperview = [view superview];
	if (ourSuperview==nil)
	{
		NSLog(@"[WARN] attempt to reposition a view that is not attached to the application (%@)",self);
		return;
	}
	ApplyConstraintToViewWithinViewWithBounds(&layout, view, ourSuperview, [ourSuperview bounds],YES);
	@synchronized(self)
	{
		needsRepositioning=NO;
	}
}


-(void)_setNeedsUpdating
{
	@synchronized(self)
	{
		if (needsUpdating)return;
		needsUpdating = YES;
	}
	[self performSelectorOnMainThread:@selector(_performUpdate) withObject:nil waitUntilDone:NO];
}

-(void)_performUpdate
{
	if (!needsUpdating)return; //Fast check before we lock.
	@synchronized(self)
	{
		if (!needsUpdating)return;
		[self _doUpdate];
		needsUpdating = NO;
	}
}

-(void)_doUpdate
{
}

-(int)_zIndex
{
	return zIndex;
}


-(void)_performZIndexRepositioning
{
	// if we don't have any children, or we only have 1, we 
	// don't need to worry about layers
	if (proxies==nil || [proxies count]<=1) return;
	
	// sort by zindex
	NSArray *children = [[NSArray arrayWithArray:proxies] sortedArrayUsingFunction:zIndexSort context:NULL];
	
	// re-configure all the views by zindex order
	for (TiView *child in children)
	{
		UIView *v = [child _view];
		[v removeFromSuperview];
		[view addSubview:v];
	}
}

-(void)_repositionZIndex
{
	// tell our parent that our zOrder needs updating in its heirarchy
	if (parent!=nil)
	{
		[parent _performZIndexRepositioning];
	}
}


#pragma mark Public

-(void)add:(NSArray*)args
{
	ENSURE_UI_THREAD(add,args);
	if (proxies==nil)
	{
		proxies = [[NSMutableArray alloc] init];
	}
	TiView *proxy = [args objectAtIndex:0];
	ENSURE_TYPE(proxy,TiView);
	[proxies addObject:proxy];
	[proxy _insertIntoView:view bounds:[view bounds]];
	[self _childAdded:proxy];
	[proxy _setParent:self];
	[self _performZIndexRepositioning];
}

-(void)remove:(NSArray*)args
{
	ENSURE_UI_THREAD(remove,args);
	TiView *proxy = [args objectAtIndex:0];
	ENSURE_TYPE(proxy,TiView);
	UIView *child = [proxy _view];
	if (child!=nil)
	{
		[child removeFromSuperview];
	}
	[self _childRemoved:proxy];
	[proxy _setParent:nil];
	if (proxies!=nil)
	{
		[proxies removeObject:proxy];
		if ([proxies count]==0)
		{
			RELEASE_TO_NIL(proxies);
		}
	}
}

-(void)animate:(NSArray*)args
{
	// we have to use some special logic vs. our normal ENSURE_UI_THREAD macro
	// here given synchronization and setting of some flags that needs to happen
	// in our synchronized block
	
	if (![NSThread isMainThread])
	{
		@synchronized(self)
		{
			if (animating)
			{
				if (animationQueue==nil)
				{
					animationQueue = [[NSMutableArray alloc] init];
				}
				[animationQueue addObject:args];
			}
			else 
			{
				animating = YES;
				[self performSelectorOnMainThread:@selector(animate:) withObject:args waitUntilDone:NO];
			}
			return;
		}
	}
	else 
	{
		animating = YES;
	}
	
	// perform animation
	if ([self animationFromArgument:args])
	{
		[animation animate:self];
	}
}

-(void)setZIndex:(id)z
{
	ENSURE_SINGLE_ARG(z,NSNumber);
	UI_ENSURE_AFTER_ANIMATION(setZIndex,z);
	if ([z intValue]!=zIndex)
	{
		zIndex = [z intValue];
		[self _repositionZIndex];
	}
}

BEGIN_UI_THREAD_PROTECTED_VALUE(zIndex,NSNumber)
	result = [NSNumber numberWithInt:zIndex];
END_UI_THREAD_PROTECTED_VALUE(zIndex) 

/* FIXME
SYNTHESIZE_DIMENSION(top,setTop,layout.top)
SYNTHESIZE_DIMENSION(bottom,setBottom,layout.bottom)
SYNTHESIZE_DIMENSION(left,setLeft,layout.left)
SYNTHESIZE_DIMENSION(right,setRight,layout.right)
SYNTHESIZE_DIMENSION(width,setWidth,layout.width)
SYNTHESIZE_DIMENSION(height,setHeight,layout.height)
*/

-(void)setOpaque:(id)opaque
{
	ENSURE_SINGLE_ARG(opaque,NSNumber);
	UI_ENSURE_AFTER_ANIMATION(setOpaque,opaque);
	view.opaque = [opaque boolValue];
}

BEGIN_UI_THREAD_PROTECTED_VALUE(opaque,NSNumber)
	result = [NSNumber numberWithBool:view.opaque];
END_UI_THREAD_PROTECTED_VALUE(opaque)

-(void)setOpacity:(id)opacity
{
	ENSURE_SINGLE_ARG(opacity,NSNumber);
	UI_ENSURE_AFTER_ANIMATION(setOpacity,opacity);
	view.alpha = [opacity floatValue];
}

BEGIN_UI_THREAD_PROTECTED_VALUE(opacity,NSNumber)
	result = [NSNumber numberWithFloat:view.alpha];
END_UI_THREAD_PROTECTED_VALUE(opacity)

-(void)setBgColor:(id)color
{
	ENSURE_SINGLE_ARG(color,NSString);
	UI_ENSURE_AFTER_ANIMATION(setBgColor,color);
	[bgColor release];
	bgColor = [[TiColor colorNamed:color] retain];
	view.backgroundColor = [bgColor _color];
}

BEGIN_UI_THREAD_PROTECTED_VALUE(bgColor,NSObject)
	result = bgColor;
END_UI_THREAD_PROTECTED_VALUE(bgColor)

BEGIN_UI_THREAD_PROTECTED_VALUE(visible,NSNumber)
	result = [NSNumber numberWithBool:![self _view].hidden];
END_UI_THREAD_PROTECTED_VALUE(visible)

BEGIN_UI_THREAD_PROTECTED_VALUE(borderColor,NSObject)
	result = brdColor;
END_UI_THREAD_PROTECTED_VALUE(borderColor)

-(void)setBorderColor:(id)bc
{
	ENSURE_SINGLE_ARG(bc,NSString);
	UI_ENSURE_AFTER_ANIMATION(setBorderColor,bc);
	[brdColor release];
	brdColor = [[TiColor colorNamed:bc] retain];
	view.layer.borderColor = [brdColor _color].CGColor;
}

BEGIN_UI_THREAD_PROTECTED_VALUE(borderWidth,NSNumber)
	result = [NSNumber numberWithFloat:view.layer.borderWidth];
END_UI_THREAD_PROTECTED_VALUE(borderWidth)

-(void)setBorderWidth:(id)width
{
	ENSURE_SINGLE_ARG(width,NSNumber);
	UI_ENSURE_AFTER_ANIMATION(setBorderWidth,width);
	view.layer.borderWidth = [width floatValue];
}

BEGIN_UI_THREAD_PROTECTED_VALUE(borderRadius,NSNumber)
	result = [NSNumber numberWithFloat:view.layer.cornerRadius];
END_UI_THREAD_PROTECTED_VALUE(borderRadius)


-(void)setBorderRadius:(id)radius
{
	ENSURE_SINGLE_ARG(radius,NSNumber);
	UI_ENSURE_AFTER_ANIMATION(setBorderRadius,radius);
	view.layer.cornerRadius = [radius floatValue];
}

BEGIN_UI_THREAD_PROTECTED_VALUE(anchorPoint,TiPoint)
	result = [[[TiPoint alloc] _initWithPageContext:[self pageContext]] autorelease];
	result.point = view.layer.anchorPoint;
END_UI_THREAD_PROTECTED_VALUE(anchorPoint)

-(void)setAnchorPoint:(id)p
{
	UI_ENSURE_AFTER_ANIMATION(setAnchorPoint,p);
	if ([p isKindOfClass:[NSArray class]])
	{
		view.layer.anchorPoint = CGPointMake([[p objectAtIndex:0] floatValue], [[p objectAtIndex:1] floatValue]);
	}
	else
	{
		view.layer.anchorPoint = [TiUtils pointValue:p];
	}
}

BEGIN_UI_THREAD_PROTECTED_VALUE(center,TiPoint)
	result = [[[TiPoint alloc] _initWithPageContext:[self pageContext]] autorelease];
	result.point = view.center;
END_UI_THREAD_PROTECTED_VALUE(center)


-(void)setCenter:(id)p
{
	UI_ENSURE_AFTER_ANIMATION(setCenter,p);
	if ([p isKindOfClass:[NSArray class]])
	{
		view.center = CGPointMake([[p objectAtIndex:0] floatValue], [[p objectAtIndex:1] floatValue]);
	}
	else
	{
		view.center = [TiUtils pointValue:p];
	}
}

-(void)setVisible:(NSNumber *)visible
{
	UI_ENSURE_AFTER_ANIMATION(setVisible,visible);
	[self _view].hidden = [TiUtils boolValue:visible] == NO;
}

-(void)show:(NSArray *)args
{
	UI_ENSURE_AFTER_ANIMATION(show,args);
	
	if ([self animationFromArgument:args])
	{
		TiAction *action = [[TiAction alloc] initWithTarget:[self _view] selector:@selector(setHidden:) arg:[NSNumber numberWithBool:NO]];
		[self _queueAfterAnimationAction:action];
		[action release];
		[animation animate:self];
	}
	else 
	{
		[self _view].hidden = NO;
	}
}

-(void)hide:(NSArray *)args
{
	UI_ENSURE_AFTER_ANIMATION(hide,args);
	
	if ([self animationFromArgument:args])
	{
		TiAction *action = [[TiAction alloc] initWithTarget:[self _view] selector:@selector(setHidden:) arg:[NSNumber numberWithBool:YES]];
		[self _queueAfterAnimationAction:action];
		[action release];
		[animation animate:self];
	}
	else 
	{
		[self _view].hidden = YES;
	}
}

-(void)setTransform:(id)t
{
	ENSURE_SINGLE_ARG(t,TiProxy);
	UI_ENSURE_AFTER_ANIMATION(setTransform,t);
	[transform release];
	transform = [t retain];
	if ([transform isKindOfClass:[Ti2DMatrix class]])
	{
		view.transform = [(Ti2DMatrix*)transform matrix];
	}
	else 
	{
		view.layer.transform = [(Ti3DMatrix*)transform matrix];
	}
}

BEGIN_UI_THREAD_PROTECTED_VALUE(transform,TiProxy)
	result = transform;
END_UI_THREAD_PROTECTED_VALUE(transform)


@end
