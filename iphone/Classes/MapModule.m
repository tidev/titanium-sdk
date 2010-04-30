/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MAP

#import "MapModule.h"
#import <MapKit/MapKit.h>

@implementation MapModule

MAKE_SYSTEM_PROP(STANDARD_TYPE,MKMapTypeStandard);
MAKE_SYSTEM_PROP(SATELLITE_TYPE,MKMapTypeSatellite);
MAKE_SYSTEM_PROP(HYBRID_TYPE,MKMapTypeHybrid);
MAKE_SYSTEM_PROP(ANNOTATION_RED,MKPinAnnotationColorRed);
MAKE_SYSTEM_PROP(ANNOTATION_GREEN,MKPinAnnotationColorGreen);
MAKE_SYSTEM_PROP(ANNOTATION_PURPLE,MKPinAnnotationColorPurple);

@end

#endif