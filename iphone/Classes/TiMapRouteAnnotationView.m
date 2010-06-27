/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiBase.h"

#ifdef USE_TI_MAP

#import "TiMapRouteAnnotationView.h"
#import "TiMapRouteAnnotation.h"

// this is an internally used view to TiMapRouteAnnotationView. 
// The TiMapRouteAnnotationView needs a subview that does not get clipped to always
// be positioned at the full frame size and origin of the map. This 
// way the view can be smaller than the route, but it
// always draws in the internal subview, which is the size of the map view. 
@interface TiMapRouteViewInternal : UIView
{
	// route view which added this as a subview. 
	TiMapRouteAnnotationView* routeView;
}
@property (nonatomic, assign) TiMapRouteAnnotationView* routeView;
@end

@implementation TiMapRouteViewInternal

@synthesize routeView;

-(void) drawRect:(CGRect) rect
{
	TiMapRouteAnnotation* routeAnnotation = (TiMapRouteAnnotation*)self.routeView.annotation;
	
	// only draw our lines if we're not int he moddie of a transition and we 
	// acutally have some points to draw. 
	if(!self.hidden && nil != routeAnnotation.points && routeAnnotation.points.count > 0)
	{
		CGContextRef context = UIGraphicsGetCurrentContext(); 
		
		if(nil == routeAnnotation.lineColor)
		{
			routeAnnotation.lineColor = [UIColor blueColor]; // setting the property instead of the member variable will automatically reatin it.
		}		
		CGContextSetStrokeColorWithColor(context, routeAnnotation.lineColor.CGColor);
		CGContextSetRGBFillColor(context, 0.0, 0.0, 1.0, 1.0);
		CGContextSetLineWidth(context, routeAnnotation.width);
		
		for(int idx = 0; idx < routeAnnotation.points.count; idx++)
		{
			CLLocation* location = [routeAnnotation.points objectAtIndex:idx];
			CGPoint point = [self.routeView.mapView convertCoordinate:location.coordinate toPointToView:self];
			
			if(idx == 0)
			{
				// move to the first point
				CGContextMoveToPoint(context, point.x, point.y);
			}
			else
			{
				CGContextAddLineToPoint(context, point.x, point.y);
			}
		}
		
		CGContextStrokePath(context);
		
		
		// debug. Draw the line around our view. 
		/*
		 CGContextMoveToPoint(context, 0, 0);
		 CGContextAddLineToPoint(context, 0, self.frame.size.height);
		 CGContextAddLineToPoint(context, self.frame.size.width, self.frame.size.height);
		 CGContextAddLineToPoint(context, self.frame.size.width, 0);
		 CGContextAddLineToPoint(context, 0, 0);
		 CGContextStrokePath(context);
		 */
	}
}

-(id) init
{
	if (self = [super init])
	{
		self.backgroundColor = [UIColor clearColor];
		self.clipsToBounds = NO;
	}
	return self;
}

-(void) dealloc
{
	self.routeView = nil;
	[super dealloc];
}
@end

@implementation TiMapRouteAnnotationView

@synthesize mapView;

- (id)initWithFrame:(CGRect)frame 
{
    if (self = [super initWithFrame:frame]) 
	{
		self.backgroundColor = [UIColor clearColor];
		
		// do not clip the bounds. We need the internal view to be able to render the route, regardless of where the
		// actual annotation view is displayed. 
		self.clipsToBounds = NO;
		
		// create the internal route view that does the rendering of the route. 
		internalRouteView = [[TiMapRouteViewInternal alloc] init];
		internalRouteView.routeView = self;
		
		[self addSubview:internalRouteView];
    }
    return self;
}

-(void) setMapView:(MKMapView*) mapView_
{
	[mapView release];
	mapView = [mapView_ retain];
	[self regionChanged];
}

-(void) regionChanged
{
	// move the internal route view. 
	CGPoint origin = CGPointMake(0, 0);
	origin = [mapView convertPoint:origin toView:self];
	
	internalRouteView.frame = CGRectMake(origin.x, origin.y, mapView.frame.size.width, mapView.frame.size.height);
	[internalRouteView setNeedsDisplay];
}

- (void)dealloc 
{
	RELEASE_TO_NIL(mapView);
	RELEASE_TO_NIL(internalRouteView);
    [super dealloc];
}

@end

#endif