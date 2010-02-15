/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiViewProxy.h"
#import "LayoutConstraint.h"
#import "TitaniumApp.h"
#import "TiBlob.h"
#import <QuartzCore/QuartzCore.h>


@implementation TiViewProxy

@synthesize children, parent;

#pragma mark Internal

-(void)dealloc
{
	RELEASE_TO_NIL(view);
	RELEASE_TO_NIL(children);
	[super dealloc];
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
	[self layoutChild:arg bounds:view.bounds]; 
}

#pragma mark Public

-(void)add:(id)arg
{
	ENSURE_SINGLE_ARG(arg,TiViewProxy);
	if (children==nil)
	{
		children = [[NSMutableArray alloc] init];
	}
	[children addObject:arg];
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
	if (children!=nil)
	{
		[self childRemoved:arg];
		[children removeObject:arg];
		[arg setParent:nil];
		
		if ([children count]==0)
		{
			RELEASE_TO_NIL(children);
		}
	}
	if (view!=nil)
	{
		UIView *childView = [arg view];
		if ([NSThread isMainThread])
		{
			[childView removeFromSuperview];
		}
		else
		{
			[self performSelectorOnMainThread:@selector(removeFromSuperview) withObject:childView waitUntilDone:NO];
		}
	}
}

-(void)show:(id)arg
{
	//TODO: animate
	[self setValue:[NSNumber numberWithBool:YES] forKey:@"visible"];
}
 
-(void)hide:(id)arg
{
	//TODO: animate
	[self setValue:[NSNumber numberWithBool:NO] forKey:@"visible"];
}

-(void)animate:(id)arg
{
	ENSURE_UI_THREAD(animate,arg);
	[[self view] animate:arg];
}

-(void)addImageToBlob:(TiBlob*)blob
{
	UIView *myview = [self view];
	UIGraphicsBeginImageContext(myview.bounds.size);
	[myview.layer renderInContext:UIGraphicsGetCurrentContext()];
	UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
	[blob setImage:image];
	UIGraphicsEndImageContext();
}

-(TiBlob*)toImage:(id)args
{
	TiBlob *blob = [[[TiBlob alloc] init] autorelease];
	// we spin on the UI thread and have him convert and then add back to the blob
	[self performSelectorOnMainThread:@selector(addImageToBlob:) withObject:blob waitUntilDone:NO];
	return blob;
}

#pragma mark View

-(void)setParent:(TiProxy*)parent_
{
	parent = parent_;
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

	return [[TiUIView alloc] initWithFrame:[self appFrame]];
}

-(BOOL)viewAttached
{
	return view!=nil;
}

-(void)detachView
{
	if (view!=nil)
	{
		[self viewWillDetach];
		[view removeFromSuperview];
		[self viewDidDetach];
		self.modelDelegate = nil;
		RELEASE_TO_NIL(view);
	}
}

-(void)windowDidClose
{
	for (TiViewProxy *child in children)
	{
		[child windowDidClose];
	}
}

-(void)windowWillClose
{
	for (TiViewProxy *child in children)
	{
		[child windowWillClose];
	}
	[self detachView];
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

-(void)firePropertyChanges
{
	[self willFirePropertyChanges];
	
	id<NSFastEnumeration> values = [self validKeys];
	if (values == nil)
	{
		values = [dynprops allKeys];
	}
	
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
		view.parent = self;
		view.layer.transform = CATransform3DIdentity;
		view.transform = CGAffineTransformIdentity;
		
		// fire property changes for all properties to our delegate
		[self firePropertyChanges];
		
		for (id child in self.children)
		{
			TiUIView *childView = [(TiViewProxy*)child view];
			[childView setParent:self];
			[view addSubview:childView];
		}
		
		[self viewDidAttach];

		// make sure we do a layout of ourselves
		LayoutConstraint layout;
		ReadConstraintFromDictionary(&layout,[self allProperties],NULL);
		[view updateLayout:&layout withBounds:view.bounds];
		
		viewInitialized = YES;
	}
	return view;
}

#pragma mark Layout 

-(void)layoutChild:(TiViewProxy*)child bounds:(CGRect)bounds
{
	if (view!=nil)
	{
		// layout out ourself
		UIView *childView = [child view];
	
		if ([childView superview]!=view)
		{
			[view addSubview:childView];
		}
		
		LayoutConstraint layout;
		ReadConstraintFromDictionary(&layout,[child allProperties],NULL);
		[[child view] updateLayout:&layout withBounds:bounds];
		
		// tell our children to also layout
		[child layoutChildren:childView.bounds];
	}
}

-(void)layoutChildren:(CGRect)bounds
{
	// now ask each of our children for their view
	for (id child in self.children)
	{
		[self layoutChild:child bounds:bounds];
	}
}

-(CGRect)appFrame
{
	return [[UIScreen mainScreen] applicationFrame];
}

#pragma mark Memory Management

-(void)_destroy
{
	if (view!=nil)
	{
		[view removeFromSuperview];
		RELEASE_TO_NIL(view);
	}
	if (children!=nil)
	{
		[children removeAllObjects];
		RELEASE_TO_NIL(children);
	}
	[super _destroy];
}

-(void)destroy
{
	//FIXME- me already have a _destroy, refactor this
	[self _destroy];
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

-(void)fireEvent:(NSString*)type withObject:(id)obj withSource:(id)source
{
	[super fireEvent:type withObject:obj withSource:source];
	
	// views support event propagation. we need to check our
	// parent and if he has the same named listener, we fire
	// an event and set the source of the event to ourself
	if (parent!=nil)
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

#pragma mark Invocation

//FIXME: review this, i think it can be removed -JGH
-(id)resultForUndefinedMethod:(NSString*)name args:(NSArray*)args
{
	// support dynamic forwarding to model delegate methods if attached
	if (self.modelDelegate!=nil)
	{
		NSString *methodSelectorName = [NSString stringWithFormat:@"%@:",name];
		SEL selector = NSSelectorFromString(methodSelectorName);
		if ([(NSObject*)self.modelDelegate respondsToSelector:selector])
		{
			if ([NSThread isMainThread])
			{
				[(NSObject*)self.modelDelegate performSelector:selector withObject:args];
			}
			else 
			{
				[(NSObject*)self.modelDelegate performSelectorOnMainThread:selector withObject:args waitUntilDone:NO];
			}
			return nil;
		}
	}
	return [super resultForUndefinedMethod:name args:args];
}

#pragma mark For Nav Bar Support

-(BOOL)supportsNavBarPositioning
{
	return NO;
}

-(UIBarButtonItem*)barButtonItem
{
	return nil;
}

-(void)removeNavBarButtonView
{
	// called to remove
}

#pragma mark For autosizing of table views


-(CGFloat)minimumParentHeightForWidth:(CGFloat)suggestedWidth
{
	if ([self viewAttached])
	{
		//Since it's expensive to extract from properties, let's cheat if the view already is there.
		return [view minimumParentHeightForWidth:suggestedWidth];
	}

	TiDimension topDimension = TiDimensionFromObject([self valueForKey:@"top"]);
	TiDimension botDimension = TiDimensionFromObject([self valueForKey:@"bottom"]);
	TiDimension heightDimension = TiDimensionFromObject([self valueForKey:@"height"]);	

	CGFloat result = TiDimensionCalculateValue(topDimension, 0)
			+ TiDimensionCalculateValue(botDimension, 0);
	switch (heightDimension.type)
	{
		case TiDimensionTypePixels:
			result += heightDimension.value;
			break;
		case TiDimensionTypeAuto:
			if ([self respondsToSelector:@selector(autoHeightForWidth:)])
			{
				TiDimension leftDimension = TiDimensionFromObject([self valueForKey:@"left"]);
				TiDimension rightDimension = TiDimensionFromObject([self valueForKey:@"right"]);
				suggestedWidth -= TiDimensionCalculateValue(leftDimension, 0)
						+ TiDimensionCalculateValue(rightDimension, 0);
				result += [self autoHeightForWidth:suggestedWidth];
			}
	}
	return result;
}

@end
