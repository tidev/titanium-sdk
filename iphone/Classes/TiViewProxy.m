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

#import <QuartzCore/QuartzCore.h>
#import <libkern/OSAtomic.h>
#import <pthread.h>


#define IGNORE_IF_NOT_OPENED if (!windowOpened||[self viewAttached]==NO) return;

@implementation TiViewProxy

@synthesize children, parent;
@synthesize barButtonItem;

#pragma mark Internal

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
		if (objectId!=nil)
		{
			TiStylesheet *stylesheet = [[[self pageContext] host] stylesheet];
			NSString *density = [TiUtils isRetinaDisplay] ? @"high" : @"medium";
			NSString *basename = [[self pageContext] basename];
			NSString *type = [NSStringFromClass([self class]) stringByReplacingOccurrencesOfString:@"TiUI" withString:@""];
			type = [[type stringByReplacingOccurrencesOfString:@"Proxy" withString:@""] lowercaseString];
			NSDictionary *merge = [stylesheet stylesheet:objectId type:type density:density basename:basename];
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
		// handle font conversions
		id fontWeight = [properties valueForKey:@"font-weight"];
		id fontFamily = [properties valueForKey:@"font-family"];
		id fontSize = [properties valueForKey:@"font-size"];
		id fontStyle = [properties valueForKey:@"font-style"];
		if (fontWeight!=nil || fontFamily!=nil || fontSize!=nil || fontStyle!=nil)
		{
			NSMutableDictionary* font = [properties valueForKey:@"font"];
			if (font==nil)
			{
				font = [NSMutableDictionary dictionary];
			}
			if (fontWeight!=nil)
			{
				[font setObject:fontWeight forKey:@"fontWeight"];
			}
			if (fontFamily!=nil)
			{
				//TODO: now to deal with comma-separated list?
				[font setObject:fontFamily forKey:@"fontFamily"];
			}
			if (fontSize!=nil)
			{
				[font setObject:fontSize forKey:@"fontSize"];
			}
			if (fontStyle!=nil)
			{
				[font setObject:fontStyle forKey:@"fontStyle"];
			}
			[(NSMutableDictionary*)properties setObject:font forKey:@"font"];
		}
	}
	[super _initWithProperties:properties];
}

-(NSMutableDictionary*)langConversionTable
{
    return nil;
}


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

-(void)dealloc
{
	[self _destroy];
	
	RELEASE_TO_NIL(pendingAdds);
	RELEASE_TO_NIL(destroyLock);
	pthread_rwlock_destroy(&childrenLock);
	
	//Dealing with children is in _destroy, which is called by super dealloc.
	
	[super dealloc];
}

-(BOOL)windowHasOpened
{
	return windowOpened;
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
	IGNORE_IF_NOT_OPENED
	[self layoutChild:arg optimize:NO]; 
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
	TiGradient * newGradient = [TiGradient gradientFromObject:arg proxy:self];
	[self replaceValue:newGradient forKey:@"backgroundGradient" notification:YES];
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
		[self childAdded:arg];
		
		// only call layout if the view is attached
		[self layoutChildOnMainThread:arg];
	}
	else
	{
		pthread_rwlock_wrlock(&childrenLock);
		if (windowOpened)
		{
			pthread_rwlock_unlock(&childrenLock);
			[self performSelectorOnMainThread:@selector(add:) withObject:arg waitUntilDone:NO];
			return;
		}
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
	BOOL viewIsInChildren = [children containsObject:arg];
	if (viewIsInChildren==NO)
	{
		pthread_rwlock_unlock(&childrenLock);
		NSLog(@"[WARN] called remove for %@ on %@, but %@ isn't a child or has already been removed",arg,self,arg);
		return;
	}

	[self childRemoved:arg];

	[children removeObject:arg];
	if ([children count]==0)
	{
		RELEASE_TO_NIL(children);
	}
	pthread_rwlock_unlock(&childrenLock);
		
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
				[self layoutChildren:NO];
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
	[self windowWillOpen]; // we need to manually attach the window if you're animating
	[parent layoutChildrenIfNeeded];
	[[self view] animate:arg];
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

-(void)setParent:(TiViewProxy*)parent_
{
	parent = parent_;
	
	if (view!=nil)
	{
		[view setParent:parent_];
	}
	
	if (parent_!=nil && [parent windowHasOpened])
	{
		[self windowWillOpen];
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
	return view!=nil && windowOpened;
}

//CAUTION: TO BE USED ONLY WITH TABLEVIEW MAGIC
-(void)setView:(TiUIView *)newView
{
	[view release];
	view = [newView retain];
	if (self.modelDelegate!=nil && [self.modelDelegate respondsToSelector:@selector(detachProxy)])
	{
		[self.modelDelegate detachProxy];
		self.modelDelegate=nil;
	}
	self.modelDelegate = newView;
}

-(BOOL)shouldDetachViewOnUnload
{
	return YES;
}

-(void)detachView
{
	[destroyLock lock];
	if (view!=nil)
	{
		[self viewWillDetach];
		// hold the view during detachment
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
	[destroyLock unlock];
}

-(void)windowWillOpen
{
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

-(void)windowWillClose
{
	pthread_rwlock_rdlock(&childrenLock);
	for (TiViewProxy *child in children)
	{
		[child windowWillClose];
	}
	pthread_rwlock_unlock(&childrenLock);
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

-(BOOL)windowIsOpening
{
	return windowOpening;
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
		WARN_IF_BACKGROUND_THREAD
#ifdef VERBOSE
		if(![NSThread isMainThread])
		{
			NSLog(@"[WARN] Break here");
		}
#endif
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

		pthread_rwlock_rdlock(&childrenLock);
		for (id child in self.children)
		{
			TiUIView *childView = [(TiViewProxy*)child view];
			[view addSubview:childView];
		}
		pthread_rwlock_unlock(&childrenLock);
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

-(BOOL)needsZIndexRepositioning
{
	return needsZIndexRepositioning;
}

-(void)setNeedsZIndexRepositioning
{
	needsZIndexRepositioning = YES;
	if (!windowOpened||[self viewAttached]==NO)
	{
		[[self parent] setNeedsZIndexRepositioning];
	}
	else
	{
		[(TiUIView*)[self view] performZIndexRepositioning];
		//[self layoutChildren:NO];
	}
}


-(UIView *)parentViewForChild:(TiViewProxy *)child
{
	return view;
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

	if(TiLayoutRuleIsVertical(layoutProperties.layout))
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
	
	if (optimize==NO)
	{
		TiUIView *childView = [child view];
		if ([childView superview]!=ourView)
		{	
			//TODO: Optimize!
			int insertPosition = 0;
			CGFloat zIndex = [childView zIndex];
			
			pthread_rwlock_rdlock(&childrenLock);
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
			
			[ourView insertSubview:childView atIndex:insertPosition];
			[self childWillResize:child];
			pthread_rwlock_unlock(&childrenLock);
		}
	}
	[[child view] updateLayout:NULL withBounds:bounds];
	
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
	pthread_rwlock_rdlock(&childrenLock);
	for (id child in self.children)
	{
		[self layoutChild:child optimize:optimize];
	}
	pthread_rwlock_unlock(&childrenLock);
	if (optimize==NO)
	{
		OSAtomicTestAndClearBarrier(NEEDS_LAYOUT_CHILDREN, &dirtyflags);
	}
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
	TiUIView* proxyView = [self view];
	
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
	else {
		[self.view listenerAdded:type count:count];
	}
}

-(void)_listenerRemoved:(NSString*)type count:(int)count
{
	if (self.modelDelegate!=nil && [(NSObject*)self.modelDelegate respondsToSelector:@selector(listenerRemoved:count:)])
	{
		[self.modelDelegate listenerRemoved:type count:count];
	}
	else {
		[self.view listenerRemoved:type count:count];
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
	BOOL isVertical = TiLayoutRuleIsVertical(layoutProperties.layout);
	BOOL isHorizontal = TiLayoutRuleIsHorizontal(layoutProperties.layout);
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
		
		[self repositionIfNeeded];

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
	IGNORE_IF_NOT_OPENED
	
	pthread_rwlock_rdlock(&childrenLock);
	BOOL containsChild = [children containsObject:child];
	pthread_rwlock_unlock(&childrenLock);

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
	IGNORE_IF_NOT_OPENED
	
	OSAtomicTestAndClearBarrier(NEEDS_REPOSITION, &dirtyflags);
	[[self view] relayout:bounds];
	[self layoutChildren:NO];
}

-(void)reposition
{
	IGNORE_IF_NOT_OPENED
	
	UIView* superview = [[self view] superview];
	if (![self viewAttached] || view.hidden || superview == nil)
	{
		return;
	}
	if ([NSThread isMainThread])
	{	//NOTE: This will cause problems with ScrollableView, or is a new wrapper needed?
		[parent childWillResize:self];
		if (needsZIndexRepositioning)
		{
			[(TiUIView*)[self view] performZIndexRepositioning];
			needsZIndexRepositioning=NO;
		}
		[self repositionWithBounds:superview.bounds];
	}
	else 
	{
		[self performSelectorOnMainThread:@selector(reposition) withObject:nil waitUntilDone:NO];
	}

}

-(void)repositionIfNeeded
{
	IGNORE_IF_NOT_OPENED
	
	BOOL wasSet=OSAtomicTestAndClearBarrier(NEEDS_REPOSITION, &dirtyflags);
	if (wasSet && [self viewAttached])
	{
		[self reposition];
	}
}

-(void)setNeedsReposition
{
	IGNORE_IF_NOT_OPENED
	
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

-(void)setSize:(id)value
{
	ENSURE_DICT(value);
	layoutProperties.width = TiDimensionFromObject([value objectForKey:@"width"]);
 	layoutProperties.height = TiDimensionFromObject([value objectForKey:@"height"]);
	[self setNeedsReposition];
}

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


-(void)refreshView:(TiUIView *)transferView
{
	WARN_IF_BACKGROUND_THREAD;

//TODO: Reliable way to know when to skip.

	if(OSAtomicTestAndClearBarrier(TiRefreshViewSize, &dirtyflags))
	{
		[self refreshSize];
	}
	else if(transferView != nil)
	{
		[transferView setBounds:sizeCache];
	}

	if(OSAtomicTestAndClearBarrier(TiRefreshViewPosition, &dirtyflags))
	{
		[self refreshPosition];
	}
	else if(transferView != nil)
	{
		[transferView setCenter:positionCache];
	}

//We should only recurse if we're a non-absolute layout. Otherwise, the views can take care of themselves.
	if((transferView == nil) && OSAtomicTestAndClearBarrier(TiRefreshViewPosition, &dirtyflags))
	//If transferView is non-nil, this will be managed by the table row.
	{
		
	}

	if(OSAtomicTestAndClearBarrier(TiRefreshViewZIndex, &dirtyflags) || (transferView != nil))
	{
		[self refreshZIndex];
	}
	
	

}

-(void)refreshZIndex
{
	OSAtomicTestAndClearBarrier(TiRefreshViewZIndex, &dirtyflags);

}

-(void)refreshPosition
{
	OSAtomicTestAndClearBarrier(TiRefreshViewPosition, &dirtyflags);

}

-(void)refreshSize
{
	OSAtomicTestAndClearBarrier(TiRefreshViewSize, &dirtyflags);


}


#define SET_AND_PERFORM(flagBit,action)	\
if(OSAtomicTestAndSetBarrier(flagBit, &dirtyflags))	\
{	\
	action;	\
}

-(void)willChangeSize
{
	SET_AND_PERFORM(TiRefreshViewSize,return);

	if (!TiLayoutRuleIsAbsolute(layoutProperties.layout))
	{
		[self willChangeLayout];
	}
	if(TiDimensionIsUndefined(layoutProperties.centerX) ||
			TiDimensionIsUndefined(layoutProperties.centerY))
	{
		[self willChangePosition];
	}

	[parent contentsWillChange];
	pthread_rwlock_rdlock(&childrenLock);
	for (TiViewProxy * thisChild in children)
	{
		[thisChild parentSizeWillChange];
	}
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
	[parent contentsWillChange];
}

-(void)willChangeZIndex
{
	SET_AND_PERFORM(TiRefreshViewZIndex,);
	//Nothing cascades from here.
}

-(void)willChangeVisibility
{
	SET_AND_PERFORM(TiRefreshViewZIndex,);
	[parent contentsWillChange];
}

-(void)willChangeLayout
{
	SET_AND_PERFORM(TiRefreshViewChildrenPosition,return);
	pthread_rwlock_rdlock(&childrenLock);
	for (TiViewProxy * thisChild in children)
	{
		[thisChild parentWillRelay];
	}
	pthread_rwlock_unlock(&childrenLock);
}

-(void)contentsWillChange
{
	if (TiDimensionIsAuto(layoutProperties.width) ||
			TiDimensionIsAuto(layoutProperties.height))
	{
		[self willChangeSize];
	}
	else if (!TiLayoutRuleIsAbsolute(layoutProperties.layout))
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

@end
