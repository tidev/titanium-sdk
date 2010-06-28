/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"

#ifdef USE_TI_MAP

#import "TiMapRouteAnnotation.h"
#import "TiUtils.h"

@implementation TiMapRouteAnnotation

@synthesize lineColor, points, routeID, width, coordinate = center;

-(id) initWithPoints:(NSArray*) points_
{
	if (self = [super init])
	{
		points = [[NSMutableArray alloc] initWithCapacity:points_.count];
		
		for(int idx = 0; idx < points_.count; idx++)
		{
			NSDictionary *entry = [points_ objectAtIndex:idx];
			CLLocationDegrees lat = [TiUtils doubleValue:[entry objectForKey:@"latitude"]];
			CLLocationDegrees lon = [TiUtils doubleValue:[entry objectForKey:@"longitude"]];
			CLLocation* currentLocation = [[CLLocation alloc] initWithLatitude:lat longitude:lon];
			[points addObject:currentLocation];
			[currentLocation release];
		}
		
		// determine a logical center point for this route based on the middle of the lat/lon extents.
		double maxLat = -91;
		double minLat =  91;
		double maxLon = -181;
		double minLon =  181;
		
		for(CLLocation* currentLocation in points)
		{
			CLLocationCoordinate2D coordinate = currentLocation.coordinate;
			
			if(coordinate.latitude > maxLat)
			{
				maxLat = coordinate.latitude;
			}
			if(coordinate.latitude < minLat)
			{
				minLat = coordinate.latitude;
			}
			if(coordinate.longitude > maxLon)
			{
				maxLon = coordinate.longitude;
			}
			if(coordinate.longitude < minLon)
			{
				minLon = coordinate.longitude; 
			}
		}
		
		span.latitudeDelta = (maxLat + 90) - (minLat + 90);
		span.longitudeDelta = (maxLon + 180) - (minLon + 180);
		
		// the center point is the average of the max and mins
		center.latitude = minLat + span.latitudeDelta / 2;
		center.longitude = minLon + span.longitudeDelta / 2;
		
		self.lineColor = [UIColor blueColor];
		self.width = 2;
	}	
	return self;
}

-(MKCoordinateRegion) region
{
	MKCoordinateRegion region_;
	region_.center = center;
	region_.span = span;
	return region_;
}

-(void) dealloc
{
	RELEASE_TO_NIL(points);
	RELEASE_TO_NIL(routeID);
	RELEASE_TO_NIL(lineColor);
	[super dealloc];
}

@end

#endif