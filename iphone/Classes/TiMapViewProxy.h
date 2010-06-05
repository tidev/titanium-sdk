/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiViewProxy.h"
#import "TiMapAnnotationProxy.h"

#ifdef USE_TI_MAP

@interface TiMapViewProxy : TiViewProxy {
	TiMapAnnotationProxy* selectedAnnotation; // Annotation to select on initial display
	NSMutableArray* annotationsToAdd; // Annotations to add on initial display
	NSMutableArray* annotationsToRemove; // Annotations to remove on initial display
	int zoomCount; // Number of times to zoom in/out on initial display
}

-(void)addAnnotation:(id)args;
-(void)addAnnotations:(id)args;
-(void)removeAnnotation:(id)args;
-(void)removeAnnotations:(id)args;
-(void)removeAllAnnotations:(id)args;
-(void)selectAnnotation:(id)args;
-(void)deselectAnnotation:(id)args;
-(void)zoom:(id)args;

@end


#endif