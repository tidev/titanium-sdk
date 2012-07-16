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

typedef void (^TouchesEventBlock)(NSSet * touches, UIEvent * event);

@interface MapGestureRecognizer : UIGestureRecognizer {
    TouchesEventBlock touchesBeganCallback;
    TouchesEventBlock touchesMovedCallback;
    TouchesEventBlock touchesEndedCallback;
    TouchesEventBlock touchesCancelledCallback;
}

@property(copy) TouchesEventBlock touchesBeganCallback;
@property(copy) TouchesEventBlock touchesMovedCallback;
@property(copy) TouchesEventBlock touchesEndedCallback;
@property(copy) TouchesEventBlock touchesCancelledCallback;

@end

@interface TiMapView : TiUIView<MKMapViewDelegate, UIGestureRecognizerDelegate> {
@private
	MKMapView *map;
	BOOL regionFits;
	BOOL animate;
	BOOL loaded;
	BOOL ignoreClicks;
	MKCoordinateRegion region;
	
    // routes
    // dictionaries for object tracking and association
    CFMutableDictionaryRef mapLine2View;   // MKPolyline(route line) -> MKPolylineView(route view)
    CFMutableDictionaryRef mapName2Line;   // NSString(name) -> MKPolyline(route line)
    
	// Click detection
	id<MKAnnotation> hitAnnotation;
	BOOL hitSelect;
	BOOL manualSelect;
    
	UITapGestureRecognizer*			mapSingleTapRecognizer;
	UITapGestureRecognizer*			mapDoubleTapRecognizer;
	UITapGestureRecognizer*			mapTwoFingerTapRecognizer;
	UIPinchGestureRecognizer*		mapPinchRecognizer;
	UISwipeGestureRecognizer*		mapLeftSwipeRecognizer;
	UISwipeGestureRecognizer*		mapRightSwipeRecognizer;
	UILongPressGestureRecognizer*	mapLongPressRecognizer;
}

@property (nonatomic, readonly) CLLocationDegrees longitudeDelta;
@property (nonatomic, readonly) CLLocationDegrees latitudeDelta;
@property (nonatomic, readonly) NSArray *customAnnotations;

#pragma mark Private APIs
-(TiMapAnnotationProxy*)annotationFromArg:(id)arg;
-(NSArray*)annotationsFromArgs:(id)value;
-(void)mapTouchesBegan:(NSSet*)touches withEvent:(UIEvent*)event;
-(void)mapTouchesEnded:(NSSet*)touches withEvent:(UIEvent*)event;
-(void)mapTouchesCancelled:(NSSet*)touches withEvent:(UIEvent*)event;
-(void)mapTouchesMoved:(NSSet*)touches withEvent:(UIEvent*)event;

#pragma mark Public APIs
-(void)addAnnotation:(id)args;
-(void)addAnnotations:(id)args;
-(void)setAnnotations_:(id)value;
-(void)removeAnnotation:(id)args;
-(void)removeAnnotations:(id)args;
-(void)removeAllAnnotations:(id)args;
-(void)selectAnnotation:(id)args;
-(void)deselectAnnotation:(id)args;
-(void)zoom:(id)args;
-(void)addRoute:(id)args;
-(void)removeRoute:(id)args;
-(void)firePinChangeDragState:(MKAnnotationView *) pinview newState:(MKAnnotationViewDragState)newState fromOldState:(MKAnnotationViewDragState)oldState;

#pragma mark Framework
-(void)refreshAnnotation:(TiMapAnnotationProxy*)proxy readd:(BOOL)yn;
-(void)fireClickEvent:(MKAnnotationView *) pinview source:(NSString *)source;

@end

#endif