/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiMapViewProxy.h"
#import "TiMapView.h"

@implementation TiMapViewProxy

USE_VIEW_FOR_UI_METHOD(zoom)
USE_VIEW_FOR_UI_METHOD(selectAnnotation)
USE_VIEW_FOR_UI_METHOD(deselectAnnotation)
USE_VIEW_FOR_UI_METHOD(addAnnotation)
USE_VIEW_FOR_UI_METHOD(removeAnnotation)

@end
