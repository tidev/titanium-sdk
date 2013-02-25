/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"

#ifdef USE_TI_MAP

#import <MapKit/MapKit.h>
#import "TiMapView.h"
#import "TiViewProxy.h"

@interface TiMapCustomAnnotationView : MKAnnotationView<TiMapAnnotation> {
@private
    NSString * lastHitName;
    TiViewProxy* theProxy;
    UIView* wrapperView;
}

- (id)initWithAnnotation:(id <MKAnnotation>)annotation reuseIdentifier:(NSString *)reuseIdentifier map:(TiMapView*)map;
- (NSString *)lastHitName;
- (void)setProxy:(TiViewProxy*)customView;

@end
#endif
