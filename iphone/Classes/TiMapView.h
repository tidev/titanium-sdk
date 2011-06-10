/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"

#ifdef USE_TI_MAP

#import "TiUIView.h"
#import <MapKit/MapKit.h>

@class TiMapAnnotationProxy;

@protocol TiMapAnnotation
@required
-(NSString *)lastHitName;
@end


@interface TiMapView : TiUIView<MKMapViewDelegate> {
@private
	MKMapView *map;
	BOOL regionFits;
	BOOL animate;
	BOOL loaded;
	BOOL ignoreClicks;
	MKCoordinateRegion region;
	
	TiMapAnnotationProxy * pendingAnnotationSelection;
	NSMutableDictionary *routes;
	NSMutableDictionary *routeViews;
	NSMutableDictionary *routePoints;
	
	// Click detection
	id<MKAnnotation> hitAnnotation;
	BOOL hitSelect;
	BOOL manualSelect;
}

#pragma mark Public APIs
-(void)addAnnotation:(id)args;
-(void)addAnnotations:(id)args;
-(void)removeAnnotation:(id)args;
-(void)removeAnnotations:(id)args;
-(void)removeAllAnnotations:(id)args;
-(void)selectAnnotation:(id)args;
-(void)deselectAnnotation:(id)args;
-(void)zoom:(id)args;
-(void)addRoute:(id)args;
-(void)addRouteOverlay:(id)args;
-(void)addRouteAnnotation:(id)args;
-(void)removeRoute:(id)args;
-(void)moveToPoint:(id)args;
-(void)addPoint:(id)args;

#pragma mark Framework
-(void)refreshAnnotation:(TiMapAnnotationProxy*)proxy readd:(BOOL)yn;

-(void)fireClickEvent:(MKAnnotationView *) pinview source:(NSString *)source;


@end

#endif