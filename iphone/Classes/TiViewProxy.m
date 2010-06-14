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
#import <QuartzCore/QuartzCore.h>
#import <libkern/OSAtomic.h>
#import <pthread.h>

#import "TiLayoutQueue.h"

@implementation TiViewProxy

@synthesize children, parent;
@synthesize barButtonItem;

#pragma mark Internal
- (id) init
{
	self = [super init];
	if (self != nil)
	{
		int error = pthread_rwlock_init(&rwChildrenLock, NULL);
		if (error != 0)
		{
			NSLog(@"[ERROR] View proxy was unable to initialize the readwrite lock: %d",error);
		}
	}
	return self;
}



- (void) _initWithProperties:(NSDictionary *)properties
{
#if USE_VISIBLE_BOOL
	visible = YES;
#endif
	[super _initWithProperties:properties];
}


-(void)dealloc
{
	if (view!=nil)
	{
		view.proxy = nil;
	}
	RELEASE_TO_NIL(barButtonItem);
	RELEASE_TO_NIL(view);
	
	//Dealing with children is in _destroy, which is called by super dealloc.
	
	[super dealloc];
}

-(void)lockChildrenForReading
{
	int error = pthread_rwlock_rdlock(&rwChildrenLock);
	if (error != 0)
	{
		NSLog(@"[ERROR] View proxy readwrite read lock failed: %d",error);
	}
}

-(void)lockChildrenForWriting
{
	int error = pthread_rwlock_wrlock(&rwChildrenLock);
	if (error != 0)
	{
		NSLog(@"[ERROR] View proxy readwrite write lock failed: %d",error);
	}
}

-(void)unlockChildren
{
	int error = pthread_rwlock_unlock(&rwChildrenLock);
	if (error != 0)
	{
		NSLog(@"[ERROR] View proxy readwrite unlock failed: %d",error);
	}
}




#pragma mark Subclass Callbacks 

-(void)childAdded:(id)child
{
}

-(void)childRemoved:(id)child
{
}

-(void)layoutChildOnMainThread:(id)arg
{
	ENSURE_UI_THREAD(layoutChildOnMainThread,arg);
	[self layoutChild:arg]; 
}

#pragma mark Misc

// TODO: Re-evaluate this along with the other controller propagation mechanisms, post 1.3.0.
// Returns YES for anything that can have a UIController object in its parent view
-(BOOL)canHaveControllerParent
{
	return YES;
}

#pragma mark Public

#if USE_VISIBLE_BOOL
-(BOOL)visible
{
	return visible;
}

-(void)setVisible:(BOOL)newValue
{
	if (visible == newValue)
	{
		return;
	}
	visible = newValue;
	[self replaceValue:[NSNumber numberWithBool:visible] forKey:@"visible" notification:YES];

#if DONTSHOWHIDDEN
	if (visible)
	{
		[parent childWillResize:self];
	}
#endif

}
#endif

-(void)setBackgroundGradient:(id)arg
{
	TiGradient * newGradient;
	if ([arg isKindOfClass:[NSDictionary class]])
	{
		newGradient = [[[TiGradient alloc] _initWithPageContext:[self executionContext]] autorelease];
		[newGradient _initWithProperties:arg];
	}
	else
	{
		newGradient = arg;
	}
	ENSURE_TYPE_OR_NIL(newGradient,TiGradient);
	[self replaceValue:newGradient forKey:@"backgroundGradient" notification:YES];
}

-(void)add:(id)arg
{
	ENSURE_SINGLE_ARG(arg,TiViewProxy);
	ENSURE_UI_THREAD_1_ARG(arg);
	[self lockChildrenForWriting];
		if (children==nil)
		{
			children = [[NSMutableArray alloc] init];
		}
		VerboseLog(@"Adding child %@%X to %@%X",arg,arg,self,self);
		[children addObject:arg];
	[self unlockChildren];
	
	[arg setParent:self];
	// only call layout if the view is attached
	if ([self viewAttached])
	{
		[self layoutChildOnMainThread:arg];
	}
	[self childAdded:arg];
}


-(void)remove:(id)arg
{
	ENSURE_SINGLE_ARG(arg,TiViewProxy);

	[self lockChildrenForReading];
		BOOL viewIsInChildren = [children containsObject:arg];
	[self unlockChildren];

	ENSURE_VALUE_CONSISTENCY(viewIsInChildren,YES);
	ENSURE_UI_THREAD_1_ARG(arg);
	[self childRemoved:arg];

	[self lockChildrenForWriting];
		[children removeObject:arg];
		if ([children count]==0)
		{
			RELEASE_TO_NIL(children);
		}
	[self unlockChildren];
		
	[arg setParent:nil];
	
	if (view!=nil)
	{
		TiUIView *childView = [(TiViewProxy *)arg view];
		BOOL layoutNeedsRearranging = !TiLayoutRuleIsAbsolute(layoutProperties.layout);
		if ([NSThread isMainThread])
		{
			[childView removeFromSuperview];
			if (layoutNeedsRearranging)
			{
				[self layoutChildren];
			}
		}
		else
		{
			[childView performSelectorOnMainThread:@selector(removeFromSuperview) withObject:nil waitUntilDone:NO];
			if (layoutNeedsRearranging)
			{
				[self performSelectorOnMainThread:@selector(layout) withObject:nil waitUntilDone:NO modes:[NSArray arrayWithObject:NSRunLoopCommonModes]];
			}
		}
	}
}

-(TiPoint*)center
{
	return [[[TiPoint alloc] initWithPoint:[self view].center] autorelease];
}

-(void)show:(id)arg
{
	//TODO: animate
#if USE_VISIBLE_BOOL
	[self setVisible:YES];
#else
	[self setValue:[NSNumber numberWithBool:YES] forKey:@"visible"];
	//TODO: There was a child will resize here, but it was messing things up.
	//The layout engine needs an overhaul.
#endif
}
 
-(void)hide:(id)arg
{
	//TODO: animate
#if USE_VISIBLE_BOOL
	[self setVisible:NO];
#else
	[self setValue:[NSNumber numberWithBool:NO] forKey:@"visible"];
#endif
}

-(void)animate:(id)arg
{
	ENSURE_UI_THREAD(animate,arg);
	if ([view superview]==nil)
	{
		VerboseLog(@"Entering animation without a superview Parent is %@, props are %@",parent,dynprops);
		[parent childWillResize:self];
	}
	[parent layoutChildrenIfNeeded];
	[[self view] animate:arg];
}

-(void)addImageToBlob:(NSArray*)args
{
	TiBlob *blob = [args objectAtIndex:0];
	UIView *myview = [self view];
	UIGraphicsBeginImageContext(myview.bounds.size);
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

#pragma mark View


-(TiRect*)size
{
	TiRect *rect = [[[TiRect alloc] init] autorelease];
	[[self view] performSelectorOnMainThread:@selector(fillBoundsToRect:) withObject:rect waitUntilDone:YES];
	return rect;
}

-(void)setParent:(TiViewProxy*)parent_
{
	parent = parent_;
	if (view!=nil)
	{
		[view setParent:parent_];
	}
}

-(void)animationCompleted:(TiAnimation*)animation
{
	[[self view] animationCompleted];
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

-(BOOL)viewAttached
{
	return view!=nil;
}

//CAUTION: TO BE USED ONLY WITH TABLEVIEW MAGIC
-(void)setView:(TiUIView *)newView
{
	[view release];
	view = [newView retain];
	self.modelDelegate = newView;
}

-(void)detachView
{
	if (view!=nil)
	{
		[self viewWillDetach];
		view.proxy = nil;
		[view removeFromSuperview];
		[self viewDidDetach];
		self.modelDelegate = nil;
		RELEASE_TO_NIL(view);
	}
}

-(void)windowDidClose
{
	[self lockChildrenForReading];
		for (TiViewProxy *child in children)
		{
			[child windowDidClose];
		}
	[self unlockChildren];
	[self detachView];
}

-(void)windowWillClose
{
	[self lockChildrenForReading];
		for (TiViewProxy *child in children)
		{
			[child windowWillClose];
		}
	[self unlockChildren];
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

-(BOOL)viewReady
{
	return view!=nil && 
			CGRectIsEmpty(view.bounds)==NO && 
			CGRectIsNull(view.bounds)==NO &&
			[view superview] != nil;
}

-(BOOL)viewInitialized
{
	return viewInitialized;
}

-(void)firePropertyChanges
{
	[self willFirePropertyChanges];
	
	id<NSFastEnumeration> values = [self allKeys];
	
	[view readProxyValuesWithKeys:values];

	[self didFirePropertyChanges];
}

-(void)exchangeView:(TiUIView*)newview
{
	//NOTE: this is dangerous and should only be called
	//when you know what the heck you intend to do.
	//used by tableview currently for view swapping
	if (view!=nil)
	{
		view.proxy = nil;
		RELEASE_TO_NIL(view);
	}
	view = [newview retain];
	view.proxy = self;
}

-(TiUIView*)view
{
	if (view == nil)
	{
		[self viewWillAttach];
		
		// on open we need to create a new view
		view = [self newView];
		
		view.proxy = self;
		view.parent = parent;
		view.layer.transform = CATransform3DIdentity;
		view.transform = CGAffineTransformIdentity;

		[view initializeState];

		[view willSendConfiguration];

		// fire property changes for all properties to our delegate
		[self firePropertyChanges];


		[view didSendConfiguration];

		[view configurationSet];

		[self lockChildrenForReading];
			for (id child in self.children)
			{
				TiUIView *childView = [(TiViewProxy*)child view];
				[view addSubview:childView];
			}
		[self unlockChildren];
		[self viewDidAttach];

		// make sure we do a layout of ourselves

		[view updateLayout:NULL withBounds:view.bounds];
		
		viewInitialized = YES;
	}

	CGRect bounds = [view bounds];
	if (!CGPointEqualToPoint(bounds.origin, CGPointZero))
	{
		[view setBounds:CGRectMake(0, 0, bounds.size.width, bounds.size.height)];
	}
	
	return view;
}

#pragma mark Layout 

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

-(id)animatedCenter;
{
	if (![self viewAttached])
	{
		return nil;
	}
	NSMutableDictionary * result = [NSMutableDictionary dictionary];
	[self performSelectorOnMainThread:@selector(getAnimatedCenterPoint:) withObject:result waitUntilDone:YES];

	return result;
}


-(UIView *)parentViewForChild:(TiViewProxy *)child
{
	return view;
}

-(void)layoutChild:(TiViewProxy*)child;
{
	UIView * ourView = [self parentViewForChild:child];

	if (ourView==nil)
	{
		return;
	}

	CGRect bounds = [ourView bounds];

	// layout out ourself

	if(TiLayoutRuleIsVertical(layoutProperties.layout))\
	{
		bounds.origin.y += verticalLayoutBoundary;
		bounds.size.height = [child minimumParentHeightForWidth:bounds.size.width];
		verticalLayoutBoundary += bounds.size.height;
	}
	else if(TiLayoutRuleIsHorizontal(layoutProperties.layout))
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

#if DONTSHOWHIDDEN
	BOOL isVisible = [TiUtils boolValue:[child valueForKey:@"visible"] def:YES];

	if (!isVisible)
	{
		//TODO: Return early for speed
	}
#endif

	TiUIView *childView = [child view];
	if ([childView superview]!=ourView)
	{	//TODO: Optimize!
		int insertPosition = 0;
		CGFloat zIndex = [childView zIndex];
		
		[self lockChildrenForReading];
			int childProxyIndex = [children indexOfObject:child];

			for (TiUIView * thisView in [ourView subviews])
			{
				if (![thisView isKindOfClass:[TiUIView class]])
				{
					insertPosition ++;
					continue;
				}
				
				CGFloat thisZIndex=[thisView zIndex];
				if (zIndex < thisZIndex) //We've found our stop!
				{
					break;
				}
				if (zIndex == thisZIndex)
				{
					TiProxy * thisProxy = [thisView proxy];
					if (childProxyIndex <= [children indexOfObject:thisProxy])
					{
						break;
					}
				}
				insertPosition ++;
			}
		[self unlockChildren];
		
		[ourView insertSubview:childView atIndex:insertPosition];
		[self childWillResize:child];
	}
	[[child view] updateLayout:NULL withBounds:bounds];
	
	// tell our children to also layout
	[child layoutChildren];
}

-(void)layoutChildren
{
	verticalLayoutBoundary = 0.0;
	horizontalLayoutBoundary = 0.0;
	horizontalLayoutRowHeight = 0.0;
	// now ask each of our children for their view
	if (![self viewAttached])
	{
		return;
	}
	OSAtomicTestAndSetBarrier(NEEDS_LAYOUT_CHILDREN, &dirtyflags);
	[self lockChildrenForReading];
		for (id child in self.children)
		{
			[self layoutChild:child];
		}
	OSAtomicTestAndClearBarrier(NEEDS_LAYOUT_CHILDREN, &dirtyflags);
	[self unlockChildren];
}

-(CGRect)appFrame
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
	}
	return result;
}

#pragma mark Memory Management

-(void)_destroy
{
	// _destroy is called during a JS context shutdown, to inform the object to 
	// release all its memory and references.  this will then cause dealloc 
	// on objects that it contains (assuming we don't have circular references)
	// since some of these objects are registered in the context and thus still
	// reachable, we need _destroy to help us start the unreferencing part
	
	RELEASE_TO_NIL(barButtonItem);
	if (view!=nil)
	{
		view.proxy = nil;
		// must be on main thread
		[view performSelectorOnMainThread:@selector(removeFromSuperview) withObject:nil waitUntilDone:NO];
		RELEASE_TO_NIL(view);
	}
	
	[self lockChildrenForWriting];
		[children removeAllObjects];
		RELEASE_TO_NIL(children);
	[self unlockChildren];
	[super _destroy];
}

-(void)destroy
{
	//FIXME- me already have a _destroy, refactor this
	[self _destroy];
}

-(void)didReceiveMemoryWarning:(NSNotification*)notification
{
	// Only release a view if it's not currently attached and we're the only living reference for it
	if (![self viewAttached] && [[self view] retainCount] == 1) {
		RELEASE_TO_NIL(view);
	}
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
	[super fireEvent:type withObject:obj withSource:source propagate:YES];
	
	// views support event propagation. we need to check our
	// parent and if he has the same named listener, we fire
	// an event and set the source of the event to ourself
    
	if (parent!=nil && propagate==YES)
	{
		[parent fireEvent:type withObject:obj withSource:source];
	}
}

-(void)_listenerAdded:(NSString*)type count:(int)count
{
	if (self.modelDelegate!=nil && [(NSObject*)self.modelDelegate respondsToSelector:@selector(listenerAdded:count:)])
	{
		[self.modelDelegate listenerAdded:type count:count];
	}
}

-(void)_listenerRemoved:(NSString*)type count:(int)count
{
	if (self.modelDelegate!=nil && [(NSObject*)self.modelDelegate respondsToSelector:@selector(listenerRemoved:count:)])
	{
		[self.modelDelegate listenerRemoved:type count:count];
	}
}

#pragma mark For Nav Bar Support

-(BOOL)supportsNavBarPositioning
{
	return YES;
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

-(UIBarButtonItem*)barButtonItem
{
	if (barButtonItem == nil)
	{
		isUsingBarButtonItem = YES;
		barButtonItem = [[UIBarButtonItem alloc] initWithCustomView:[self barButtonViewForSize:CGSizeZero]];
	}
	return barButtonItem;
}

-(void)removeBarButtonView
{
	isUsingBarButtonItem = NO;
	[self setBarButtonItem:nil];
}

- (BOOL) isUsingBarButtonItem
{
	return isUsingBarButtonItem;
}

#pragma mark For autosizing of table views

-(LayoutConstraint *)layoutProperties
{
	return &layoutProperties;
}

-(void)setLayoutProperties:(LayoutConstraint *)newLayout
{
	layoutProperties = *newLayout;
}


-(CGFloat)autoWidthForWidth:(CGFloat)suggestedWidth
{
	BOOL isHorizontal = TiLayoutRuleIsHorizontal(layoutProperties.layout);
	CGFloat result = 0.0;

	[self lockChildrenForReading];
		for (TiViewProxy * thisChildProxy in children)
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
	[self unlockChildren];
	
	if (suggestedWidth == 0.0)
	{
		return result;
	}
	return MIN(suggestedWidth,result);
}

-(CGFloat)autoHeightForWidth:(CGFloat)width
{
	BOOL isVertical = TiLayoutRuleIsVertical(layoutProperties.layout);
	BOOL isHorizontal = TiLayoutRuleIsHorizontal(layoutProperties.layout);
	CGFloat result=0.0;

	//Autoheight with a set autoheight for width gets complicated.
	CGFloat widthLeft=width;
	CGFloat currentRowHeight = 0.0;

	[self lockChildrenForReading];
		for (TiViewProxy * thisChildProxy in children)
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
	[self unlockChildren];
	return result + currentRowHeight;
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

-(void)layoutChildrenIfNeeded
{
	[self repositionIfNeeded];

	BOOL wasSet=OSAtomicTestAndClearBarrier(NEEDS_LAYOUT_CHILDREN, &dirtyflags);
	if (wasSet && [self viewAttached])
	{
		[self layoutChildren];
	}
}

-(BOOL)willBeRelaying
{
	return dirtyflags != 0;
}

-(void)childWillResize:(TiViewProxy *)child
{
	[self lockChildrenForReading];
	BOOL containsChild = [children containsObject:child];
	[self unlockChildren];

	ENSURE_VALUE_CONSISTENCY(containsChild,YES);
	[self setNeedsRepositionIfAutoSized];

	if (!TiLayoutRuleIsAbsolute(layoutProperties.layout))
	{
		BOOL alreadySet = OSAtomicTestAndSetBarrier(NEEDS_LAYOUT_CHILDREN, &dirtyflags);
		if (!alreadySet)
		{
			[TiLayoutQueue addViewProxy:self];
		}
	}
}

-(void)repositionWithBounds:(CGRect)bounds
{
	OSAtomicTestAndClearBarrier(NEEDS_REPOSITION, &dirtyflags);
	[[self view] relayout:bounds];
	[self layoutChildren];
}

-(void)reposition
{
	if (![self viewAttached])
	{
		return;
	}
	if ([NSThread isMainThread])
	{	//NOTE: This will cause problems with ScrollableView, or is a new wrapper needed?
		[parent childWillResize:self];
		[self repositionWithBounds:[[self view] superview].bounds];
	}
	else 
	{
		[self performSelectorOnMainThread:@selector(reposition) withObject:nil waitUntilDone:NO];
	}

}

-(void)repositionIfNeeded
{
	BOOL wasSet=OSAtomicTestAndClearBarrier(NEEDS_REPOSITION, &dirtyflags);
	if (wasSet && [self viewAttached])
	{
		[self reposition];
	}
}

-(void)setNeedsReposition
{
	if (![self viewAttached])
	{
		return;
	}
	BOOL alreadySet = OSAtomicTestAndSetBarrier(NEEDS_REPOSITION, &dirtyflags);
	if (alreadySet || [parent willBeRelaying])
	{
		return;
	}

	[parent childWillResize:self];
	[TiLayoutQueue addViewProxy:self];
}

-(void)clearNeedsReposition
{
	OSAtomicTestAndClearBarrier(NEEDS_REPOSITION, &dirtyflags);
}

-(void)setNeedsRepositionIfAutoSized
{
	if (TiDimensionIsAuto(layoutProperties.width) || TiDimensionIsAuto(layoutProperties.height))
	{
		[self setNeedsReposition];
	}
}


#define LAYOUTPROPERTIES_SETTER(methodName,layoutName,converter)	\
-(void)methodName:(id)value	\
{	\
	layoutProperties.layoutName = converter(value);	\
	[self setNeedsReposition];	\
	[self replaceValue:value forKey:@#layoutName notification:YES];	\
}

LAYOUTPROPERTIES_SETTER(setTop,top,TiDimensionFromObject)
LAYOUTPROPERTIES_SETTER(setBottom,bottom,TiDimensionFromObject)

LAYOUTPROPERTIES_SETTER(setLeft,left,TiDimensionFromObject)
LAYOUTPROPERTIES_SETTER(setRight,right,TiDimensionFromObject)

LAYOUTPROPERTIES_SETTER(setWidth,width,TiDimensionFromObject)
LAYOUTPROPERTIES_SETTER(setHeight,height,TiDimensionFromObject)

LAYOUTPROPERTIES_SETTER(setLayout,layout,TiLayoutRuleFromObject)

LAYOUTPROPERTIES_SETTER(setMinWidth,minimumWidth,TiFixedValueRuleFromObject)
LAYOUTPROPERTIES_SETTER(setMinHeight,minimumHeight,TiFixedValueRuleFromObject)

-(void)setCenter:(id)value
{
	if (![value isKindOfClass:[NSDictionary class]])
	{
		layoutProperties.centerX = TiDimensionUndefined;
		layoutProperties.centerY = TiDimensionUndefined;
	}
	else
	{
		layoutProperties.centerX = TiDimensionFromObject([value objectForKey:@"x"]);
		layoutProperties.centerY = TiDimensionFromObject([value objectForKey:@"y"]);
	}
	[self setNeedsReposition];
}


@end
