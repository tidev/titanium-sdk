/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MAP


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
	RELEASE_TO_NIL(pendingAnnotationSelection);
	[super dealloc];
}

-(void)render
{
	if (region.center.latitude!=0 && region.center.longitude!=0)
	{
		[map setRegion:[map regionThatFits:region] animated:animate];
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

-(NSArray*)annotationsFromArgs:(id)value
{
	ENSURE_TYPE_OR_NIL(value,NSArray);
	NSMutableArray * result = [NSMutableArray arrayWithCapacity:[value count]];
	if (value!=nil)
	{
		for (id arg in value)
		{
			[result addObject:[self annotationFromArg:arg]];
		}
	}
	return result;
}

-(void)refreshAnnotation:(TiMapAnnotationProxy*)proxy readd:(BOOL)yn
{
	NSArray *selected = map.selectedAnnotations;
	BOOL wasSelected = [selected containsObject:proxy]; //If selected == nil, this still returns FALSE.
	if (yn==NO)
	{
		[map deselectAnnotation:proxy animated:NO];
	}
	else
	{
		[map removeAnnotation:proxy];
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

-(void)addAnnotations:(id)args
{
	ENSURE_UI_THREAD(addAnnotations,args);
	ENSURE_TYPE(args,NSArray);

	[[self map] addAnnotations:[self annotationsFromArgs:args]];
}

-(void)removeAnnotation:(id)args
{
	ENSURE_UI_THREAD(removeAnnotation,args);
	ENSURE_SINGLE_ARG(args,NSObject);

	id<MKAnnotation> doomedAnnotation = nil;
	
	if ([args isKindOfClass:[NSString class]])
	{
		// for pre 0.9, we supporting removing by passing the annotation title
		NSString *title = [TiUtils stringValue:args];
		for (id<MKAnnotation>an in [NSArray arrayWithArray:[self map].annotations])
		{
			if ([title isEqualToString:an.title])
			{
				doomedAnnotation = an;
				break;
			}
		}
	}
	else if ([args isKindOfClass:[TiMapAnnotationProxy class]])
	{
		doomedAnnotation = args;
	}
	
	[[self map] removeAnnotation:doomedAnnotation];
}

-(void)removeAnnotations:(id)args
{
	ENSURE_UI_THREAD(removeAnnotations,args);
	ENSURE_TYPE(args,NSArray); // assumes an array of TiMapAnnotationProxy classes
	[[self map] removeAnnotations:args];
}

-(void)removeAllAnnotations:(id)args
{
	ENSURE_UI_THREAD(removeAllAnnotations,args);
	[[self map] removeAnnotations:[[self map] annotations]];
}

-(void)setAnnotations_:(id)value
{
	ENSURE_UI_THREAD(setAnnotations_,value)
	ENSURE_TYPE_OR_NIL(value,NSArray);
	[[self map] removeAnnotations:[[self map] annotations]];
	if (value != nil) {
		[[self map] addAnnotations:[self annotationsFromArgs:value]];
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
				// TODO: Slide the view over to the selected annotation, and/or zoom so it's with all other selected.
				if (loaded) {
					[[self map] selectAnnotation:an animated:animate];
				}
				else {
					pendingAnnotationSelection = [an retain];
				}
				break;
			}
		}
	}
	else if ([args isKindOfClass:[TiMapAnnotationProxy class]])
	{
		if (loaded) {
			[[self map] selectAnnotation:args animated:animate];
		}
		else {
			pendingAnnotationSelection = [args retain];
		}
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
				if (loaded) {
					[[self map] deselectAnnotation:an animated:animate];
				}
				else {
					RELEASE_TO_NIL(pendingAnnotationSelection);
				}
				break;
			}
		}
	}
	else if ([args isKindOfClass:[TiMapAnnotationProxy class]])
	{
		if (loaded) {
			[[self map] deselectAnnotation:args animated:animate];
		}
		else {
			RELEASE_TO_NIL(pendingAnnotationSelection);
		}
	}
}

-(void)zoom:(id)args
{
	ENSURE_UI_THREAD(zoom,args);
	ENSURE_SINGLE_ARG(args,NSObject);
	double v = [TiUtils doubleValue:args];
	// TODO: Find a good delta tolerance value to deal with floating point goofs
	if (v == 0.0) {
		return;
	}
	MKCoordinateRegion _region = [[self map] region];
	// TODO: Adjust zoom factor based on v
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
	loaded = NO;
	if ([self.proxy _hasListeners:@"loading"])
	{
		[self.proxy fireEvent:@"loading" withObject:nil];
	}
}

- (void)mapViewDidFinishLoadingMap:(MKMapView *)mapView
{
	loaded = YES;
	if (pendingAnnotationSelection != nil) {
		[[self map] selectAnnotation:pendingAnnotationSelection animated:animate];
		RELEASE_TO_NIL(pendingAnnotationSelection);
	}
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
	if([action isEqualToString:@"ANSELECTED"] && [object isKindOfClass:[TiMapPinAnnotationView class]])
	{
		BOOL isSelected = [(MKPinAnnotationView *)object isSelected];
		[self fireClickEvent:(MKPinAnnotationView*)object source:
				isSelected?@"pin":[(TiMapPinAnnotationView*)object lastHitName]];
	}
}

- (void)mapView:(MKMapView *)mapView annotationView:(MKAnnotationView *)aview calloutAccessoryControlTapped:(UIControl *)control
{
	if ([aview isKindOfClass:[MKPinAnnotationView class]])
	{
		MKPinAnnotationView *pinview = (MKPinAnnotationView*)aview;
		NSString * clickSource = @"unknown";
		if (aview.leftCalloutAccessoryView == control)
		{
			clickSource = @"leftButton";
		}
		else if (aview.rightCalloutAccessoryView == control)
		{
			clickSource = @"rightButton";
		}
		[self fireClickEvent:pinview source:clickSource];
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
		
		if (![ann needsRefreshingWithSelection])
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

#pragma mark Event generation

- (void)fireClickEvent:(MKPinAnnotationView *) pinview source:(NSString *)source
{
	TiMapAnnotationProxy *viewProxy = [self proxyForAnnotation:pinview];
	if ((viewProxy == nil) || (source == nil))
	{
		return;
	}

	TiProxy * ourProxy = [self proxy];
	BOOL parentWants = [ourProxy _hasListeners:@"click"];
	BOOL viewWants = [viewProxy _hasListeners:@"click"];
	if(!parentWants && !viewWants)
	{
		return;
	}
	
	id title = [viewProxy title];
	if (title == nil)
	{
		title = [NSNull null];
	}

	NSNumber * indexNumber = NUMINT([pinview tag]);

	NSDictionary * event = [NSDictionary dictionaryWithObjectsAndKeys:
			source,@"clicksource",	viewProxy,@"annotation",	ourProxy,@"map",
			title,@"title",			indexNumber,@"index",		nil];


	if (parentWants)
	{
		[ourProxy fireEvent:@"click" withObject:event];
	}
	if (viewWants)
	{
		[viewProxy fireEvent:@"click" withObject:event];
	}
}


@end

#endif