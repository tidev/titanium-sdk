/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIACTIVITYINDICATOR

#import "TiUIActivityIndicatorProxy.h"
#import "TiUIActivityIndicator.h"

@implementation TiUIActivityIndicatorProxy

-(TiUIView*)newView
{
	TiUIActivityIndicator * result = [[TiUIActivityIndicator alloc] init];
	return result;
}

USE_VIEW_FOR_AUTO_WIDTH

USE_VIEW_FOR_AUTO_HEIGHT

@end

#endif