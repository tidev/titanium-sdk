/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiMapView.h"
#import "TiUtils.h"
#import "TiMapAnnotationProxy.h"
#import "TiMapPinAnnotationView.h"

@implementation TiMapView

#pragma mark Internal

-(void)dealloc
{
	if (map!=nil)
	{
		map.delegate = nil;
		RELEASE_TO_NIL(map);
	}
	[super dealloc];
}

-(void)render
{
	if (region.center.latitude!=0 && region.center.longitude!=0)
	{
		[map setRegion:region animated:animate];
	}
}

-(MKMapView*)map
{
	if (map==nil)
	{
		map = [[MKMapView alloc] initWithFrame:CGRectZero];
		map.delegate = self;
		map.userInteractionEnabled = YES;
		map.showsUserLocation = YES; // defaults
		map.autoresizingMask = UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight;
		[self addSubview:map];
	}
	return map;
}

-(void)willFirePropertyChanges
{
	regionFits = [TiUtils boolValue:[self.proxy valueForKey:@"regionFit"]];
	animate = [TiUtils boolValue:[self.proxy valueForKey:@"animate"]];
}

-(void)didFirePropertyChanges
{
	[self performSelectorOnMainThread:@selector(render) withObject:nil waitUntilDone:NO];
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	[TiUtils setView:[self map] positionRect:bounds];
}

-(TiMapAnnotationProxy*)annotationFromArg:(id)arg
{
	if ([arg isKindOfClass:[TiMapAnnotationProxy class]])
	{
		[(TiMapAnnotationProxy*)arg setDelegate:self];
		return arg;
	}
	ENSURE_TYPE(arg,NSDictionary);
	TiMapAnnotationProxy *proxy = [[[TiMapAnnotationProxy alloc] _initWithPageContext:[self.proxy pageContext] args:[NSArray arrayWithObject:arg]] autorelease];

	[proxy setDelegate:self];
	return proxy;
}


-(void)refreshAnnotation:(TiMapAnnotationProxy*)proxy readd:(BOOL)yn
{
	NSArray *selected = map.selectedAnnotations;
	BOOL wasSelected = selected!=nil && [selected count] > 0 && [selected containsObject:proxy];
	if (yn==NO)
	{
		[map deselectAnnotation:proxy animated:NO];
	}
	else
	{
//		MKAnnotationView * doomedView = [map viewForAnnotation:proxy];
//		[map deselectAnnotation:proxy animated:NO];
		[map removeAnnotation:proxy];
//		[doomedView prepareForReuse];
		[map addAnnotation:proxy];
		[map setNeedsLayout];
	}
	if (wasSelected)
	{
		[map selectAnnotation:proxy animated:NO];
	}
}

#pragma mark Public APIs

-(void)addAnnotation:(id)args
{
	ENSURE_UI_THREAD(addAnnotation,args);
	ENSURE_SINGLE_ARG(args,NSObject);
	[[self map] addAnnotation:[self annotationFromArg:args]];
}

-(void)removeAnnotation:(id)args
{
	ENSURE_UI_THREAD(removeAnnotation,args);
	ENSURE_SINGLE_ARG(args,NSObject);
	if ([args isKindOfClass:[NSString class]])
	{
		// for pre 0.9, we supporting removing by passing the annotation title
		NSString *title = [TiUtils stringValue:args];
		for (id<MKAnnotation>an in [NSArray arrayWithArray:[self map].annotations])
		{
			if ([title isEqualToString:an.title])
			{
				[[self map] removeAnnotation:an];
				break;
			}
		}
	}
	else if ([args isKindOfClass:[TiMapAnnotationProxy class]])
	{
		[[self map] removeAnnotation:args];
	}
}

-(void)selectAnnotation:(id)args
{
	ENSURE_UI_THREAD(selectAnnotation,args);
	ENSURE_SINGLE_ARG(args,NSObject);
	if ([args isKindOfClass:[NSString class]])
	{
		// for pre 0.9, we supporting selecting by passing the annotation title
		NSString *title = [TiUtils stringValue:args];
		for (id<MKAnnotation>an in [NSArray arrayWithArray:[self map].annotations])
		{
			if ([title isEqualToString:an.title])
			{
				[[self map] selectAnnotation:an animated:animate];
				break;
			}
		}
	}
	else if ([args isKindOfClass:[TiMapAnnotationProxy class]])
	{
		[[self map] selectAnnotation:args animated:animate];
	}
}

-(void)deselectAnnotation:(id)args
{
	ENSURE_UI_THREAD(deselectAnnotation,args);
	ENSURE_SINGLE_ARG(args,NSObject);
	if ([args isKindOfClass:[NSString class]])
	{
		// for pre 0.9, we supporting selecting by passing the annotation title
		NSString *title = [TiUtils stringValue:args];
		for (id<MKAnnotation>an in [NSArray arrayWithArray:[self map].annotations])
		{
			if ([title isEqualToString:an.title])
			{
				[[self map] deselectAnnotation:an animated:animate];
				break;
			}
		}
	}
	else if ([args isKindOfClass:[TiMapAnnotationProxy class]])
	{
		[[self map] deselectAnnotation:args animated:animate];
	}
}

-(void)zoom:(id)args
{
	ENSURE_UI_THREAD(zoom,args);
	ENSURE_SINGLE_ARG(args,NSObject);
	double v = [TiUtils doubleValue:args];
	MKCoordinateRegion _region = [[self map] region];
	if (v > 0)
	{
		_region.span.latitudeDelta = _region.span.latitudeDelta / 2.0002;
		_region.span.longitudeDelta = _region.span.longitudeDelta / 2.0002;
	}
	else
	{
		_region.span.latitudeDelta = _region.span.latitudeDelta * 2.0002;
		_region.span.longitudeDelta = _region.span.longitudeDelta * 2.0002;
	}
	region = _region;
	[self render];
}

-(MKCoordinateRegion)regionFromDict:(NSDictionary*)dict
{
	CGFloat latitudeDelta = [TiUtils floatValue:@"latitudeDelta" properties:dict];
	CGFloat longitudeDelta = [TiUtils floatValue:@"longitudeDelta" properties:dict];
	CLLocationCoordinate2D center;
	center.latitude = [TiUtils floatValue:@"latitude" properties:dict];
	center.longitude = [TiUtils floatValue:@"longitude" properties:dict];
	MKCoordinateRegion region_;
	MKCoordinateSpan span;
	span.longitudeDelta = longitudeDelta;
	span.latitudeDelta = latitudeDelta;
	region_.center = center;
	region_.span = span;
	return region_;
}

#pragma mark Public APIs

-(void)setMapType_:(id)value
{
	[[self map] setMapType:[TiUtils intValue:value]];
}

-(void)setRegion_:(id)value
{
	if (value==nil)
	{
		// unset the region and set it back to the user's location of the map
		// what else to do??
		MKUserLocation* user = [self map].userLocation;
		if (user!=nil)
		{
			region.center = user.location.coordinate;
			[self render];
		}
		else 
		{
			// if we unset but we're not allowed to get the users location, what to do?
		}
	}
	else 
	{
		region = [self regionFromDict:value];
		if (regionFits)
		{
			MKCoordinateRegion fitRegion = [[self map] regionThatFits:region];
			// this seems to happen sometimes where we get an invalid span back
			if (fitRegion.span.latitudeDelta == 0 || fitRegion.span.longitudeDelta)
			{
				// this seems to happen when you try and call this with the same region
				// which means we can ignore (otherwise you'll get an NSInvalidException
				return;
			}
			region = fitRegion;
		}
		[self render];
	}
}

-(void)setAnimate_:(id)value
{
	animate = [TiUtils boolValue:value];
}

-(void)setRegionFit_:(id)value
{
	id aregion = [self.proxy valueForKey:@"region"];
	regionFits = [TiUtils boolValue:value];
	[self setRegion_:aregion];
}

-(void)setUserLocation_:(id)value
{
	ENSURE_SINGLE_ARG(value,NSObject);
	[self map].showsUserLocation = [TiUtils boolValue:value];
}

-(void)setLocation_:(id)location
{
	ENSURE_SINGLE_ARG(location,NSDictionary);
	//comes in like region: {latitude:100, longitude:100, latitudeDelta:0.5, longitudeDelta:0.5}
	id lat = [location objectForKey:@"latitude"];
	id lon = [location objectForKey:@"longitude"];
	id latdelta = [location objectForKey:@"latitudeDelta"];
	id londelta = [location objectForKey:@"longitudeDelta"];
	if (lat)
	{
		region.center.latitude = [lat doubleValue];
	}
	if (lon)
	{
		region.center.longitude = [lon doubleValue];
	}
	if (latdelta)
	{
		region.span.latitudeDelta = [latdelta doubleValue];
	}
	if (londelta)
	{
		region.span.longitudeDelta = [londelta doubleValue];
	}
	id an = [location objectForKey:@"animate"];
	if (an)
	{
		animate = [an boolValue];
	}
	id rf = [location objectForKey:@"regionFit"];
	if (rf)
	{
		regionFits = [rf boolValue];
	}
	[self render];
}

-(void)setAnnotations_:(id)value
{
	ENSURE_TYPE_OR_NIL(value,NSArray);
	MKMapView *view = [self map];
	if (value!=nil)
	{
		for (id arg in value)
		{
			[view addAnnotation:[self annotationFromArg:arg]];
		}
	}
	else
	{
		// if passed nil, remove all annotations
		for (id ann in [NSArray arrayWithArray:view.annotations])
		{
			[view removeAnnotation:ann];
		}
	}
}


#pragma mark Delegates

- (void)mapView:(MKMapView *)mapView regionWillChangeAnimated:(BOOL)animated
{
	[self retain];
}

- (void)mapView:(MKMapView *)mapView regionDidChangeAnimated:(BOOL)animated
{
	if ([self.proxy _hasListeners:@"regionChanged"])
	{
		region = [mapView region];
		NSDictionary * props = [NSDictionary dictionaryWithObjectsAndKeys:
								@"regionChanged",@"type",
								[NSNumber numberWithDouble:region.center.latitude],@"latitude",
								[NSNumber numberWithDouble:region.center.longitude],@"longitude",
								[NSNumber numberWithDouble:region.span.latitudeDelta],@"latitudeDelta",
								[NSNumber numberWithDouble:region.span.longitudeDelta],@"longitudeDelta",nil];
		[self.proxy fireEvent:@"regionChanged" withObject:props];
	}
}

- (void)mapViewWillStartLoadingMap:(MKMapView *)mapView
{
	if ([self.proxy _hasListeners:@"loading"])
	{
		[self.proxy fireEvent:@"loading" withObject:nil];
	}
}

- (void)mapViewDidFinishLoadingMap:(MKMapView *)mapView
{
	if ([self.proxy _hasListeners:@"complete"])
	{
		[self.proxy fireEvent:@"complete" withObject:nil];
	}
}

- (void)mapViewDidFailLoadingMap:(MKMapView *)mapView withError:(NSError *)error
{
	if ([self.proxy _hasListeners:@"error"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:[error description] forKey:@"message"];
		[self.proxy fireEvent:@"error" withObject:event];
	}
}

- (void)reverseGeocoder:(MKReverseGeocoder *)geocoder didFindPlacemark:(MKPlacemark *)placemark
{
	[map addAnnotation:placemark];
}

- (TiMapAnnotationProxy*)proxyForAnnotation:(MKPinAnnotationView*)pinview
{
	for (id annotation in [map annotations])
	{
		if ([annotation isKindOfClass:[TiMapAnnotationProxy class]])
		{
			if ([annotation tag] == pinview.tag)
			{
				if ([annotation needsRefreshingWithSelection])
				{
//					return nil;
				}
				return annotation;
			}
		}
	}
	return nil;
}

- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary *)change
                       context:(void *)context
{
	NSString *action = (NSString*)context;
	if([action isEqualToString:@"ANSELECTED"])
	{
		if ([object isKindOfClass:[MKPinAnnotationView class]])
		{
			MKPinAnnotationView *pinview = (MKPinAnnotationView*)object;
			TiMapAnnotationProxy *viewProxy = [self proxyForAnnotation:pinview];
			if (viewProxy!=nil)
			{
				//NOTE: clicksource is new for 0.9, was source in 0.8 but that conflicts with generic event naming
				NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:@"annotation",@"clicksource",viewProxy,@"annotation",[viewProxy title],@"title",NUMINT(pinview.tag),@"index",nil];
				
				// attempt to fire to the proxy's click listener
				if ([viewProxy _hasListeners:@"click"])
				{
					[viewProxy fireEvent:@"click" withObject:event];
				}
				
				// also allow the map itself to receive the click event
				if ([self.proxy _hasListeners:@"click"])
				{
					[self.proxy fireEvent:@"click" withObject:event];
				}
			}
		}
	}
}

- (void)mapView:(MKMapView *)mapView annotationView:(MKAnnotationView *)aview calloutAccessoryControlTapped:(UIControl *)control
{
	if ([aview isKindOfClass:[MKPinAnnotationView class]])
	{
		MKPinAnnotationView *pinview = (MKPinAnnotationView*)aview;
		TiMapAnnotationProxy *viewProxy = [self proxyForAnnotation:pinview];
		if (viewProxy!=nil)
		{
			BOOL parentWants = [self.proxy _hasListeners:@"click"];
			BOOL viewWants = [viewProxy _hasListeners:@"click"];
			
			if (parentWants||viewWants)
			{
				NSMutableDictionary *event = [NSMutableDictionary dictionaryWithObjectsAndKeys:viewProxy,@"annotation",[viewProxy title],@"title",NUMINT(viewProxy.tag),@"index",nil];
			
				if (aview.leftCalloutAccessoryView == control)
				{
					[event setObject:@"leftButton" forKey:@"clicksource"];
				}
				else if (aview.rightCalloutAccessoryView == control)
				{
					[event setObject:@"rightButton" forKey:@"clicksource"];
				}
				
				if (parentWants)
				{
					// give the parent listener a hook to the specific annotation being clicked
					[event setObject:viewProxy forKey:@"annotation"];
					[self.proxy fireEvent:@"click" withObject:event];
				}
				if (viewWants)
				{
					// give the annotation listener a hook to the map
					[event setObject:self.proxy forKey:@"map"];
					[self.proxy fireEvent:@"click" withObject:event];
				}
			}
		}
	}
}

// mapView:viewForAnnotation: provides the view for each annotation.
// This method may be called for all or some of the added annotations.
// For MapKit provided annotations (eg. MKUserLocation) return nil to use the MapKit provided annotation view.
- (MKAnnotationView *)mapView:(MKMapView *)mapView viewForAnnotation:(id <MKAnnotation>)annotation
{
	if ([annotation isKindOfClass:[TiMapAnnotationProxy class]])
	{
		TiMapAnnotationProxy *ann = (TiMapAnnotationProxy*)annotation;
		static NSString *identifier = @"timap";
		MKPinAnnotationView *annView = nil;
		
		if (![(TiMapAnnotationProxy *)annotation needsRefreshingWithSelection])
		{
			annView = (MKPinAnnotationView*) [mapView dequeueReusableAnnotationViewWithIdentifier:identifier];
		}
		if (annView==nil)
		{
			annView=[[[TiMapPinAnnotationView alloc] initWithAnnotation:ann reuseIdentifier:identifier map:self] autorelease];
		}
		annView.pinColor = [ann pinColor];
		annView.animatesDrop = [ann animatesDrop] && ![(TiMapAnnotationProxy *)annotation needsRefreshingWithSelection];
		annView.canShowCallout = YES;
		annView.calloutOffset = CGPointMake(-5, 5);
		annView.enabled = YES;
		UIView *left = [ann leftViewAccessory];
		UIView *right = [ann rightViewAccessory];
		if (left!=nil)
		{
			annView.leftCalloutAccessoryView = left;
		}
		if (right!=nil)
		{
			annView.rightCalloutAccessoryView = right;
		}
		annView.userInteractionEnabled = YES;
		annView.tag = [ann tag];
		return annView;
	}
	return nil;
}

// mapView:didAddAnnotationViews: is called after the annotation views have been added and positioned in the map.
// The delegate can implement this method to animate the adding of the annotations views.
// Use the current positions of the annotation views as the destinations of the animation.
- (void)mapView:(MKMapView *)mapView didAddAnnotationViews:(NSArray *)views
{
}


@end
