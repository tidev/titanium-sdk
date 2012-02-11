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

#pragma mark Internal

-(NSArray *)keySequence
{
	return [NSArray arrayWithObjects:
			@"animate",
			@"location",
			nil];
}

-(void)_destroy
{
	RELEASE_TO_NIL(selectedAnnotation);
	RELEASE_TO_NIL(annotationsToAdd);
	RELEASE_TO_NIL(annotationsToRemove);
	RELEASE_TO_NIL(routesToAdd);
	RELEASE_TO_NIL(routesToRemove);
	[super _destroy];
}

-(NSNumber*) longitudeDelta
{
	__block CLLocationDegrees delta = 0.0;
	
	if ([self viewAttached]) {
		TiThreadPerformOnMainThread(^{
			delta = [(TiMapView *)[self view] longitudeDelta];
		},YES);
		
	}
	return [NSNumber numberWithDouble:delta];

}

-(NSNumber*) latitudeDelta
{
	__block CLLocationDegrees delta = 0.0;
	
	if ([self viewAttached]) {
		TiThreadPerformOnMainThread(^{
			delta = [(TiMapView *)[self view] latitudeDelta];
		},YES);
		
	}
	return [NSNumber numberWithDouble:delta];
}

-(void)viewDidAttach
{
	ENSURE_UI_THREAD_0_ARGS;
	TiMapView * ourView = (TiMapView *)[self view];

	if (annotationsToAdd!=nil)
	{
		[ourView addAnnotations:annotationsToAdd];
	}
	if (annotationsToRemove!=nil)
	{
		[ourView removeAnnotations:annotationsToRemove];
	}
	if (routesToAdd!=nil)
	{
		for (id arg in routesToAdd)
		{
			[ourView addRoute:arg];
		}
	}
	if (routesToRemove!=nil)
	{
		for (id arg in routesToRemove)
		{
			[ourView removeRoute:arg];
		}
	}
	[ourView selectAnnotation:selectedAnnotation];
	if (zoomCount > 0) {
		for (int i=0; i < zoomCount; i++) {
			[ourView zoom:[NSNumber numberWithDouble:1.0]];
		}
	}
	else {
		for (int i=zoomCount;i < 0;i++) {
			[ourView zoom:[NSNumber numberWithDouble:-1.0]];
		}
	}
	
	RELEASE_TO_NIL(selectedAnnotation);
	RELEASE_TO_NIL(annotationsToAdd);
	RELEASE_TO_NIL(annotationsToRemove);
	RELEASE_TO_NIL(routesToAdd);
	RELEASE_TO_NIL(routesToRemove);
	
	[super viewDidAttach];
}

#pragma mark Public API

-(void)zoom:(id)arg
{
	ENSURE_SINGLE_ARG(arg,NSObject)
	if ([self viewAttached]) {
		TiThreadPerformOnMainThread(^{[(TiMapView*)[self view] zoom:arg];}, NO);
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
		 TiThreadPerformOnMainThread(^{[(TiMapView*)[self view] selectAnnotation:arg];}, NO);
	}
	else {
		if (selectedAnnotation != arg) {
			RELEASE_TO_NIL(selectedAnnotation);
			selectedAnnotation = [arg retain];
		}
	}
}

-(void)deselectAnnotation:(id)arg
{
	ENSURE_SINGLE_ARG(arg,NSObject)
	if ([self viewAttached]) {
		TiThreadPerformOnMainThread(^{[(TiMapView*)[self view] deselectAnnotation:arg];}, NO);
	}
	else {
		RELEASE_TO_NIL(selectedAnnotation);
	}
}

-(void)addAnnotation:(id)arg
{
	ENSURE_SINGLE_ARG(arg,NSObject)
	if ([self viewAttached]) {
		TiThreadPerformOnMainThread(^{[(TiMapView*)[self view] addAnnotation:arg];}, NO);
	}
	else 
	{
		if (annotationsToAdd==nil)
		{
			annotationsToAdd = [[NSMutableArray alloc] init];
		}
		if (annotationsToRemove!=nil && [annotationsToRemove containsObject:arg]) 
		{
			[annotationsToRemove removeObject:arg];
		}
		else 
		{
			[annotationsToAdd addObject:arg];
		}
	}
}

-(void)addAnnotations:(id)arg
{
	ENSURE_SINGLE_ARG(arg,NSArray)
	if ([self viewAttached]) {
		TiThreadPerformOnMainThread(^{[(TiMapView*)[self view] addAnnotations:arg];}, NO);
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
	if ([self viewAttached]) 
	{
		TiThreadPerformOnMainThread(^{[(TiMapView*)[self view] removeAnnotation:arg];}, NO);
	}
	else 
	{
		if (annotationsToRemove==nil)
		{
			annotationsToRemove = [[NSMutableArray alloc] init];
		}
		if (annotationsToAdd!=nil && [annotationsToAdd containsObject:arg]) 
		{
			[annotationsToAdd removeObject:arg];
		}
		else 
		{
			[annotationsToRemove addObject:arg];
		}
	}
}

-(void)removeAnnotations:(id)arg
{
	ENSURE_TYPE(arg,NSArray)
	if ([self viewAttached]) {
		TiThreadPerformOnMainThread(^{[(TiMapView*)[self view] removeAnnotations:arg];}, NO);
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
		TiThreadPerformOnMainThread(^{[(TiMapView*)[self view] removeAllAnnotations:unused];}, NO);
	}
	else 
	{
		if (annotationsToAdd!=nil)
		{
			[annotationsToAdd removeAllObjects];
		}
		if (annotationsToRemove!=nil)
		{
			[annotationsToRemove removeAllObjects];
		}
	}
}

-(void)addRoute:(id)arg
{
	ENSURE_SINGLE_ARG(arg,NSDictionary)
	if ([self viewAttached]) 
	{
		TiThreadPerformOnMainThread(^{[(TiMapView*)[self view] addRoute:arg];}, NO);
	}
	else 
	{
		if (routesToAdd==nil)
		{
			routesToAdd = [[NSMutableArray alloc] init];
		}
		if (routesToRemove!=nil && [routesToRemove containsObject:arg])
		{
			[routesToRemove removeObject:arg];
		}
		else 
		{
			[routesToAdd addObject:arg];
		}
	}
}

-(void)removeRoute:(id)arg
{
	ENSURE_SINGLE_ARG(arg,NSDictionary)
	if ([self viewAttached]) 
	{
		TiThreadPerformOnMainThread(^{[(TiMapView*)[self view] removeRoute:arg];}, NO);
	}
	else 
	{
		if (routesToRemove==nil)
		{
			routesToRemove = [[NSMutableArray alloc] init];
		}
		if (routesToAdd!=nil && [routesToAdd containsObject:arg])
		{
			[routesToAdd removeObject:arg];
		}
		else 
		{
			[routesToRemove addObject:arg];
		}
	}
}


@end

#endif