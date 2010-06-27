/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_MAP

#import <MapKit/MapKit.h>

@class TiMapRouteViewInternal;

@interface TiMapRouteAnnotationView : MKAnnotationView {
@private
	MKMapView* mapView;
	TiMapRouteViewInternal* internalRouteView;
}

@property (nonatomic, retain) MKMapView* mapView;

// signal from our view controller that the map region changed. We will need to resize, recenter and 
// redraw the contents of this view when this happens. 
-(void) regionChanged;

@end

#endif