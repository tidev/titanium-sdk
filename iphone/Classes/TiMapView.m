/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"

#ifdef USE_TI_MAP

#import "TiMapView.h"
#import "TiUtils.h"
#import "TiMapAnnotationProxy.h"
#import "TiMapPinAnnotationView.h"
#import "TiMapImageAnnotationView.h"

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
    if (mapLine2View) {
        CFRelease(mapLine2View);
        mapLine2View = nil;
    }
    if (mapName2Line) {
        CFRelease(mapName2Line);
        mapName2Line = nil;
    }
	[super dealloc];
}

-(void)render
{
	if (![NSThread isMainThread]) {
		[self performSelectorOnMainThread:@selector(render) withObject:nil waitUntilDone:NO];
		return;
	}  	  
	if (region.center.latitude!=0 && region.center.longitude!=0)
	{
		[map setRegion:[map regionThatFits:region] animated:animate];
	}
}

-(MKMapView*)map
{
	if (map==nil)
	{
		map = [[MKMapView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
		map.delegate = self;
		map.userInteractionEnabled = YES;
		map.showsUserLocation = YES; // defaults
		map.autoresizingMask = UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight;
		[self addSubview:map];
		mapLine2View = CFDictionaryCreateMutable(NULL, 10, &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);
		mapName2Line = CFDictionaryCreateMutable(NULL, 10, &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);
        
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
	[self render];
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
		[arg setPlaced:NO];
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
	ENSURE_SINGLE_ARG(args,NSObject);
	ENSURE_UI_THREAD(addAnnotation,args);
	[[self map] addAnnotation:[self annotationFromArg:args]];
}

-(void)addAnnotations:(id)args
{
	ENSURE_TYPE(args,NSArray);
	ENSURE_UI_THREAD(addAnnotations,args);

	[[self map] addAnnotations:[self annotationsFromArgs:args]];
}

-(void)removeAnnotation:(id)args
{
	ENSURE_SINGLE_ARG(args,NSObject);
	ENSURE_UI_THREAD(removeAnnotation,args);

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
	ENSURE_TYPE(args,NSArray); // assumes an array of TiMapAnnotationProxy classes
	ENSURE_UI_THREAD(removeAnnotations,args);
	[[self map] removeAnnotations:args];
}

-(void)removeAllAnnotations:(id)args
{
	ENSURE_UI_THREAD(removeAllAnnotations,args);
	[[self map] removeAnnotations:[[self map] annotations]];
}

-(void)setAnnotations_:(id)value
{
	ENSURE_TYPE_OR_NIL(value,NSArray);
	ENSURE_UI_THREAD(setAnnotations_,value)
	[[self map] removeAnnotations:[[self map] annotations]];
	if (value != nil) {
		[[self map] addAnnotations:[self annotationsFromArgs:value]];
	}
}

-(void)flushPendingAnnotation
{
	if (pendingAnnotationSelection != nil) {
		hitSelect = NO;
		manualSelect = YES;
		hitAnnotation = pendingAnnotationSelection;
		[map selectAnnotation:pendingAnnotationSelection animated:animate];
		if([map selectedAnnotations] != nil)
		{
			RELEASE_TO_NIL(pendingAnnotationSelection);
		}
	}
}

-(void)selectOrSetPendingAnnotation:(id<MKAnnotation>)annotation
{
	if (loaded)
	{
		hitAnnotation = annotation;
		hitSelect = NO;
		manualSelect = YES;
		[[self map] selectAnnotation:annotation animated:animate];
	}
	else {
		[pendingAnnotationSelection release];
		pendingAnnotationSelection = [annotation retain];
	}
}

-(void)selectAnnotation:(id)args
{
	ENSURE_SINGLE_ARG_OR_NIL(args,NSObject);
	ENSURE_UI_THREAD(selectAnnotation,args);
	
	if (args == nil) {
		for (id<MKAnnotation> annotation in [[self map] selectedAnnotations]) {
			hitAnnotation = annotation;
			hitSelect = NO;
			manualSelect = YES;
			[[self map] deselectAnnotation:annotation animated:animate];
		}
		return;
	}
	
	if ([args isKindOfClass:[NSString class]])
	{
		// for pre 0.9, we supported selecting by passing the annotation title
		NSString *title = [TiUtils stringValue:args];
		for (id<MKAnnotation>an in [NSArray arrayWithArray:[self map].annotations])
		{
			if ([title isEqualToString:an.title])
			{
				// TODO: Slide the view over to the selected annotation, and/or zoom so it's with all other selected.
				[self selectOrSetPendingAnnotation:an];
				break;
			}
		}
	}
	else if ([args isKindOfClass:[TiMapAnnotationProxy class]])
	{
		[self selectOrSetPendingAnnotation:args];
	}
}

-(void)deselectAnnotation:(id)args
{
	ENSURE_SINGLE_ARG(args,NSObject);
	ENSURE_UI_THREAD(deselectAnnotation,args);

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
	ENSURE_SINGLE_ARG(args,NSObject);
	ENSURE_UI_THREAD(zoom,args);

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
			if (fitRegion.span.latitudeDelta == 0 || fitRegion.span.longitudeDelta == 0)
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

-(void)addRoute:(id)args
{
	// process args
    ENSURE_DICT(args);
	
	NSArray *points = [args objectForKey:@"points"];
	if (!points) {
		[self throwException:@"missing required points key" subreason:nil location:CODELOCATION];
	}
    if (![points count]) {
		[self throwException:@"missing required points data" subreason:nil location:CODELOCATION];
    }
	NSString *name = [TiUtils stringValue:@"name" properties:args];
	if (!name) {
		[self throwException:@"missing required name key" subreason:nil location:CODELOCATION];
	}
    TiColor* color = [TiUtils colorValue:@"color" properties:args];
    float width = [TiUtils floatValue:@"width" properties:args def:2];

    // construct the MKPolyline 
    MKMapPoint* pointArray = malloc(sizeof(CLLocationCoordinate2D) * [points count]);
    for (int i = 0; i < [points count]; ++i) {
        NSDictionary* entry = [points objectAtIndex:i];
        CLLocationDegrees lat = [TiUtils doubleValue:[entry objectForKey:@"latitude"]];
        CLLocationDegrees lon = [TiUtils doubleValue:[entry objectForKey:@"longitude"]];
        CLLocationCoordinate2D coord = CLLocationCoordinate2DMake(lat, lon);
        MKMapPoint pt = MKMapPointForCoordinate(coord);
        pointArray[i] = pt;             
    }
    MKPolyline* routeLine = [[MKPolyline polylineWithPoints:pointArray count:[points count]] autorelease];
    free(pointArray);
    
	// construct the MKPolylineView
    MKPolylineView* routeView = [[MKPolylineView alloc] initWithPolyline:routeLine];
    routeView.fillColor = routeView.strokeColor = color ? [color _color] : [UIColor blueColor];
    routeView.lineWidth = width;
    
    // update our mappings
    CFDictionaryAddValue(mapName2Line, name, routeLine);
    CFDictionaryAddValue(mapLine2View, routeLine, routeView);
    // finally add our new overlay
    [map addOverlay:routeLine];
}

-(void)removeRoute:(id)args
{
    ENSURE_DICT(args);
    NSString* name = [TiUtils stringValue:@"name" properties:args];
	if (!name) {
		[self throwException:@"missing required name key" subreason:nil location:CODELOCATION];
	}
    
    MKPolyline* routeLine = (MKPolyline*)CFDictionaryGetValue(mapName2Line, name);
    if (routeLine) {
        CFDictionaryRemoveValue(mapLine2View, routeLine);
        CFDictionaryRemoveValue(mapName2Line, name);
        [map removeOverlay:routeLine];
    }
}


#pragma mark Delegates

- (MKOverlayView *)mapView:(MKMapView *)mapView viewForOverlay:(id <MKOverlay>)overlay
{	
    return (MKOverlayView *)CFDictionaryGetValue(mapLine2View, overlay);
}

- (void)mapView:(MKMapView *)mapView regionWillChangeAnimated:(BOOL)animated
{
}

- (void)mapView:(MKMapView *)mapView regionDidChangeAnimated:(BOOL)animated
{
	[self flushPendingAnnotation];
	
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
	ignoreClicks = YES;
	loaded = YES;
	[self flushPendingAnnotation];
	if ([self.proxy _hasListeners:@"complete"])
	{
		[self.proxy fireEvent:@"complete" withObject:nil];
	}
	ignoreClicks = NO;
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

- (TiMapAnnotationProxy*)proxyForAnnotation:(MKAnnotationView*)pinview
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

// TODO: We can remove all this when we go to 4.0-only... including the click detection stuff, thanks to new delegates.
- (void)observeValueForKeyPath:(NSString *)keyPath
                      ofObject:(id)object
                        change:(NSDictionary *)change
                       context:(void *)context
{
	NSString *action = (NSString*)context;
	if([action isEqualToString:@"ANSELECTED"])
	{
		if ([object conformsToProtocol:@protocol(TiMapAnnotation)])
		{
			MKAnnotationView<TiMapAnnotation> *ann = (MKAnnotationView<TiMapAnnotation> *)object;
			BOOL isSelected = [ann isSelected];
			
			// Short-circuit on manual selection; we don't need to do all the expensive "which point did we hit" stuff
			if (manualSelect || hitSelect && (hitAnnotation == [ann annotation] || hitAnnotation == nil)) {
				[self fireClickEvent:ann source:isSelected?@"pin":[ann lastHitName]];
				// Manual selection only fires once - but don't clear hitAnnotation until the next hit event/manual select
				// hitSelect is necessary to avoid some internal madness where 'selected' will toggle rapidly when scrolling to
				// show an annotation's accessory view
				manualSelect = NO;
				hitSelect = NO;
				return;
			}
		}
	}
}

- (void)mapView:(MKMapView *)mapView annotationView:(MKAnnotationView *)aview calloutAccessoryControlTapped:(UIControl *)control
{
	if ([aview conformsToProtocol:@protocol(TiMapAnnotation)])
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
	if(annotation == pendingAnnotationSelection)
	{
		[self performSelector:@selector(flushPendingAnnotation) withObject:nil afterDelay:0.0];
	}
	if ([annotation isKindOfClass:[TiMapAnnotationProxy class]])
	{
		TiMapAnnotationProxy *ann = (TiMapAnnotationProxy*)annotation;
		static NSString *identifier = @"timap";
		MKAnnotationView *annView = nil;
		
		if (![ann needsRefreshingWithSelection])
		{
			annView = (MKAnnotationView*) [mapView dequeueReusableAnnotationViewWithIdentifier:identifier];
		}
		if (annView==nil)
		{
			id imagePath = [ann valueForUndefinedKey:@"image"];
			if (imagePath!=nil)
			{
				UIImage *image = [TiUtils image:imagePath proxy:ann];
				if (image!=nil)
				{
					annView=[[[TiMapImageAnnotationView alloc] initWithAnnotation:ann reuseIdentifier:identifier map:self image:image] autorelease];
				}
			}
			// check to make sure not already created above
			if (annView==nil)
			{
				annView=[[[TiMapPinAnnotationView alloc] initWithAnnotation:ann reuseIdentifier:identifier map:self] autorelease];
			}
		}
		if ([annView isKindOfClass:[MKPinAnnotationView class]])
		{
			MKPinAnnotationView *pinview = (MKPinAnnotationView*)annView;
			pinview.pinColor = [ann pinColor];
			pinview.animatesDrop = [ann animatesDrop] && ![(TiMapAnnotationProxy *)annotation placed];
			annView.calloutOffset = CGPointMake(-5, 5);
		}
		annView.canShowCallout = YES;
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
	for (MKAnnotationView<TiMapAnnotation> *thisView in views)
	{
		if(![thisView conformsToProtocol:@protocol(TiMapAnnotation)])
		{
			return;
		}
		TiMapAnnotationProxy * thisProxy = [self proxyForAnnotation:thisView];
		[thisProxy setPlaced:YES];
	}
}
-(void) mapView:(MKMapView *)mapView didDeselectAnnotationView:(MKAnnotationView *) views
{
}

#pragma mark Click detection

-(id<MKAnnotation>)wasHitOnAnnotation:(CGPoint)point inView:(UIView*)view
{
	id<MKAnnotation> result = nil;
	for (UIView* subview in [view subviews]) {
		if (![subview pointInside:[self convertPoint:point toView:subview] withEvent:nil]) {
			continue;
		}
		
		if ([subview isKindOfClass:[MKAnnotationView class]]) {
			result = [(MKAnnotationView*)subview annotation];
		}
		else {
			result = [self wasHitOnAnnotation:point inView:subview];
		}
		
		if (result != nil) {
			break;
		}
	}
	return result;
}

-(UIView*)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
	UIView* result = [super hitTest:point withEvent:event];
	if (result != nil) {
		// OK, we hit something - if the result is an annotation... (3.2+)
		if ([result isKindOfClass:[MKAnnotationView class]]) {
			hitAnnotation = [(MKAnnotationView*)result annotation];
		} else {
			hitAnnotation = nil;
		}
	} else {
		hitAnnotation = nil;
	}
	hitSelect = YES;
	manualSelect = NO;
	return result;
}

#pragma mark Event generation

- (void)fireClickEvent:(MKAnnotationView *) pinview source:(NSString *)source
{
	if (ignoreClicks)
	{
		return;
	}

	TiMapAnnotationProxy *viewProxy = [self proxyForAnnotation:pinview];
	if (viewProxy == nil)
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
	id clicksource = source ? source : (id)[NSNull null];
	
	NSDictionary * event = [NSDictionary dictionaryWithObjectsAndKeys:
			clicksource,@"clicksource",	viewProxy,@"annotation",	ourProxy,@"map",
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