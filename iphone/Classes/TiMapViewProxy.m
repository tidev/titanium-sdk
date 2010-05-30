/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MAP

#import "TiMapViewProxy.h"
#import "TiMapView.h"

@implementation TiMapViewProxy

#define CREATE_VIEW_FOR_UI_METHOD(methodname) \
-(void)methodname:(id)args \
{\
	[[self view] performSelectorOnMainThread:@selector(methodname:) withObject:args waitUntilDone:NO];\
}

CREATE_VIEW_FOR_UI_METHOD(zoom)
CREATE_VIEW_FOR_UI_METHOD(selectAnnotation)
CREATE_VIEW_FOR_UI_METHOD(deselectAnnotation)
CREATE_VIEW_FOR_UI_METHOD(addAnnotation)
CREATE_VIEW_FOR_UI_METHOD(addAnnotations)
CREATE_VIEW_FOR_UI_METHOD(removeAnnotation)
CREATE_VIEW_FOR_UI_METHOD(removeAnnotations)
CREATE_VIEW_FOR_UI_METHOD(removeAllAnnotations)

@end

#endif