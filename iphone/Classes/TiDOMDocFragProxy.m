/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)
#import "TiDOMDocFragProxy.h"

// Corresponds to Interface DocumentFragment of DOM2 Spec
@implementation TiDOMDocFragProxy

-(id)nodeValue
{
	// DOM spec says nodeValue must return null
	return [NSNull null];
}
@end
#endif