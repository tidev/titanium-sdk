/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"

#ifdef USE_TI_MAP

#import <MapKit/MapKit.h>

@interface TiMapRouteAnnotation : NSObject<MKAnnotation> {
@private
	// points that make up the route. 
	NSMutableArray* points; 
	// computed span of the route
	MKCoordinateSpan span;
	// computed center of the route. 
	CLLocationCoordinate2D center;	
	// color of the line that will be rendered. 
	UIColor* lineColor;
	// id of the route we can use for indexing. 
	NSString* routeID;
	// the width of the line
	CGFloat width;
}

@property (readonly) MKCoordinateRegion region;
@property (nonatomic, assign) CGFloat width;
@property (nonatomic, retain) UIColor* lineColor;
@property (nonatomic, retain) NSMutableArray* points;
@property (nonatomic, retain) NSString* routeID;

-(id) initWithPoints:(NSArray*) points;

@end

#endif