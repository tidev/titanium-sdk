/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIMASKEDIMAGE

#import "TiUIView.h"
#import <QuartzCore/QuartzCore.h>

@interface TiUIMaskedImage : TiUIView {
@private
	NSURL * imageURL;
	NSURL * maskURL;
	UIColor * tint;
	CGBlendMode mode;	
}

@end

#endif