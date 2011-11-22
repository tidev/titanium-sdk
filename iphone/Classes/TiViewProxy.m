/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiViewProxy.h"
#import "LayoutConstraint.h"
#import "TiApp.h"
#import "TiBlob.h"
#import "TiRect.h"
#import "TiLayoutQueue.h"
#import "TiAction.h"
#import "TiStylesheet.h"
#import "TiLocale.h"
#import "TiUIView.h"

#import <QuartzCore/QuartzCore.h>
#import <libkern/OSAtomic.h>
#import <pthread.h>


#define IGNORE_IF_NOT_OPENED if (!windowOpened||[self viewAttached]==NO) return;

@implementation TiViewProxy

#pragma mark public API

@synthesize zIndex, parentVisible;
-(void)setZIndex:(int)newZindex
{
	if(newZindex == zIndex)
	{
		return;
	}

	zIndex = newZindex;
	[self replaceValue:NUMINT(zIndex) forKey:@"zIndex" notification:NO];
	[self willChangeZIndex];
}

@synthesize children;
-(NSArray*)children
{
	pthread_rwlock_rdlock(&childrenLock);
	if (windowOpened==NO && children==nil && pendingAdds!=nil)
	{
		NSArray *copy = [pendingAdds mutableCopy];
		pthread_rwlock_unlock(&childrenLock);
		return [copy autorelease];
	}
	pthread_rwlock_unlock(&childrenLock);
	return children;
}

-(void)setVisible:(NSNumber *)newVisible withObject:(id)args
{
	[self setHidden:![TiUtils boolValue:newVisible def:YES] withArgs:args];
	[self replaceValue:newVisible forKey:@"visible" notification:YES];
}


-(TiPoint*)center
{
	return [[[TiPoint alloc] initWithPoint:[self view].center] autorelease];
}

-(void)add:(id)arg
{
	// allow either an array of arrays or an array of single proxy
	if ([arg isKindOfClass:[NSArray class]])
	{
		for (id a in arg)
		{
			[self add:a];
		}
		return;
	}
	
	if ([NSThread isMainThread])
	{
		pthread_rwlock_wrlock(&childrenLock);
		if (children==nil)
		{
			children = [[NSMutableArray alloc] initWithObjects:arg,nil];
		}		
		else 
		{
			[children addObject:arg];
		}
		pthread_rwlock_unlock(&childrenLock);
		[arg setParent:self];
		[self contentsWillChange];
		if(parentVisible && !hidden)
		{
			[arg parentWillShow];
		}
		
		// only call layout if the view is attached
		[self layoutChild:arg optimize:NO]; 
	}
	else
	{
		[self rememberProxy:arg];
		if (windowOpened)
		{
			[self performSelectorOnMainThread:@selector(add:) withObject:arg waitUntilDone:NO];
			return;
		}
		pthread_rwlock_wrlock(&childrenLock);
		if (pendingAdds==nil)
		{
			pendingAdds = [[NSMutableArray arrayWithObject:arg] retain];
		}
		else 
		{
			[pendingAdds addObject:arg];
		}
		pthread_rwlock_unlock(&childrenLock);
		[arg setParent:self];
	}
}

-(void)remove:(id)arg
{
	ENSURE_SINGLE_ARG(arg,TiViewProxy);
	ENSURE_UI_THREAD_1_ARG(arg);

	pthread_rwlock_wrlock(&childrenLock);
	if ([children containsObject:arg])
	{
		[children removeObject:arg];
	}
	else if ([pendingAdds containsObject:arg])
	{
		[pendingAdds removeObject:arg];
	}
	else
	{
		pthread_rwlock_unlock(&childrenLock);
		NSLog(@"[WARN] called remove for %@ on %@, but %@ isn't a child or has already been removed",arg,self,arg);
		return;
	}

	[self contentsWillChange];
	if(parentVisible && !hidden)
	{
		[arg parentWillHide];
	}

	if ([children count]==0)
	{
		RELEASE_TO_NIL(children);
	}
	pthread_rwlock_unlock(&childrenLock);
		
	[arg setParent:nil];
	
	if (view!=nil)
	{
		TiUIView *childView = [(TiViewProxy *)arg view];
		BOOL layoutNeedsRearranging = !TiLayoutRuleIsAbsolute(layoutProperties.layoutStyle);
		if ([NSThread isMainThread])
		{
			[childView removeFromSuperview];
			if (layoutNeedsRearranging)
			{
				[self layoutChildren:NO];
			}
		}
		else
		{
			[childView performSelectorOnMainThread:@selector(removeFromSuperview) withObject:nil waitUntilDone:NO];
			if (layoutNeedsRearranging)
			{
				[self performSelectorOnMainThread:@selector(relayout) withObject:nil waitUntilDone:NO modes:[NSArray arrayWithObject:NSRunLoopCommonModes]];
			}
		}
	}
	//Yes, we're being really lazy about letting this go. This is intentional.
	[self forgetProxy:arg];
}

-(void)show:(id)arg
{
	[self setHidden:NO withArgs:arg];
	[self replaceValue:NUMBOOL(YES) forKey:@"visible" notification:YES];
}
 
-(void)hide:(id)arg
{
	[self setHidden:YES withArgs:arg];
	[self replaceValue:NUMBOOL(NO) forKey:@"visible" notification:YES];
}

-(void)animate:(id)arg
{
	TiAnimation * newAnimation = [TiAnimation animationFromArg:arg context:[self executionContext] create:NO];
	[self rememberProxy:newAnimation];
	[self performSelectorOnMainThread:@selector(animateOnUIThread:) withObject:newAnimation waitUntilDone:NO];
}

-(void)animateOnUIThread:(TiAnimation *)newAnimation
{
	[parent contentsWillChange];
	if ([view superview]==nil)
	{
		VerboseLog(@"Entering animation without a superview Parent is %@, props are %@",parent,dynprops);
		[parent childWillResize:self];
	}
	[self windowWillOpen]; // we need to manually attach the window if you're animating
	[parent layoutChildrenIfNeeded];
	[[self view] animate:newAnimation];
}

-(void)setAnimation:(id)arg
{	//We don't actually store the animation this way.
	//Because the setter doesn't have the argument array, we will be passing a nonarray to animate:
	//In this RARE case, this is okay, because TiAnimation animationFromArg handles with or without array.
	[self animate:arg];
}

#define LAYOUTPROPERTIES_SETTER(methodName,layoutName,converter,postaction)	\
-(void)methodName:(id)value	\
{	\
	layoutProperties.layoutName = converter(value);	\
	[self replaceValue:value forKey:@#layoutName notification:YES];	\
	postaction; \
}

LAYOUTPROPERTIES_SETTER(setTop,top,TiDimensionFromObject,[self willChangePosition])
LAYOUTPROPERTIES_SETTER(setBottom,bottom,TiDimensionFromObject,[self willChangePosition])

LAYOUTPROPERTIES_SETTER(setLeft,left,TiDimensionFromObject,[self willChangePosition])
LAYOUTPROPERTIES_SETTER(setRight,right,TiDimensionFromObject,[self willChangePosition])

LAYOUTPROPERTIES_SETTER(setWidth,width,TiDimensionFromObject,[self willChangeSize])
LAYOUTPROPERTIES_SETTER(setHeight,height,TiDimensionFromObject,[self willChangeSize])

// See below for how we handle setLayout
//LAYOUTPROPERTIES_SETTER(setLayout,layoutStyle,TiLayoutRuleFromObject,[self willChangeLayout])

LAYOUTPROPERTIES_SETTER(setMinWidth,minimumWidth,TiFixedValueRuleFromObject,[self willChangeSize])
LAYOUTPROPERTIES_SETTER(setMinHeight,minimumHeight,TiFixedValueRuleFromObject,[self willChangeSize])

// Special handling to try and avoid Apple's detection of private API 'layout'
-(void)setValue:(id)value forUndefinedKey:(NSString *)key
{
    if ([key isEqualToString:[@"lay" stringByAppendingString:@"out"]]) {
        layoutProperties.layoutStyle = TiLayoutRuleFromObject(value);
        [self replaceValue:value forKey:[@"lay" stringByAppendingString:@"out"] notification:YES];
        [self willChangeLayout];
        return;
    }
    [super setValue:value forUndefinedKey:key];
}

-(TiRect*)size
{
	TiRect *rect = [[[TiRect alloc] init] autorelease];
	[self makeViewPerformSelector:@selector(fillBoundsToRect:) withObject:rect createIfNeeded:YES waitUntilDone:YES];
	return rect;
}

-(id)width
{
	CGFloat value = [TiUtils floatValue:[self valueForUndefinedKey:@"width"] def:0];
	if (value!=0) return NUMFLOAT(value);
	return [self size].width;
}

-(id)height
{
	CGFloat value = [TiUtils floatValue:[self valueForUndefinedKey:@"height"] def:0];
	if (value!=0) return NUMFLOAT(value);
	return [self size].height;
}

-(void)setSize:(id)value
{
	ENSURE_DICT(value);
	layoutProperties.width = TiDimensionFromObject([value objectForKey:@"width"]);
 	layoutProperties.height = TiDimensionFromObject([value objectForKey:@"height"]);
	[self willChangeSize];
}

-(void)setCenter:(id)value
{
	if ([value isKindOfClass:[NSDictionary class]])
	{
		layoutProperties.centerX = TiDimensionFromObject([value objectForKey:@"x"]);
		layoutProperties.centerY = TiDimensionFromObject([value objectForKey:@"y"]);
	} else if ([value isKindOfClass:[TiPoint class]]) {
        CGPoint p = [value point];
		layoutProperties.centerX = TiDimensionPixels(p.x);
		layoutProperties.centerY = TiDimensionPixels(p.y);
    } else {
		layoutProperties.centerX = TiDimensionUndefined;
		layoutProperties.centerY = TiDimensionUndefined;
	}

	[self willChangePosition];
}

-(id)animatedCenter
{
	if (![self viewAttached])
	{
		return nil;
	}
	NSMutableDictionary * result = [NSMutableDictionary dictionary];
	[self performSelectorOnMainThread:@selector(getAnimatedCenterPoint:) withObject:result waitUntilDone:YES];

	return result;
}

-(void)setBackgroundGradient:(id)arg
{
	TiGradient * newGradient = [TiGradient gradientFromObject:arg proxy:self];
	[self replaceValue:newGradient forKey:@"backgroundGradient" notification:YES];
}

-(TiBlob*)toImage:(id)args
{
	KrollCallback *callback = [args count] > 0 ? [args objectAtIndex:0] : nil;
	TiBlob *blob = [[[TiBlob alloc] init] autorelease];
	// we spin on the UI thread and have him convert and then add back to the blob
	// if you pass a callback function, we'll run the render asynchronously, if you
	// don't, we'll do it synchronously
	[self performSelectorOnMainThread:@selector(addImageToBlob:) withObject:[NSArray arrayWithObjects:blob,callback,nil] waitUntilDone:callback==nil ? YES : NO];
	return blob;
}

-(TiPoint*)convertPointToView:(id)args
{
    id arg1 = nil;
    TiViewProxy* arg2 = nil;
    ENSURE_ARG_AT_INDEX(arg1, args, 0, NSObject);
    ENSURE_ARG_AT_INDEX(arg2, args, 1, TiViewProxy);
    BOOL validPoint;
    CGPoint oldPoint = [TiUtils pointValue:arg1 valid:&validPoint];
    if (!validPoint) {
        [self throwException:TiExceptionInvalidType subreason:@"Parameter is not convertable to a TiPoint" location:CODELOCATION];
    }
    
    __block BOOL validView = NO;
    __block CGPoint p;
    dispatch_sync(dispatch_get_main_queue(), ^{
        if ([self viewAttached] && self.view.window && [arg2 viewAttached] && arg2.view.window) {
            validView = YES;
            p = [self.view convertPoint:oldPoint toView:arg2.view];
        }
    });
    if (!validView) {
        return (TiPoint*)[NSNull null];
    }
    return [[[TiPoint alloc] initWithPoint:p] autorelease];
}

#pragma mark nonpublic accessors not related to Housecleaning

@synthesize parent, barButtonItem;

-(void)setParent:(TiViewProxy*)parent_
{
	parent = parent_;
	
	if (parent_!=nil && [parent windowHasOpened])
	{
		[self windowWillOpen];
	}
}

-(LayoutConstraint *)layoutProperties
{
	return &layoutProperties;
}

@synthesize sandboxBounds;

-(void)setHidden:(BOOL)newHidden withArgs:(id)args
{
	if(hidden == newHidden)
	{
		return;
	}
	hidden = newHidden;
	
	//TODO: If we have an animated show, hide, or setVisible, here's the spot for it.
	
	if(parentVisible)
	{
		if (hidden)
		{
			[self willHide];
		}
		else
		{
			[self willShow];
		}
	}
}

-(CGFloat)autoWidthForWidth:(CGFloat)suggestedWidth
{
	BOOL isHorizontal = TiLayoutRuleIsHorizontal(layoutProperties.layoutStyle);
	CGFloat result = 0.0;
	
	pthread_rwlock_rdlock(&childrenLock);
	for (TiViewProxy * thisChildProxy in self.children)
	{
		CGFloat thisWidth = [thisChildProxy minimumParentWidthForWidth:suggestedWidth];
		if (isHorizontal)
		{
			result += thisWidth;
		}
		else if(result<thisWidth)
		{
			result = thisWidth;
		}
	}
	pthread_rwlock_unlock(&childrenLock);

	if([self respondsToSelector:@selector(verifyWidth:)])
	{
		result = [self verifyWidth:result];
	}

	if (result == 0)
	{
		NSLog(@"[WARN] %@ has an auto width value of 0, meaning this view may not be visible.",self);
	}
	if (suggestedWidth == 0.0)
	{
		return result;
	}
	return MIN(suggestedWidth,result);
}

-(CGFloat)autoHeightForWidth:(CGFloat)width
{
	BOOL isVertical = TiLayoutRuleIsVertical(layoutProperties.layoutStyle);
	BOOL isHorizontal = TiLayoutRuleIsHorizontal(layoutProperties.layoutStyle);
	CGFloat result=0.0;

	//Autoheight with a set autoheight for width gets complicated.
	CGFloat widthLeft=width;
	CGFloat currentRowHeight = 0.0;

	pthread_rwlock_rdlock(&childrenLock);
	NSArray* array = windowOpened ? children : pendingAdds;
	
	for (TiViewProxy * thisChildProxy in array)
	{
		if (isHorizontal)
		{
			CGFloat requestedWidth = [thisChildProxy minimumParentWidthForWidth:widthLeft];
			if (requestedWidth > widthLeft) //Wrap around!
			{
				result += currentRowHeight;
				currentRowHeight = 0.0;
				widthLeft = width;
			}
			widthLeft -= requestedWidth;
			CGFloat thisHeight = [thisChildProxy minimumParentHeightForWidth:requestedWidth];
			if (thisHeight > currentRowHeight)
			{
				currentRowHeight = thisHeight;
			}
		}
		else
		{
			CGFloat thisHeight = [thisChildProxy minimumParentHeightForWidth:width];
			if (isVertical)
			{
				result += thisHeight;
			}
			else if(result<thisHeight)
			{
				result = thisHeight;
			}
		}
	}
	pthread_rwlock_unlock(&childrenLock);
	result += currentRowHeight;
	
	if([self respondsToSelector:@selector(verifyHeight:)])
	{
		result = [self verifyHeight:result];
	}
	
	if (result == 0)
	{
		NSLog(@"[WARN] %@ has an auto height value of 0, meaning this view may not be visible.",self);
	}
	return result;
}

-(CGFloat)minimumParentWidthForWidth:(CGFloat)suggestedWidth
{
	CGFloat result = TiDimensionCalculateValue(layoutProperties.left, 0)
			+ TiDimensionCalculateValue(layoutProperties.right, 0);
	if (TiDimensionIsPixels(layoutProperties.width))
	{
		result += layoutProperties.width.value;
	}
	else if(TiDimensionIsAuto(layoutProperties.width))
	{
		result += [self autoWidthForWidth:suggestedWidth - result];
	}
	return result;
}

-(CGFloat)minimumParentHeightForWidth:(CGFloat)suggestedWidth
{
	CGFloat result = TiDimensionCalculateValue(layoutProperties.top, 0)
			+ TiDimensionCalculateValue(layoutProperties.bottom, 0);

	if (TiDimensionIsPixels(layoutProperties.height))
	{
		result += layoutProperties.height.value;
	}
	else if(TiDimensionIsAuto(layoutProperties.height))
	{
		if (TiDimensionIsPixels(layoutProperties.width))
		{
			suggestedWidth = layoutProperties.width.value;
		}
		else
		{
			suggestedWidth = TiDimensionCalculateMargins(layoutProperties.left, layoutProperties.right, suggestedWidth);
		}
		result += [self autoHeightForWidth:suggestedWidth];
	}
	return result;
}



-(UIBarButtonItem*)barButtonItem
{
	if (barButtonItem == nil)
	{
		isUsingBarButtonItem = YES;
		barButtonItem = [[UIBarButtonItem alloc] initWithCustomView:[self barButtonViewForSize:CGSizeZero]];
	}
	return barButtonItem;
}

- (TiUIView *)barButtonViewForSize:(CGSize)bounds
{
	TiUIView * barButtonView = [self view];
	//TODO: This logic should have a good place in case that refreshLayout is used.
	LayoutConstraint barButtonLayout = layoutProperties;
	if (TiDimensionIsUndefined(barButtonLayout.width))
	{
		barButtonLayout.width = TiDimensionAuto;
	}
	if (TiDimensionIsUndefined(barButtonLayout.height))
	{
		barButtonLayout.height = TiDimensionAuto;
	}
	CGRect barBounds;
	barBounds.origin = CGPointZero;
	barBounds.size = SizeConstraintViewWithSizeAddingResizing(&barButtonLayout, self, bounds, NULL);
	
	[TiUtils setView:barButtonView positionRect:barBounds];
	[barButtonView setAutoresizingMask:UIViewAutoresizingNone];
	
	return barButtonView;
}

#pragma mark Recognizers

-(void)recognizedPinch:(UIPinchGestureRecognizer*)recognizer 
{ 
    NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:
                           NUMDOUBLE(recognizer.scale), @"scale", 
                           NUMDOUBLE(recognizer.velocity), @"velocity", 
                           nil]; 
    [self fireEvent:@"pinch" withObject:event]; 
}

-(void)recognizedLongPress:(UILongPressGestureRecognizer*)recognizer 
{ 
    if ([recognizer state] == UIGestureRecognizerStateBegan) {
        CGPoint p = [recognizer locationInView:self.view];
        NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:
                               NUMFLOAT(p.x), @"x",
                               NUMFLOAT(p.y), @"y",
                               nil];
        [self fireEvent:@"longpress" withObject:event]; 
    }
}

-(TiUIView*)view
{
	if (view == nil)
	{
		WARN_IF_BACKGROUND_THREAD_OBJ
#ifdef VERBOSE
		if(![NSThread isMainThread])
		{
			NSLog(@"[WARN] Break here");
		}
#endif		
		// on open we need to create a new view
		[self viewWillAttach];
		view = [self newView];

        // check listeners dictionary to see if we need gesture recognizers
        if ([self _hasListeners:@"pinch"]) {
            UIPinchGestureRecognizer* r = [[UIPinchGestureRecognizer alloc] initWithTarget:self action:@selector(recognizedPinch:)];
            [view addGestureRecognizer:r];
            [r release];
        }
        if ([self _hasListeners:@"longpress"]) {
            UILongPressGestureRecognizer* r = [[UILongPressGestureRecognizer alloc] initWithTarget:self action:@selector(recognizedLongPress:)];
            [view addGestureRecognizer:r];
            [r release];
        }
        
		view.proxy = self;
		view.layer.transform = CATransform3DIdentity;
		view.transform = CGAffineTransformIdentity;

		[view initializeState];

		// fire property changes for all properties to our delegate
		[self firePropertyChanges];

		[view configurationSet];

		pthread_rwlock_rdlock(&childrenLock);
		NSArray * childrenArray = [[self children] copy];
		pthread_rwlock_unlock(&childrenLock);
		
		for (id child in childrenArray)
		{
			TiUIView *childView = [(TiViewProxy*)child view];
			[self insertSubview:childView forProxy:child];
		}
		
		[childrenArray release];
		[self viewDidAttach];

		// make sure we do a layout of ourselves
		if(CGRectIsEmpty(sandboxBounds) && (view != nil)){
			[self setSandboxBounds:view.bounds];
		}
		[self relayout];
		viewInitialized = YES;
	}

	CGRect bounds = [view bounds];
	if (!CGPointEqualToPoint(bounds.origin, CGPointZero))
	{
		[view setBounds:CGRectMake(0, 0, bounds.size.width, bounds.size.height)];
	}
	
	return view;
}

//CAUTION: TO BE USED ONLY WITH TABLEVIEW MAGIC
-(void)setView:(TiUIView *)newView
{
	if (view != newView) {
		[view removeFromSuperview];
		[view release];
		view = [newView retain];
	}
	
	if (self.modelDelegate != newView) {
		if (self.modelDelegate!=nil && [self.modelDelegate respondsToSelector:@selector(detachProxy)])
		{
			[self.modelDelegate detachProxy];
			self.modelDelegate=nil;
		}
		self.modelDelegate = newView;
	}
}

-(NSMutableDictionary*)langConversionTable
{
    return nil;
}

#pragma mark Methods subclasses should override for behavior changes

-(BOOL)suppressesRelayout
{
	return NO;
}

-(BOOL)supportsNavBarPositioning
{
	return YES;
}

// TODO: Re-evaluate this along with the other controller propagation mechanisms, post 1.3.0.
// Returns YES for anything that can have a UIController object in its parent view
-(BOOL)canHaveControllerParent
{
	return YES;
}

-(BOOL)shouldDetachViewOnUnload
{
	return YES;
}

-(UIView *)parentViewForChild:(TiViewProxy *)child
{
	return view;
}

#pragma mark Event trigger methods

-(void)windowWillOpen
{
	//TODO: This should be properly handled and moved, but for now, let's force it (Redundantly, I know.)
	if (parent != nil) {
		[self parentWillShow];
	}

	pthread_rwlock_rdlock(&childrenLock);
	
	// this method is called just before the top level window
	// that this proxy is part of will open and is ready for
	// the views to be attached
	
	if (windowOpened==YES)
	{
		pthread_rwlock_unlock(&childrenLock);
		return;
	}
	
	windowOpened = YES;
	windowOpening = YES;
	
	// If the window was previously opened, it may need to have
	// its existing children redrawn
	if (children != nil) {
		for (TiViewProxy* child in children) {
			[self layoutChild:child optimize:NO];
			[child windowWillOpen];
		}
	}
	
	pthread_rwlock_unlock(&childrenLock);
	
	if (pendingAdds!=nil)
	{
		for (id child in pendingAdds)
		{
			[self add:child];
			[child windowWillOpen];
		}
		RELEASE_TO_NIL(pendingAdds);
	}
}

-(void)windowDidOpen
{
	windowOpening = NO;
	pthread_rwlock_rdlock(&childrenLock);
	for (TiViewProxy *child in children)
	{
		[child windowDidOpen];
	}
	pthread_rwlock_unlock(&childrenLock);
}

-(void)windowWillClose
{
	pthread_rwlock_rdlock(&childrenLock);
	[children makeObjectsPerformSelector:@selector(windowWillClose)];
	pthread_rwlock_unlock(&childrenLock);
}

-(void)windowDidClose
{
	pthread_rwlock_rdlock(&childrenLock);
	for (TiViewProxy *child in children)
	{
		[child windowDidClose];
	}
	pthread_rwlock_unlock(&childrenLock);
	[self detachView];
	windowOpened=NO;
}


-(void)willFirePropertyChanges
{
	// for subclasses
	if ([view respondsToSelector:@selector(willFirePropertyChanges)])
	{
		[view performSelector:@selector(willFirePropertyChanges)];
	}
}

-(void)didFirePropertyChanges
{
	// for subclasses
	if ([view respondsToSelector:@selector(didFirePropertyChanges)])
	{
		[view performSelector:@selector(didFirePropertyChanges)];
	}
}

-(void)viewWillAttach
{
	// for subclasses
}


-(void)viewDidAttach
{
	// for subclasses
}

-(void)viewWillDetach
{
	// for subclasses
}

-(void)viewDidDetach
{
	// for subclasses
}


#pragma mark Housecleaning state accessors

-(BOOL)viewHasSuperview:(UIView *)superview
{
	return [(UIView *)view superview] == superview;
}

-(BOOL)viewAttached
{
	return view!=nil && windowOpened;
}

//TODO: When swapping about proxies, views are uninitialized, aren't they?
-(BOOL)viewInitialized
{
	return viewInitialized && (view != nil);
}

-(BOOL)viewReady
{
	return view!=nil && 
			CGRectIsEmpty(view.bounds)==NO && 
			CGRectIsNull(view.bounds)==NO &&
			[view superview] != nil;
}

-(BOOL)windowHasOpened
{
	return windowOpened;
}

-(BOOL)windowIsOpening
{
	return windowOpening;
}

- (BOOL) isUsingBarButtonItem
{
	return isUsingBarButtonItem;
}

-(CGRect)appFrame	//TODO: Why is this here? It doesn't have anything to do with a specific instance.
{
	CGRect result=[[UIScreen mainScreen] applicationFrame];
	switch ([[UIApplication sharedApplication] statusBarOrientation])
	{
		case UIInterfaceOrientationLandscapeLeft:
		case UIInterfaceOrientationLandscapeRight:
		{
			CGFloat leftMargin = result.origin.y;
			CGFloat topMargin = result.origin.x;
			CGFloat newHeight = result.size.width;
			CGFloat newWidth = result.size.height;
			result = CGRectMake(leftMargin, topMargin, newWidth, newHeight);
			break;
		}
		default: {
			break;
		}
	}
	return result;
}


#pragma mark Building up and Tearing down

-(id)init
{
	if ((self = [super init]))
	{
		destroyLock = [[NSRecursiveLock alloc] init];
		pthread_rwlock_init(&childrenLock, NULL);
	}
	return self;
}

-(void)_initWithProperties:(NSDictionary*)properties
{
	if (properties!=nil)
	{
		NSString *objectId = [properties objectForKey:@"id"];
		NSString* className = [properties objectForKey:@"className"];
		NSMutableArray* classNames = [properties objectForKey:@"classNames"];
		
		NSString *type = [NSStringFromClass([self class]) stringByReplacingOccurrencesOfString:@"TiUI" withString:@""];
		type = [[type stringByReplacingOccurrencesOfString:@"Proxy" withString:@""] lowercaseString];

		TiStylesheet *stylesheet = [[[self pageContext] host] stylesheet];
		NSString *basename = [[self pageContext] basename];
		NSString *density = [TiUtils isRetinaDisplay] ? @"high" : @"medium";

		if (objectId!=nil || className != nil || classNames != nil || [stylesheet basename:basename density:density hasTag:type])
		{
			// get classes from proxy
			NSString *className = [properties objectForKey:@"className"];
			NSMutableArray *classNames = [properties objectForKey:@"classNames"];
			if (classNames==nil)
			{
				classNames = [NSMutableArray arrayWithCapacity:1];
			}
			if (className!=nil)
			{
				[classNames addObject:className];
			}

		    
		    NSDictionary *merge = [stylesheet stylesheet:objectId density:density basename:basename classes:classNames tags:[NSArray arrayWithObject:type]];
			if (merge!=nil)
			{
				// incoming keys take precendence over existing stylesheet keys
				NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithDictionary:merge];
				[dict addEntriesFromDictionary:properties];
                
				properties = dict;
			}
		}
		// do a translation of language driven keys to their converted counterparts
		// for example titleid should look up the title in the Locale
		NSMutableDictionary *table = [self langConversionTable];
		if (table!=nil)
		{
			for (id key in table)
			{
				// determine which key in the lang table we need to use
				// from the lang property conversion key
				id langKey = [properties objectForKey:key];
				if (langKey!=nil)
				{
					// eg. titleid -> title
					id convertKey = [table objectForKey:key];
					// check and make sure we don't already have that key
					// since you can't override it if already present
					if ([properties objectForKey:convertKey]==nil)
					{
						id newValue = [TiLocale getString:langKey comment:nil];
						if (newValue!=nil)
						{
							[(NSMutableDictionary*)properties setObject:newValue forKey:convertKey];
						}
					}
				}
			}
		}
	}
	[super _initWithProperties:properties];
}

-(void)dealloc
{
	RELEASE_TO_NIL(pendingAdds);
	RELEASE_TO_NIL(destroyLock);
	pthread_rwlock_destroy(&childrenLock);
	
	//Dealing with children is in _destroy, which is called by super dealloc.
	
	[super dealloc];
}

-(BOOL)retainsJsObjectForKey:(NSString *)key
{
	return ![key isEqualToString:@"animation"];
}

-(void)firePropertyChanges
{
	[self willFirePropertyChanges];
	
	id<NSFastEnumeration> values = [self allKeys];
	
	[view readProxyValuesWithKeys:values];

	[self didFirePropertyChanges];
}

-(TiUIView*)newView
{
	NSString * proxyName = NSStringFromClass([self class]);
	if ([proxyName hasSuffix:@"Proxy"]) 
	{
		Class viewClass = nil;
		NSString * className = [proxyName substringToIndex:[proxyName length]-5];
		viewClass = NSClassFromString(className);
		if (viewClass != nil)
		{
			return [[viewClass alloc] init];
		}
	}
	else
	{
		NSLog(@"[WARN] No TiView for Proxy: %@, couldn't find class: %@",self,proxyName);
	}
	return [[TiUIView alloc] initWithFrame:[self appFrame]];
}


-(void)detachView
{
	[destroyLock lock];
	if (view!=nil)
	{
		[self viewWillDetach];
		// hold the view during detachment -- but we can't release it immediately.
        // What if it (or a superview or subview) is in the middle of an animation?
        // We probably need to be even MORE careful here.
		[[view retain] autorelease];
		view.proxy = nil;
		if (self.modelDelegate!=nil && [self.modelDelegate respondsToSelector:@selector(detachProxy)])
		{
			[self.modelDelegate detachProxy];
		}
		self.modelDelegate = nil;
		[view removeFromSuperview];
		RELEASE_TO_NIL(view);
		[self viewDidDetach];
	}

    pthread_rwlock_rdlock(&childrenLock);
    [[self children] makeObjectsPerformSelector:@selector(detachView)];
    pthread_rwlock_unlock(&childrenLock);
	[destroyLock unlock];
}

-(void)_destroy
{
	[destroyLock lock];
	if ([self destroyed])
	{
		// not safe to do multiple times given rwlock
		[destroyLock unlock];
		return;
	}
	// _destroy is called during a JS context shutdown, to inform the object to 
	// release all its memory and references.  this will then cause dealloc 
	// on objects that it contains (assuming we don't have circular references)
	// since some of these objects are registered in the context and thus still
	// reachable, we need _destroy to help us start the unreferencing part


	pthread_rwlock_wrlock(&childrenLock);
	[children makeObjectsPerformSelector:@selector(setParent:) withObject:nil];
	RELEASE_TO_NIL(children);
	pthread_rwlock_unlock(&childrenLock);
	[super _destroy];

	//Part of super's _destroy is to release the modelDelegate, which in our case is ALSO the view.
	//As such, we need to have the super happen before we release the view, so that we can insure that the
	//release that triggers the dealloc happens on the main thread.
	
	if (barButtonItem != nil)
	{
		if ([NSThread isMainThread])
		{
			RELEASE_TO_NIL(barButtonItem);
		}
		else
		{
			[barButtonItem performSelectorOnMainThread:@selector(release) withObject:nil waitUntilDone:NO];
			barButtonItem = nil;
		}
	}

	if (view!=nil)
	{
		if ([NSThread isMainThread])
		{
			[self detachView];
		}
		else
		{
			view.proxy = nil;
			[view performSelectorOnMainThread:@selector(release) withObject:nil waitUntilDone:NO];
			view = nil;
		}
	}
	[destroyLock unlock];
}

-(void)destroy
{
	//FIXME- me already have a _destroy, refactor this
	[self _destroy];
}

-(void)removeBarButtonView
{
	isUsingBarButtonItem = NO;
	[self setBarButtonItem:nil];
}

#pragma mark Callbacks

-(void)didReceiveMemoryWarning:(NSNotification*)notification
{
	// Only release a view if we're the only living reference for it
	// WARNING: do not call [self view] here as that will create the
	// view if it doesn't yet exist (thus defeating the purpose of
	// this method)
	
	//NOTE: for now, we're going to have to turn this off until post
	//1.4 where we can figure out why the drawing is screwed up since
	//the views aren't reattaching.  
	/*
	if (view!=nil && [view retainCount]==1)
	{
		[self detachView];
	}*/
	[super didReceiveMemoryWarning:notification];
}

-(void)getAnimatedCenterPoint:(NSMutableDictionary *)resultDict
{
	UIView * ourView = view;
	CALayer * ourLayer = [ourView layer];
	CALayer * animatedLayer = [ourLayer presentationLayer];
	
	CGPoint result;
	if (animatedLayer !=nil)
	{
		result = [animatedLayer position];
	}
	else
	{
		result = [ourLayer position];
	}

	[resultDict setObject:NUMFLOAT(result.x) forKey:@"x"];
	[resultDict setObject:NUMFLOAT(result.y) forKey:@"y"];
}

-(void)addImageToBlob:(NSArray*)args
{
	TiBlob *blob = [args objectAtIndex:0];
	[self windowWillOpen];
	TiUIView *myview = [self view];
	CGSize size = myview.bounds.size;
	if (CGSizeEqualToSize(size, CGSizeZero) || size.width==0 || size.height==0)
	{
		CGFloat width = [self autoWidthForWidth:1000];
		CGFloat height = [self autoHeightForWidth:width];
		if (width > 0 && height > 0)
		{
			size = CGSizeMake(width, height);
		}
		if (CGSizeEqualToSize(size, CGSizeZero) || width==0 || height == 0)
		{
			size = [UIScreen mainScreen].bounds.size;
		}
		CGRect rect = CGRectMake(0, 0, size.width, size.height);
		[TiUtils setView:myview positionRect:rect];
	}
	UIGraphicsBeginImageContext(size);
	[myview.layer renderInContext:UIGraphicsGetCurrentContext()];
	UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
	[blob setImage:image];
	UIGraphicsEndImageContext();
	if ([args count] > 1)
	{
		KrollCallback *callback = [args objectAtIndex:1];
		NSDictionary *event = [NSDictionary dictionaryWithObject:blob forKey:@"blob"];
		[self _fireEventToListener:@"blob" withObject:event listener:callback thisObject:nil];
	}
}

-(void)animationCompleted:(TiAnimation*)animation
{
	[self forgetProxy:animation];
	[[self view] animationCompleted];
}

-(void)makeViewPerformAction:(TiAction *)action
{
	[[self view] performSelector:[action selector] withObject:[action arg]];
}

-(void)makeViewPerformSelector:(SEL)selector withObject:(id)object createIfNeeded:(BOOL)create waitUntilDone:(BOOL)wait
{
	BOOL isAttached = [self viewAttached];
	
	if(!isAttached && !create)
	{
		return;
	}

	if([NSThread isMainThread])
	{
		[[self view] performSelector:selector withObject:object];
		return;
	}

	if(isAttached)
	{
		[[self view] performSelectorOnMainThread:selector withObject:object waitUntilDone:wait];
		return;
	}

	TiAction * ourAction = [[TiAction alloc] initWithTarget:nil selector:selector arg:object];
	[self performSelectorOnMainThread:@selector(makeViewPerformAction:) withObject:ourAction waitUntilDone:wait];
	[ourAction release];
}

#pragma mark Listener Management

-(BOOL)_hasListeners:(NSString *)type
{
	if ([super _hasListeners:type])
	{
		return YES;
	}
	// check our parent since we optimize the fire with
	// the check
	if (parent!=nil)
	{
		// walk up the chain
		return [parent _hasListeners:type];
	}
	return NO;
}

-(void)fireEvent:(NSString*)type withObject:(id)obj withSource:(id)source propagate:(BOOL)propagate
{
	// Note that some events (like movie 'complete') are fired after the view is removed/dealloc'd.
	// Because of the handling below, we can safely set the view to 'nil' in this case.
	TiUIView* proxyView = [self viewAttached] ? view : nil;
	//TODO: We have to do view instead of [self view] because of a freaky race condition that can
	//happen in the background (See bug 2809). This assumes that view == [self view], which may
	//not always be the case in the future. Then again, we shouldn't be dealing with view in the BG...
	
	
	// Have to handle the situation in which the proxy's view might be nil... like, for example,
	// with table rows.  Automagically assume any nil view we're firing an event for is A-OK.
	if (proxyView == nil || [proxyView interactionEnabled]) {
		[super fireEvent:type withObject:obj withSource:source propagate:YES];
		
		// views support event propagation. we need to check our
		// parent and if he has the same named listener, we fire
		// an event and set the source of the event to ourself
		
		if (parent!=nil && propagate==YES)
		{
			[parent fireEvent:type withObject:obj withSource:source];
		}
	}
}

-(void)_listenerAdded:(NSString*)type count:(int)count
{
	if (self.modelDelegate!=nil && [(NSObject*)self.modelDelegate respondsToSelector:@selector(listenerAdded:count:)])
	{
		[self.modelDelegate listenerAdded:type count:count];
	}
	else if(view!=nil) // don't create the view if not already realized
	{
		[self.view listenerAdded:type count:count];
	}
}

-(void)_listenerRemoved:(NSString*)type count:(int)count
{
	if (self.modelDelegate!=nil && [(NSObject*)self.modelDelegate respondsToSelector:@selector(listenerRemoved:count:)])
	{
		[self.modelDelegate listenerRemoved:type count:count];
	}
	else if(view!=nil) // don't create the view if not already realized
	{
		[self.view listenerRemoved:type count:count];
	}
}

#pragma mark Layout events, internal and external

#define SET_AND_PERFORM(flagBit,action)	\
if(OSAtomicTestAndSetBarrier(flagBit, &dirtyflags))	\
{	\
	action;	\
}

-(void)willEnqueue
{
	SET_AND_PERFORM(TiRefreshViewEnqueued,return);
	[TiLayoutQueue addViewProxy:self];
}

-(void)willEnqueueIfVisible
{
	if(parentVisible && !hidden)
	{
		[self willEnqueue];
	}
}


-(void)willChangeSize
{
	SET_AND_PERFORM(TiRefreshViewSize,return);

	if (!TiLayoutRuleIsAbsolute(layoutProperties.layoutStyle))
	{
		[self willChangeLayout];
	}
	if(TiDimensionIsUndefined(layoutProperties.centerX) ||
			TiDimensionIsUndefined(layoutProperties.centerY))
	{
		[self willChangePosition];
	}

	[self willEnqueueIfVisible];
	[parent contentsWillChange];
	pthread_rwlock_rdlock(&childrenLock);
	[children makeObjectsPerformSelector:@selector(parentSizeWillChange)];
	pthread_rwlock_unlock(&childrenLock);
}

-(void)willChangePosition
{
	SET_AND_PERFORM(TiRefreshViewPosition,return);

	if(TiDimensionIsUndefined(layoutProperties.width) || 
			TiDimensionIsUndefined(layoutProperties.height))
	{//The only time size can be changed by the margins is if the margins define the size.
		[self willChangeSize];
	}
	[self willEnqueueIfVisible];
	[parent contentsWillChange];
}

-(void)willChangeZIndex
{
	SET_AND_PERFORM(TiRefreshViewZIndex,);
	//Nothing cascades from here.
	[self willEnqueueIfVisible];
}

-(void)willShow;
{
	if(dirtyflags)
	{//If we have any need for changes, let's enroll ourselves.
		[self willEnqueue];
	}

	SET_AND_PERFORM(TiRefreshViewZIndex,);
	[parent contentsWillChange];

	pthread_rwlock_rdlock(&childrenLock);
	[children makeObjectsPerformSelector:@selector(parentWillShow)];
	pthread_rwlock_unlock(&childrenLock);
}

-(void)willHide;
{
	SET_AND_PERFORM(TiRefreshViewZIndex,);
	[parent contentsWillChange];

	[self willEnqueue];

	pthread_rwlock_rdlock(&childrenLock);
	[children makeObjectsPerformSelector:@selector(parentWillHide)];
	pthread_rwlock_unlock(&childrenLock);
}

-(void)willChangeLayout
{
	SET_AND_PERFORM(TiRefreshViewChildrenPosition,return);

	[self willEnqueueIfVisible];

	pthread_rwlock_rdlock(&childrenLock);
	[children makeObjectsPerformSelector:@selector(parentWillRelay)];
	pthread_rwlock_unlock(&childrenLock);
}

-(void)contentsWillChange
{
	if (TiDimensionIsAuto(layoutProperties.width) ||
			TiDimensionIsAuto(layoutProperties.height))
	{
		[self willChangeSize];
	}
	else if (!TiLayoutRuleIsAbsolute(layoutProperties.layoutStyle))
	{//Since changing size already does this, we only need to check
	//Layout if the changeSize didn't
		[self willChangeLayout];
	}
}

-(void)parentSizeWillChange
{
//	if percent or undefined size, change size
	if(TiDimensionIsUndefined(layoutProperties.width) ||
			TiDimensionIsUndefined(layoutProperties.height) ||
			TiDimensionIsPercent(layoutProperties.width) ||
			TiDimensionIsPercent(layoutProperties.height))
	{
		[self willChangeSize];
	}
	if(!TiDimensionIsPixels(layoutProperties.centerX) ||
			!TiDimensionIsPixels(layoutProperties.centerY))
	{
		[self willChangePosition];
	}
}

-(void)parentWillRelay
{
//	if percent or undefined size, change size
	if(TiDimensionIsUndefined(layoutProperties.width) ||
			TiDimensionIsUndefined(layoutProperties.height) ||
			TiDimensionIsPercent(layoutProperties.width) ||
			TiDimensionIsPercent(layoutProperties.height))
	{
		[self willChangeSize];
	}
	[self willChangePosition];
}

-(void)parentWillShow
{
	VerboseLog(@"[INFO] Parent Will Show for %@",self);
	if(parentVisible)
	{//Nothing to do here, we're already visible here.
		return;
	}
	parentVisible = YES;
	if(!hidden)
	{	//We should propagate this new status! Note this does not change the visible property.
		[self willShow];
	}
}

-(void)parentWillHide
{
	VerboseLog(@"[INFO] Parent Will Hide for %@",self);
	if(!parentVisible)
	{//Nothing to do here, we're already visible here.
		return;
	}
	parentVisible = NO;
	if(!hidden)
	{	//We should propagate this new status! Note this does not change the visible property.
		[self willHide];
	}
}

#pragma mark Layout actions

// Need this so we can overload the sandbox bounds on split view detail/master
-(void)determineSandboxBounds
{
    UIView * ourSuperview = [[self view] superview];
    if(ourSuperview == nil)
    {
        //TODO: Should we even be relaying out? I guess so.
        sandboxBounds = CGRectZero;
    }
    else
    {
        sandboxBounds = [ourSuperview bounds];
    }
}

-(void)refreshView:(TiUIView *)transferView
{
	WARN_IF_BACKGROUND_THREAD_OBJ;
	OSAtomicTestAndClearBarrier(TiRefreshViewEnqueued, &dirtyflags);
	
	if(!parentVisible)
	{
		VerboseLog(@"[INFO] Parent Invisible");
		return;
	}
	
	if(hidden)
	{
		VerboseLog(@"Removing from superview");
		if([self viewAttached])
		{
			[[self view] removeFromSuperview];
		}
		return;
	}

	BOOL changedFrame = NO;
//BUG BARRIER: Code in this block is legacy code that should be factored out.
	if (windowOpened && [self viewAttached])
	{
		CGRect oldFrame = [[self view] frame];
		if(![self suppressesRelayout])
		{
            [self determineSandboxBounds];
			[self relayout];
		}
		[self layoutChildren:NO];
		if (!CGRectEqualToRect(oldFrame, [[self view] frame])) {
			[parent childWillResize:self];
		}
	}

//END BUG BARRIER

	if(OSAtomicTestAndClearBarrier(TiRefreshViewSize, &dirtyflags))
	{
		[self refreshSize];
		if(TiLayoutRuleIsAbsolute(layoutProperties.layoutStyle))
		{
			pthread_rwlock_rdlock(&childrenLock);
			for (TiViewProxy * thisChild in children)
			{
				[thisChild setSandboxBounds:sizeCache];
			}
			pthread_rwlock_unlock(&childrenLock);
		}
		changedFrame = YES;
	}
	else if(transferView != nil)
	{
		[transferView setBounds:sizeCache];
	}

	if(OSAtomicTestAndClearBarrier(TiRefreshViewPosition, &dirtyflags))
	{
		[self refreshPosition];
		changedFrame = YES;
	}
	else if(transferView != nil)
	{
		[transferView setCenter:positionCache];
	}

//We should only recurse if we're a non-absolute layout. Otherwise, the views can take care of themselves.
	if(OSAtomicTestAndClearBarrier(TiRefreshViewChildrenPosition, &dirtyflags) && (transferView == nil))
	//If transferView is non-nil, this will be managed by the table row.
	{
		
	}

	if(transferView != nil)
	{
	//TODO: Better handoff of view
		[self setView:transferView];
	}

//By now, we MUST have our view set to transferView.
	if(changedFrame || (transferView != nil))
	{
		[view setAutoresizingMask:autoresizeCache];
	}


	if(OSAtomicTestAndClearBarrier(TiRefreshViewZIndex, &dirtyflags) || (transferView != nil))
	{
		[parent insertSubview:view forProxy:self];
	}

}

-(void)refreshPosition
{
	OSAtomicTestAndClearBarrier(TiRefreshViewPosition, &dirtyflags);

}

-(void)refreshSize
{
	OSAtomicTestAndClearBarrier(TiRefreshViewSize, &dirtyflags);


}

-(void)insertSubview:(UIView *)childView forProxy:(TiViewProxy *)childProxy
{
	
	int result = 0;
	int childZindex = [childProxy zIndex];
	BOOL earlierSibling = YES;
	UIView * ourView = [self parentViewForChild:childProxy];
	
	// Have to loop through the view first to find non-Ti views, and consider them
	// to be on the "bottom" of the view drawing stack, so Ti-everything draws atop them
	// TODO: This is probably slow - can we reliably cache this value?
	for (UIView* subview in [ourView subviews]) 
	{
		if (![subview isKindOfClass:[TiUIView class]]) {
			result++;
		}
	}
	
	pthread_rwlock_rdlock(&childrenLock);
	for (TiViewProxy * thisChildProxy in self.children)
	{
		if(thisChildProxy == childProxy)
		{
			earlierSibling = NO;
			continue;
		}
		
		if(![thisChildProxy viewHasSuperview:ourView])
		{
			continue;
		}
		
		int thisChildZindex = [thisChildProxy zIndex];
		if((thisChildZindex < childZindex) ||
				(earlierSibling && (thisChildZindex == zIndex)))
		{
			result ++;
		}
	}
	pthread_rwlock_unlock(&childrenLock);

	[ourView insertSubview:childView atIndex:result];
}


#pragma mark Layout commands that need refactoring out

-(void)relayout
{
	if (!repositioning)
	{
		ENSURE_UI_THREAD_0_ARGS

		repositioning = YES;


		sizeCache.size = SizeConstraintViewWithSizeAddingResizing(&layoutProperties,self, sandboxBounds.size, &autoresizeCache);

		positionCache = PositionConstraintGivenSizeBoundsAddingResizing(&layoutProperties, sizeCache.size,
		[[view layer] anchorPoint], sandboxBounds.size, &autoresizeCache);

		positionCache.x += sizeCache.origin.x + sandboxBounds.origin.x;
		positionCache.y += sizeCache.origin.y + sandboxBounds.origin.y;

		[view setAutoresizingMask:autoresizeCache];
		[view setCenter:positionCache];
		[view setBounds:sizeCache];

		[parent insertSubview:view forProxy:self];


		repositioning = NO;
	}
#ifdef VERBOSE
	else
	{
		NSLog(@"[INFO] %@ Calling Relayout from within relayout.",self);
	}
#endif

}

-(void)insertIntoView:(UIView*)newSuperview bounds:(CGRect)bounds
{
	if (newSuperview==view)
	{
		NSLog(@"[ERROR] invalid call to insertIntoView, new super view is same as myself");
		return;
	}
	ApplyConstraintToViewWithBounds(&layoutProperties, [self view], bounds);
	if([view superview]!=newSuperview)	//TODO: Refactor out.
	{
		[newSuperview addSubview:view];
	}
}

-(void)layoutChildrenIfNeeded
{
	IGNORE_IF_NOT_OPENED
	
	// if not attached, ignore layout
	if ([self viewAttached])
	{
		// if not visible, ignore layout
		if (view.hidden)
		{
			return;
		}
		
		[self refreshView:nil];

		BOOL wasSet=OSAtomicTestAndClearBarrier(NEEDS_LAYOUT_CHILDREN, &dirtyflags);
		if (wasSet && [self viewAttached])
		{
			[self layoutChildren:NO];
		}
	}
}

-(BOOL)willBeRelaying
{
	return dirtyflags != 0;
}

-(void)childWillResize:(TiViewProxy *)child
{
	[self contentsWillChange];

	IGNORE_IF_NOT_OPENED
	
	pthread_rwlock_rdlock(&childrenLock);
	BOOL containsChild = [children containsObject:child];
	pthread_rwlock_unlock(&childrenLock);

	ENSURE_VALUE_CONSISTENCY(containsChild,YES);

	if (!TiLayoutRuleIsAbsolute(layoutProperties.layoutStyle))
	{
		BOOL alreadySet = OSAtomicTestAndSetBarrier(NEEDS_LAYOUT_CHILDREN, &dirtyflags);
		if (!alreadySet)
		{
			[self willEnqueue];
		}
	}
}

-(void)reposition
{
	IGNORE_IF_NOT_OPENED
	
	UIView* superview = [[self view] superview];
	if (![self viewAttached] || view.hidden || superview == nil)
	{
		VerboseLog(@"[INFO] Reposition is exiting early in %@.",self);
		return;
	}
	if ([NSThread isMainThread])
	{	//NOTE: This will cause problems with ScrollableView, or is a new wrapper needed?
		[self willChangeSize];
		[self willChangePosition];
	
		[self refreshView:nil];
	}
	else 
	{
		VerboseLog(@"[INFO] Reposition was called by a background thread in %@.",self);
		[self performSelectorOnMainThread:@selector(reposition) withObject:nil waitUntilDone:NO];
	}

}

-(void)layoutChild:(TiViewProxy*)child optimize:(BOOL)optimize
{
	IGNORE_IF_NOT_OPENED
	
	UIView * ourView = [self parentViewForChild:child];

	if (ourView==nil)
	{
		return;
	}

	CGRect bounds = [ourView bounds];
	
	// layout out ourself

	if(TiLayoutRuleIsVertical(layoutProperties.layoutStyle))
	{
		bounds.origin.y += verticalLayoutBoundary;
		bounds.size.height = [child minimumParentHeightForWidth:bounds.size.width];
		verticalLayoutBoundary += bounds.size.height;
	}
	else if(TiLayoutRuleIsHorizontal(layoutProperties.layoutStyle))
	{
		CGFloat desiredWidth = [child minimumParentWidthForWidth:bounds.size.width-horizontalLayoutBoundary];
		if ((horizontalLayoutBoundary + desiredWidth) > bounds.size.width) //No room! Start over!
		{
			horizontalLayoutBoundary = 0.0;
			verticalLayoutBoundary += horizontalLayoutRowHeight;
			horizontalLayoutRowHeight = 0;
			desiredWidth = [child minimumParentWidthForWidth:bounds.size.width];
		}
		else
		{
			bounds.origin.x += horizontalLayoutBoundary;
		}

		horizontalLayoutBoundary += desiredWidth;
		bounds.size.width = desiredWidth;
		
		CGFloat desiredHeight = [child minimumParentHeightForWidth:desiredWidth];
		if (desiredHeight > horizontalLayoutRowHeight)
		{
			horizontalLayoutRowHeight = desiredHeight;
		}
		bounds.origin.y += verticalLayoutBoundary;
		bounds.size.height = desiredHeight;
	}
	
	if (optimize==NO)
	{
		TiUIView *childView = [child view];
		if ([childView superview]!=ourView)
		{	
			//TODO: Optimize!
			int insertPosition = 0;
			int childZIndex = [child zIndex];
			
			pthread_rwlock_rdlock(&childrenLock);
			int childProxyIndex = [children indexOfObject:child];

			for (TiUIView * thisView in [ourView subviews])
			{
				if (![thisView isKindOfClass:[TiUIView class]])
				{
					insertPosition ++;
					continue;
				}
				
				int thisZIndex=[(TiViewProxy *)[thisView proxy] zIndex];
				if (childZIndex < thisZIndex) //We've found our stop!
				{
					break;
				}
				if (childZIndex == thisZIndex)
				{
					TiProxy * thisProxy = [thisView proxy];
					if (childProxyIndex <= [children indexOfObject:thisProxy])
					{
						break;
					}
				}
				insertPosition ++;
			}
			
			[ourView insertSubview:childView atIndex:insertPosition];
			pthread_rwlock_unlock(&childrenLock); // must release before calling resize
			
			[self childWillResize:child];
		}
	}
	[child setSandboxBounds:bounds];
	if ([[child view] animating])
	{
#ifdef DEBUG
	// changing the layout while animating is bad, ignore for now
		NSLog(@"[DEBUG] ignoring new layout while animating in layout Child..");
#endif
	}
	else
	{
		[child relayout];
	}

	// tell our children to also layout
	[child layoutChildren:optimize];
}

-(void)layoutChildren:(BOOL)optimize
{
	IGNORE_IF_NOT_OPENED
	
	verticalLayoutBoundary = 0.0;
	horizontalLayoutBoundary = 0.0;
	horizontalLayoutRowHeight = 0.0;
	
	if (optimize==NO)
	{
		OSAtomicTestAndSetBarrier(NEEDS_LAYOUT_CHILDREN, &dirtyflags);
	}

//TODO: This is really expensive, but what can you do? Laying out the child needs the lock again.
	pthread_rwlock_rdlock(&childrenLock);
	NSArray * childrenArray = [[self children] copy];
	pthread_rwlock_unlock(&childrenLock);
	
	for (id child in childrenArray)
	{
		[self layoutChild:child optimize:optimize];
	}
	[childrenArray release];
	
	if (optimize==NO)
	{
		OSAtomicTestAndClearBarrier(NEEDS_LAYOUT_CHILDREN, &dirtyflags);
	}
}

@end
