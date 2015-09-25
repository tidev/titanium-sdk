/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiViewProxy.h"
#import "TiApp.h"
#import "TiBlob.h"
#import "TiAction.h"
#import "TiStylesheet.h"
#import "TiLocale.h"
#import "TiUIView.h"
#import "TiApp.h"

#import <QuartzCore/QuartzCore.h>
#import <libkern/OSAtomic.h>
#import <pthread.h>

#import "TiControllerProtocols.h"

#define IGNORE_IF_NOT_OPENED if (!windowOpened||[self viewAttached]==NO) return;

static NSArray* touchEventsArray;

@implementation TiViewProxy

@synthesize eventOverrideDelegate = eventOverrideDelegate;

#pragma mark public API

@synthesize vzIndex, parentVisible;
-(void)setVzIndex:(int)newZindex
{
	if(newZindex == vzIndex)
	{
		return;
	}

	vzIndex = newZindex;
	[self replaceValue:NUMINT(vzIndex) forKey:@"vzIndex" notification:NO];
    if (parent != nil) {
        [parent insertSubview:view forProxy:self];
    }
}

@synthesize children;
-(NSArray*)children
{
    if (![NSThread isMainThread]) {
        __block NSArray* result = nil;
        TiThreadPerformOnMainThread(^{
            result = [[self children] retain];
        }, YES);
        return [result autorelease];
    }
    
	pthread_rwlock_rdlock(&childrenLock);
    NSArray* copy = [children mutableCopy];
	pthread_rwlock_unlock(&childrenLock);
	return ((copy != nil) ? [copy autorelease] : [NSMutableArray array]);
}

-(NSString*)apiName
{
    return @"Ti.View";
}

-(void)setVisible:(NSNumber *)newVisible withObject:(id)args
{
	[self setHidden:![TiUtils boolValue:newVisible def:YES] withArgs:args];
	[self replaceValue:newVisible forKey:@"visible" notification:YES];
}

-(void)setTempProperty:(id)propVal forKey:(id)propName {
    if (layoutPropDictionary == nil) {
        layoutPropDictionary = [[NSMutableDictionary alloc] init];
    }
    
    if (propVal != nil && propName != nil) {
        [layoutPropDictionary setObject:propVal forKey:propName];
    }
}

-(void)setProxyObserver:(id)arg
{
    observer = arg;
}

-(void)processTempProperties:(NSDictionary*)arg
{
    //arg will be non nil when called from updateLayout
    if (arg != nil) {
        NSEnumerator *enumerator = [arg keyEnumerator];
        id key;
        while ((key = [enumerator nextObject])) {
            [self setTempProperty:[arg objectForKey:key] forKey:key];
        }
    }
    
    if (layoutPropDictionary != nil) {
        [self setValuesForKeysWithDictionary:layoutPropDictionary];
        RELEASE_TO_NIL(layoutPropDictionary);
    }
}

-(BOOL) belongsToContext:(id<TiEvaluator>) context
{
    id<TiEvaluator> myContext = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
    return (context == myContext);
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

	int position = -1;
	TiViewProxy *childView = nil;

	if([arg isKindOfClass:[NSDictionary class]]) {
		childView = [arg objectForKey:@"view"];
		position = [TiUtils intValue:[arg objectForKey:@"position"] def:-1];
	} else if([arg isKindOfClass:[TiViewProxy class]]) {
		childView = arg;
	}

	if(childView == nil) {
		DeveloperLog(@"[WARN] 'add' and 'insertAt' must be contain a view. Returning");
		return;
	}

	if ([childView conformsToProtocol:@protocol(TiWindowProtocol)]) {
		DebugLog(@"[WARN] Can not add a window as a child of a view. Returning");
		return;
	}

	if (children==nil) {
		children = [[NSMutableArray alloc] init];
	}
    
#ifdef TI_USE_KROLL_THREAD
	if ([NSThread isMainThread]) {
#else
        [self rememberProxy:childView];
#endif
		pthread_rwlock_wrlock(&childrenLock);
		if(position < 0 || position > [children count]) {
			position = (int)[children count];
		}
		[children insertObject:childView atIndex:position];
		//Turn on clipping because I have children
		[[self view] updateClipping];

//        [self rearrageSubviews];
        [self insertSubview:[childView view] forProxy:childView];
        
		pthread_rwlock_unlock(&childrenLock);
		[childView setParent:self];
		
		//If layout is non absolute push this into the layout queue
		//else just layout the child with current bounds
#ifdef TI_USE_KROLL_THREAD
	}
	else
	{
		[self rememberProxy:childView];
		if (windowOpened)
		{
			TiThreadPerformOnMainThread(^{[self add:arg];}, NO);
			return;
		}
		pthread_rwlock_wrlock(&childrenLock);
		if(position < 0 || position > [children count]) {
			position = (int)[children count];
		}
		[children insertObject:childView atIndex:position];
		pthread_rwlock_unlock(&childrenLock);
		[childView setParent:self];
	}
#endif
}

-(void)insertAt:(id)args
{
	ENSURE_SINGLE_ARG(args, NSDictionary);
	[self add:args];
}

-(void)replaceAt:(id)args
{
	ENSURE_SINGLE_ARG(args, NSDictionary);
	NSInteger position = [TiUtils intValue:[args objectForKey:@"position"] def:-1];
	NSArray *childrenArray = [self children];
	if(childrenArray != nil && position > -1 && [childrenArray count] > position) {
		TiViewProxy *childToRemove = [[childrenArray objectAtIndex:position] retain];
		[self add:args];
		[self remove: childToRemove];
		[childToRemove autorelease];
	}
}

-(void)remove:(id)arg
{
	ENSURE_SINGLE_ARG(arg,TiViewProxy);
	ENSURE_UI_THREAD_1_ARG(arg);

	pthread_rwlock_wrlock(&childrenLock);
	NSMutableArray* childrenCopy = [children mutableCopy];
	if ([children containsObject:arg]) {
		[children removeObject:arg];
	}
	pthread_rwlock_unlock(&childrenLock);
	
	if([childrenCopy containsObject:arg]) {
		[arg windowWillClose];
		[arg setParentVisible:NO];
		[arg setParent:nil];
		[arg windowDidClose];
		[self forgetProxy:arg];
		[childrenCopy removeObject:arg];
//		[self contentsWillChange];
	}
	[childrenCopy release];
}

-(void)removeAllChildren:(id)arg
{
    ENSURE_UI_THREAD_1_ARG(arg);
    pthread_rwlock_wrlock(&childrenLock);
    NSMutableArray* childrenCopy = [children mutableCopy];
    [children removeAllObjects];
    RELEASE_TO_NIL(children);
    pthread_rwlock_unlock(&childrenLock);
    for (TiViewProxy* theChild in childrenCopy) {
        [theChild windowWillClose];
        [theChild setParentVisible:NO];
        [theChild setParent:nil];
        [theChild windowDidClose];
        [self forgetProxy:theChild];
    }
    [childrenCopy removeAllObjects];
	[childrenCopy release];
//    [self contentsWillChange];
}

-(void)show:(id)arg
{
	TiThreadPerformOnMainThread(^{
        [self setHidden:NO withArgs:arg];
        [self replaceValue:NUMBOOL(YES) forKey:@"visible" notification:YES];
    }, NO);
}
 
-(void)hide:(id)arg
{
    TiThreadPerformOnMainThread(^{
        [self setHidden:YES withArgs:arg];
        [self replaceValue:NUMBOOL(NO) forKey:@"visible" notification:YES];
    }, NO);
}

-(void)animate:(id)arg
{
    /*
    */
    
    if ([arg isKindOfClass:[NSArray class]]) {
        id firstArg = [arg objectAtIndex:0];
        if ([firstArg isKindOfClass:[NSDictionary class]]) {
            
            NSDictionary* properties = [arg objectAtIndex:0];
            KrollCallback* callback = nil;
            if ([arg count] > 1) {
                callback = [arg objectAtIndex:1];
            }
            NSUInteger duration = [TiUtils intValue:[properties valueForKey:@"duration"] def:300];
            
            TiThreadPerformOnMainThread(^{
                [[self view] animateProperties:properties
                                  withDuration:duration andCallback:^(BOOL finished) {
                                      if (callback != nil) {
                                          
                                          [callback call:@[] thisObject:self];
                                      }
                                  }];
            }, NO);

            return;
        }
    }
    
	TiAnimation * newAnimation = [TiAnimation animationFromArg:arg context:[self executionContext] create:NO];
	[self rememberProxy:newAnimation];
	TiThreadPerformOnMainThread(^{
		if ([view superview]==nil)
		{
			VerboseLog(@"Entering animation without a superview Parent is %@, props are %@",parent,dynprops);
		}
		[self windowWillOpen]; // we need to manually attach the window if you're animating
//		[parent layoutChildrenIfNeeded];
		[[self view] animate:newAnimation];
	}, NO);
}

-(void)setAnimation:(id)arg
{	//We don't actually store the animation this way.
	//Because the setter doesn't have the argument array, we will be passing a nonarray to animate:
	//In this RARE case, this is okay, because TiAnimation animationFromArg handles with or without array.
	[self animate:arg];
}

#define CHECK_LAYOUT_UPDATE(layoutName,value) \
if (ENFORCE_BATCH_UPDATE) { \
    if (updateStarted) { \
        [self setTempProperty:value forKey:@#layoutName]; \
        return; \
    } \
    else if(!allowLayoutUpdate){ \
        return; \
    } \
}

#define LAYOUTPROPERTIES_SETTER_IGNORES_AUTO(methodName,layoutName,converter,postaction)	\
-(void)methodName:(id)value	\
{	\
    CHECK_LAYOUT_UPDATE(layoutName,value) \
    TiDimension result = converter(value);\
    if ( TiDimensionIsDip(result) || TiDimensionIsPercent(result) ) {\
        layoutProperties.layoutName = result;\
    }\
    else {\
        if (!TiDimensionIsUndefined(result)) {\
            DebugLog(@"[WARN] Invalid value %@ specified for property %@",[TiUtils stringValue:value],@#layoutName); \
        } \
        layoutProperties.layoutName = TiDimensionUndefined;\
    }\
    [self replaceValue:value forKey:@#layoutName notification:YES];	\
    postaction; \
}

#define LAYOUTPROPERTIES_SETTER(methodName,layoutName,converter,postaction)	\
-(void)methodName:(id)value	\
{	\
    CHECK_LAYOUT_UPDATE(layoutName,value) \
    layoutProperties.layoutName = converter(value);	\
    [self replaceValue:value forKey:@#layoutName notification:YES];	\
    postaction; \
}

#define LAYOUTFLAGS_SETTER(methodName,layoutName,flagName,postaction)	\
-(void)methodName:(id)value	\
{	\
	CHECK_LAYOUT_UPDATE(layoutName,value) \
	layoutProperties.layoutFlags.flagName = [TiUtils boolValue:value];	\
	[self replaceValue:value forKey:@#layoutName notification:NO];	\
	postaction; \
}


-(TiRect*)size
{
	TiRect *rect = [[TiRect alloc] init];
    if ([self viewAttached]) {
        [self makeViewPerformSelector:@selector(fillBoundsToRect:) withObject:rect createIfNeeded:YES waitUntilDone:YES];
        id defaultUnit = [[TiApp tiAppProperties] objectForKey:@"ti.ui.defaultunit"];
        if ([defaultUnit isKindOfClass:[NSString class]]) {
            [rect convertToUnit:defaultUnit];
        }
    }
    else {
        [rect setRect:CGRectZero];
    }
    
    return [rect autorelease];
}

-(TiRect*)rect
{
    TiRect *rect = [[TiRect alloc] init];
	if ([self viewAttached]) {
        __block CGRect viewRect;
        __block CGPoint viewPosition;
        __block CGAffineTransform viewTransform;
        __block CGPoint viewAnchor;
        TiThreadPerformOnMainThread(^{
            TiUIView * ourView = [self view];
            viewRect = [ourView bounds];
            viewPosition = [ourView center];
            viewTransform = [ourView transform];
            viewAnchor = [[ourView layer] anchorPoint];
        }, YES);
        viewRect.origin = CGPointMake(-viewAnchor.x*viewRect.size.width, -viewAnchor.y*viewRect.size.height);
        viewRect = CGRectApplyAffineTransform(viewRect, viewTransform);
        viewRect.origin.x += viewPosition.x;
        viewRect.origin.y += viewPosition.y;
        [rect setRect:viewRect];
        
        id defaultUnit = [[TiApp tiAppProperties] objectForKey:@"ti.ui.defaultunit"];
        if ([defaultUnit isKindOfClass:[NSString class]]) {
            [rect convertToUnit:defaultUnit];
        }       
    }
    else {
        [rect setRect:CGRectZero];
    }
    return [rect autorelease];
}

-(id)zIndex
{
    return [self valueForUndefinedKey:@"zindex_"];
}

-(void)setZIndex:(id)value
{
    if ([value respondsToSelector:@selector(intValue)]) {
        [self setVzIndex:[TiUtils intValue:value]];
        [self replaceValue:value forKey:@"zindex_" notification:NO];
    }
}

-(TiPoint*)center
{
    return [[[TiPoint alloc] initWithPoint:[[self view] center]] autorelease];
}

-(id)animatedCenter
{
	if (![self viewAttached])
	{
		return nil;
	}
	__block CGPoint result;
	TiThreadPerformOnMainThread(^{
		UIView * ourView = view;
		CALayer * ourLayer = [ourView layer];
		CALayer * animatedLayer = [ourLayer presentationLayer];
	
		if (animatedLayer !=nil) {
			result = [animatedLayer position];
		}
		else {
			result = [ourLayer position];
		}
	}, YES);
	//TODO: Should this be a TiPoint? If so, the accessor fetcher might try to
	//hold onto the point, which is undesired.
	return [NSDictionary dictionaryWithObjectsAndKeys:NUMFLOAT(result.x),@"x",NUMFLOAT(result.y),@"y", nil];
}

-(void)setBackgroundGradient:(id)arg
{
	TiGradient * newGradient = [TiGradient gradientFromObject:arg proxy:self];
	[self replaceValue:newGradient forKey:@"backgroundGradient" notification:YES];
}

-(TiBlob*)toImage:(id)args
{
    KrollCallback *callback = nil;
    
    NSObject *obj = nil;
    if( [args count] > 0) {
        obj = [args objectAtIndex:0];
        
        if (obj == [NSNull null]) {
            obj = nil;
        }
    }
    callback = (KrollCallback*)obj;
	TiBlob *blob = [[[TiBlob alloc] init] autorelease];
	// we spin on the UI thread and have him convert and then add back to the blob
	// if you pass a callback function, we'll run the render asynchronously, if you
	// don't, we'll do it synchronously
	TiThreadPerformOnMainThread(^{
		BOOL viewIsAttached = [self viewAttached];
		if (!viewIsAttached) {
			[self windowWillOpen];
		}
		TiUIView *myview = [self view];
		CGSize size = myview.bounds.size;
//		if (CGSizeEqualToSize(size, CGSizeZero) || size.width==0 || size.height==0)
//		{
//			CGFloat width = [self autoWidthForSize:CGSizeMake(1000,1000)];
//			CGFloat height = [self autoHeightForSize:CGSizeMake(width,0)];
//			if (width > 0 && height > 0)
//			{
//				size = CGSizeMake(width, height);
//			}
//			if (CGSizeEqualToSize(size, CGSizeZero) || width==0 || height == 0)
//			{
//				size = [UIScreen mainScreen].bounds.size;
//			}
//			CGRect rect = CGRectMake(0, 0, size.width, size.height);
//			[TiUtils setView:myview positionRect:rect];
//		}
		UIGraphicsBeginImageContextWithOptions(size, [myview.layer isOpaque], 0);
		[myview.layer renderInContext:UIGraphicsGetCurrentContext()];
		UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
		[blob setImage:image];
        [blob setMimeType:@"image/png" type:TiBlobTypeImage];
		UIGraphicsEndImageContext();
		if (callback != nil)
		{
			NSDictionary *event = [NSDictionary dictionaryWithObject:blob forKey:@"blob"];
			[self _fireEventToListener:@"blob" withObject:event listener:callback thisObject:nil];
		}
	}, (callback==nil));
	
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

-(void)setHidden:(BOOL)newHidden withArgs:(id)args
{
	hidden = newHidden;
    [[self view] setHidden:hidden];
}

-(UIBarButtonItem*)barButtonItem
{
	if (barButtonItem == nil)
	{
		isUsingBarButtonItem = YES;
        TiUIView* customView = [self view];
        BOOL isHidden = [customView isHidden];
        [customView setHidden:YES];
        [customView setOnLayout:^(TiLayoutView *sender, CGRect rect) {
            [sender setHidden: isHidden];
            [sender setOnLayout:nil];
        }];
        barButtonItem = [[UIBarButtonItem alloc] initWithCustomView:customView];
	}
	return barButtonItem;
}


#pragma mark Recognizers

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

		view.proxy = self;
		view.layer.transform = CATransform3DIdentity;
		view.transform = CGAffineTransformIdentity;

		[view initializeState];

		// fire property changes for all properties to our delegate
		[self firePropertyChanges];

		[view configurationSet];
		[view updateClipping];
		viewInitialized = YES;
#ifdef TI_USE_KROLL_THREAD
        NSArray * childrenArray = [[self children] retain];
        for (id child in childrenArray)
        {
            TiUIView *childView = [(TiViewProxy*)child view];
            [self insertSubview:childView forProxy:child];
        }
        
        [childrenArray release];
#endif
        [self viewDidAttach];
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
-(BOOL)optimizeSubviewInsertion
{
    //Return YES for any view that implements a wrapperView that is a TiUIView (Button and ScrollView currently) and a basic view
    return ( [view isMemberOfClass:[TiUIView class]] ) ;
}

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

//    BOOL absoluteLayout = TiLayoutRuleIsAbsolute(layoutProperties.layoutStyle);

    // If the window was previously opened, it may need to have
    // its existing children redrawn
    // Maybe need to call layout children instead for non absolute layout
    if (children != nil) {
        for (TiViewProxy* child in children) {
//            if (absoluteLayout) {
//                [self layoutChild:child optimize:NO withMeasuredBounds:[[self size] rect]];
//            }
            [child windowWillOpen];
        }
    }

    pthread_rwlock_unlock(&childrenLock);

    //TIMOB-17923 - Do a full layout pass (set proper sandbox) if non absolute layout
//    if (!absoluteLayout) {
//        [self layoutChildren:NO];
//    }
}

-(void)windowDidOpen
{
	windowOpening = NO;
	for (TiViewProxy *child in [self children])
	{
		[child windowDidOpen];
	}
}

-(void)windowWillClose
{
	[[self children] makeObjectsPerformSelector:@selector(windowWillClose)];
}

-(void)windowDidClose
{
	for (TiViewProxy *child in [self children])
	{
		[child windowDidClose];
	}
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
	CGRect result = [[[[TiApp app] controller] view] bounds];
	return result;
}


#pragma mark Building up and Tearing down

-(id)init
{
	if ((self = [super init]))
	{
		destroyLock = [[NSRecursiveLock alloc] init];
		pthread_rwlock_init(&childrenLock, NULL);
		_bubbleParent = YES;
	}
	return self;
}

-(void)_initWithProperties:(NSDictionary*)properties
{
    updateStarted = YES;
    allowLayoutUpdate = NO;
	// Set horizontal layout wrap:true as default 
//	layoutProperties.layoutFlags.horizontalWrap = YES;
	[self initializeProperty:@"horizontalWrap" defaultValue:NUMBOOL(YES)];
	[self initializeProperty:@"visible" defaultValue:NUMBOOL(YES)];

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
    updateStarted = NO;
    allowLayoutUpdate = YES;
    [self processTempProperties:nil];
    allowLayoutUpdate = NO;

}

-(void)dealloc
{
//	RELEASE_TO_NIL(pendingAdds);
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
	
	if ([view respondsToSelector:@selector(readProxyValuesWithKeys:)]) {
		id<NSFastEnumeration> values = [self allKeys];
		[view readProxyValuesWithKeys:values];
	}

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
		DeveloperLog(@"[WARN] No TiView for Proxy: %@, couldn't find class: %@",self,proxyName);
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

    [[self children] makeObjectsPerformSelector:@selector(detachView)];
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
#ifdef TI_USE_KROLL_THREAD
			TiThreadReleaseOnMainThread(barButtonItem, NO);
			barButtonItem = nil;
#else
            TiThreadPerformOnMainThread(^{
                RELEASE_TO_NIL(barButtonItem);
            }, NO);
#endif
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
#ifdef TI_USE_KROLL_THREAD
			TiThreadReleaseOnMainThread(view, NO);
			view = nil;
#else
            TiThreadPerformOnMainThread(^{
                RELEASE_TO_NIL(view);
            }, YES);
#endif
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

-(void)animationCompleted:(TiAnimation*)animation
{
	[self forgetProxy:animation];
	[[self view] animationCompleted];
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
		TiThreadPerformOnMainThread(^{[[self view] performSelector:selector withObject:object];}, wait);
		return;
	}

	TiThreadPerformOnMainThread(^{
		[[self view] performSelector:selector withObject:object];
	}, wait);
}

#pragma mark Listener Management

-(void)addEventListener:(NSArray*)args
{
    if (_hasPostLayoutEvent == NO) {
        _hasPostLayoutEvent = [[args objectAtIndex:0] isEqual:@"postlayout"];
    }
    [super addEventListener:args];
}
-(BOOL)_hasListeners:(NSString *)type checkParent:(BOOL)check
{
    BOOL returnVal = [super _hasListeners:type];
    if (!returnVal && check) {
        returnVal = [[self parentForBubbling] _hasListeners:type];
    }
	return returnVal;
}
-(BOOL)_hasListeners:(NSString *)type
{
	return [self _hasListeners:type checkParent:YES];
}

-(BOOL)checkTouchEvent:(NSString*)event
{
    if (touchEventsArray == nil) {
        touchEventsArray = [[NSArray arrayWithObjects:@"touchstart",@"touchend",@"touchmove",@"touchcancel",
                            @"click",@"dblclick",@"singletap",@"doubletap",@"twofingertap",
                            @"swipe", @"pinch", @"longpress", nil] retain];
    }
    
    return [touchEventsArray containsObject:event];
}

//TODO: Remove once we've properly deprecated.
-(void)fireEvent:(NSString*)type withObject:(id)obj withSource:(id)source propagate:(BOOL)propagate reportSuccess:(BOOL)report errorCode:(int)code message:(NSString*)message;
{
	// Note that some events (like movie 'complete') are fired after the view is removed/dealloc'd.
	// Because of the handling below, we can safely set the view to 'nil' in this case.
	TiUIView* proxyView = [self viewAttached] ? view : nil;
	//TODO: We have to do view instead of [self view] because of a freaky race condition that can
	//happen in the background (See bug 2809). This assumes that view == [self view], which may
	//not always be the case in the future. Then again, we shouldn't be dealing with view in the BG...
	
	
	// Have to handle the situation in which the proxy's view might be nil... like, for example,
	// with table rows.  Automagically assume any nil view we're firing an event for is A-OK.
    // NOTE: We want to fire postlayout events on ANY view, even those which do not allow interactions.
	BOOL isTouchEvent = [self checkTouchEvent:type];
	if (proxyView == nil || !isTouchEvent || (isTouchEvent && [proxyView interactionEnabled])) {
		[super fireEvent:type withObject:obj withSource:source propagate:propagate reportSuccess:report errorCode:code message:message];
	}
}

-(void)fireEvent:(NSString*)type withObject:(id)obj propagate:(BOOL)propagate reportSuccess:(BOOL)report errorCode:(NSInteger)code message:(NSString*)message;
{
	// Note that some events (like movie 'complete') are fired after the view is removed/dealloc'd.
	// Because of the handling below, we can safely set the view to 'nil' in this case.
	TiUIView* proxyView = [self viewAttached] ? view : nil;
	//TODO: We have to do view instead of [self view] because of a freaky race condition that can
	//happen in the background (See bug 2809). This assumes that view == [self view], which may
	//not always be the case in the future. Then again, we shouldn't be dealing with view in the BG...
	
	
	// Have to handle the situation in which the proxy's view might be nil... like, for example,
	// with table rows.  Automagically assume any nil view we're firing an event for is A-OK.
    // NOTE: We want to fire postlayout events on ANY view, even those which do not allow interactions.
	BOOL isTouchEvent = [self checkTouchEvent:type];
	if (proxyView == nil || !isTouchEvent || (isTouchEvent && [proxyView interactionEnabled])) {
		if (eventOverrideDelegate != nil) {
			obj = [eventOverrideDelegate overrideEventObject:obj forEvent:type fromViewProxy:self];
		}
		[super fireEvent:type withObject:obj propagate:propagate reportSuccess:report errorCode:code message:message];
	}
}

-(void)parentListenersChanged
{
    TiThreadPerformOnMainThread(^{
        if (view != nil && [view respondsToSelector:@selector(updateTouchHandling)]) {
            [view updateTouchHandling];
        }
    }, NO);
}

-(void)_listenerAdded:(NSString*)type count:(int)count
{
	if (self.modelDelegate!=nil && [(NSObject*)self.modelDelegate respondsToSelector:@selector(listenerAdded:count:)])
	{
		[self.modelDelegate listenerAdded:type count:count];
	}
	else if(view!=nil) // don't create the view if not already realized
	{
		if ([self.view respondsToSelector:@selector(listenerAdded:count:)]) {
			[self.view listenerAdded:type count:count];
		}
	}
    
    //TIMOB-15991 Update children as well
	NSArray* childrenArray = [[self children] retain];
    for (id child in childrenArray) {
        if ([child respondsToSelector:@selector(parentListenersChanged)]) {
            [child parentListenersChanged];
        }
    }
	[childrenArray release];
}

-(void)_listenerRemoved:(NSString*)type count:(int)count
{
	if (self.modelDelegate!=nil && [(NSObject*)self.modelDelegate respondsToSelector:@selector(listenerRemoved:count:)])
	{
		[self.modelDelegate listenerRemoved:type count:count];
	}
	else if(view!=nil) // don't create the view if not already realized
	{
		if ([self.view respondsToSelector:@selector(listenerRemoved:count:)]) {
			[self.view listenerRemoved:type count:count];
		}
	}

    //TIMOB-15991 Update children as well
    NSArray* childrenArray = [[self children] retain];
    for (id child in childrenArray) {
        if ([child respondsToSelector:@selector(parentListenersChanged)]) {
            [child parentListenersChanged];
        }
    }
    [childrenArray release];
}

-(TiProxy *)parentForBubbling
{
	return parent;
}

#pragma mark Layout events, internal and external

#define SET_AND_PERFORM(flagBit,action)	\
if(OSAtomicTestAndSetBarrier(flagBit, &dirtyflags))	\
{	\
	action;	\
}

-(void)insertSubview:(UIView *)childView forProxy:(TiViewProxy *)childProxy
{
    UIView * ourView = [self parentViewForChild:nil];
    if (ourView == nil || childView == nil) {
        return;
    }
    
    NSArray *sortedArray = [[self children] sortedArrayUsingComparator:^NSComparisonResult(id a, id b) {
        int first = [(TiViewProxy*)a vzIndex];
        int second = [(TiViewProxy*)b vzIndex];
        return (first > second) ? NSOrderedDescending : ( first < second ? NSOrderedAscending : NSOrderedSame );
    }];
    
    NSInteger index = 0;
    for (TiViewProxy * thisChildProxy in sortedArray) {
        if ([thisChildProxy viewInitialized] ) {
            UIView* newView = [thisChildProxy view];
            [ourView insertSubview:newView atIndex:index++];
        }
    }
}


#pragma mark - Accessibility API

- (void)setAccessibilityLabel:(id)accessibilityLabel
{
	ENSURE_UI_THREAD(setAccessibilityLabel, accessibilityLabel);
	if ([self viewAttached]) {
		[[self view] setAccessibilityLabel_:accessibilityLabel];
	}
	[self replaceValue:accessibilityLabel forKey:@"accessibilityLabel" notification:NO];
}

- (void)setAccessibilityValue:(id)accessibilityValue
{
	ENSURE_UI_THREAD(setAccessibilityValue, accessibilityValue);
	if ([self viewAttached]) {
		[[self view] setAccessibilityValue_:accessibilityValue];
	}
	[self replaceValue:accessibilityValue forKey:@"accessibilityValue" notification:NO];
}

- (void)setAccessibilityHint:(id)accessibilityHint
{
	ENSURE_UI_THREAD(setAccessibilityHint, accessibilityHint);
	if ([self viewAttached]) {
		[[self view] setAccessibilityHint_:accessibilityHint];
	}
	[self replaceValue:accessibilityHint forKey:@"accessibilityHint" notification:NO];
}

- (void)setAccessibilityHidden:(id)accessibilityHidden
{
	ENSURE_UI_THREAD(setAccessibilityHidden, accessibilityHidden);
	if ([self viewAttached]) {
		[[self view] setAccessibilityHidden_:accessibilityHidden];
	}
	[self replaceValue:accessibilityHidden forKey:@"accessibilityHidden" notification:NO];
}

#pragma mark - View Templates

- (void)unarchiveFromTemplate:(id)viewTemplate_
{
	TiViewTemplate *viewTemplate = [TiViewTemplate templateFromViewTemplate:viewTemplate_];
	if (viewTemplate == nil) {
		return;
	}
	
	id<TiEvaluator> context = self.executionContext;
	if (context == nil) {
		context = self.pageContext;
	}
	
	[self _initWithProperties:viewTemplate.properties];
	if ([viewTemplate.events count] > 0) {
		[context.krollContext invokeBlockOnThread:^{
			[viewTemplate.events enumerateKeysAndObjectsUsingBlock:^(NSString *eventName, NSArray *listeners, BOOL *stop) {
				[listeners enumerateObjectsUsingBlock:^(KrollWrapper *wrapper, NSUInteger idx, BOOL *stop) {
					[self addEventListener:[NSArray arrayWithObjects:eventName, wrapper, nil]];
				}];
			}];
		}];		
	}
	
	[viewTemplate.childTemplates enumerateObjectsUsingBlock:^(TiViewTemplate *childTemplate, NSUInteger idx, BOOL *stop) {
		TiViewProxy *child = [[self class] unarchiveFromTemplate:childTemplate inContext:context];
		if (child != nil) {
			[context.krollContext invokeBlockOnThread:^{
				[self rememberProxy:child];
				[child forgetSelf];
			}];
			[self add:child];
		}
	}];
}

// Returns protected proxy, caller should do forgetSelf.
+ (TiViewProxy *)unarchiveFromTemplate:(id)viewTemplate_ inContext:(id<TiEvaluator>)context
{
	TiViewTemplate *viewTemplate = [TiViewTemplate templateFromViewTemplate:viewTemplate_];
	if (viewTemplate == nil) {
		return;
	}
	
	if (viewTemplate.type != nil) {
		TiViewProxy *proxy = [[self class] createProxy:viewTemplate.type withProperties:nil inContext:context];
		[context.krollContext invokeBlockOnThread:^{
			[context registerProxy:proxy];
			[proxy rememberSelf];
		}];
		[proxy unarchiveFromTemplate:viewTemplate];
		return proxy;
	}
	return nil;
}

-(void)hideKeyboard:(id)arg
{
	ENSURE_UI_THREAD_1_ARG(arg);
	if (view != nil)
		[self.view endEditing:YES];
}

@end
