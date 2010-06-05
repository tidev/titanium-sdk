/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MAP

#import "TiMapViewProxy.h"
#import "TiMapView.h"

@implementation TiMapViewProxy

#define VIEW_METHOD_ON_UI_THREAD(methodname,obj) \
	[[self view] performSelectorOnMainThread:@selector(methodname:) withObject:obj waitUntilDone:NO];

#pragma mark Internal

-(void)_configure
{
	annotationsToAdd = [[NSMutableArray alloc] init];
	annotationsToRemove = [[NSMutableArray alloc] init];
}

-(void)_destroy
{
	RELEASE_TO_NIL(selectedAnnotation);
	RELEASE_TO_NIL(annotationsToAdd);
	RELEASE_TO_NIL(annotationsToRemove);
}

-(void)viewDidAttach
{
	VIEW_METHOD_ON_UI_THREAD(addAnnotations,annotationsToAdd);
	VIEW_METHOD_ON_UI_THREAD(removeAnnotations,annotationsToRemove);
	VIEW_METHOD_ON_UI_THREAD(selectAnnotation,selectedAnnotation);
	if (zoomCount > 0) {
		for (int i=0; i < zoomCount; i++) {
			VIEW_METHOD_ON_UI_THREAD(zoom,[NSNumber numberWithDouble:1.0]);
		}
	}
	else {
		for (int i=zoomCount;i < 0;i++) {
			VIEW_METHOD_ON_UI_THREAD(zoom,[NSNumber numberWithDouble:-1.0]);
		}
	}
	
	RELEASE_TO_NIL(selectedAnnotation);
	RELEASE_TO_NIL(annotationsToAdd);
	RELEASE_TO_NIL(annotationsToRemove);
}

#pragma mark Public API

-(void)zoom:(id)arg
{
	ENSURE_SINGLE_ARG(arg,NSObject)
	if ([self viewAttached]) {
		VIEW_METHOD_ON_UI_THREAD(zoom,arg);
	}
	else {
		double v = [TiUtils doubleValue:arg];
		// TODO: Find good delta tolerance value to deal with floating point goofs
		if (v == 0.0) {
			return;
		}
		if (v > 0) {
			zoomCount++;
		}
		else {
			zoomCount--;
		}
	}
}

-(void)selectAnnotation:(id)arg
{
	ENSURE_SINGLE_ARG(arg,NSObject)
	if ([self viewAttached]) {
		VIEW_METHOD_ON_UI_THREAD(selectAnnotation,arg)
	}
	else {
		selectedAnnotation = [arg retain];
	}
}

-(void)deselectAnnotation:(id)arg
{
	ENSURE_SINGLE_ARG(arg,NSObject)
	if ([self viewAttached]) {
		VIEW_METHOD_ON_UI_THREAD(deselectAnnotation,arg)
	}
	else {
		RELEASE_TO_NIL(selectedAnnotation);
	}
}

-(void)addAnnotation:(id)arg
{
	ENSURE_SINGLE_ARG(arg,NSObject)
	if ([self viewAttached]) {
		VIEW_METHOD_ON_UI_THREAD(addAnnotation,arg)
	}
	else {
		if ([annotationsToRemove containsObject:arg]) {
			[annotationsToRemove removeObject:arg];
		}
		else {
			[annotationsToAdd addObject:arg];
		}
	}
}

-(void)addAnnotations:(id)arg
{
	ENSURE_SINGLE_ARG(arg,NSArray)
	if ([self viewAttached]) {
		VIEW_METHOD_ON_UI_THREAD(addAnnotations,arg)
	}
	else {
		for (id annotation in arg) {
			[self addAnnotation:annotation];
		}
	}
}

-(void)removeAnnotation:(id)arg
{
	ENSURE_SINGLE_ARG(arg,NSObject)
	if ([self viewAttached]) {
		VIEW_METHOD_ON_UI_THREAD(removeAnnotation,arg)
	}
	else {
		if ([annotationsToAdd containsObject:arg]) {
			[annotationsToAdd removeObject:arg];
		}
		else {
			[annotationsToRemove addObject:arg];
		}
	}
}

-(void)removeAnnotations:(id)arg
{
	ENSURE_TYPE(arg,NSArray)
	if ([self viewAttached]) {
		VIEW_METHOD_ON_UI_THREAD(removeAnnotations,arg)
	}
	else {
		for (id annotation in arg) {
			[self removeAnnotation:annotation];
		}
	}
}

-(void)removeAllAnnotations:(id)unused
{
	if ([self viewAttached]) {
		VIEW_METHOD_ON_UI_THREAD(removeAllAnnotations,unused)
	}
	else {
		[annotationsToAdd removeAllObjects];
		[annotationsToRemove removeAllObjects];
	}
}

@end

#endif