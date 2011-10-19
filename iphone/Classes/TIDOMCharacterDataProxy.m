/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TiDOMCharacterDataProxy.h"
#import "TiUtils.h"

@implementation TiDOMCharacterDataProxy


-(id)text
{
	[node stringValue];
}

@end

#endif
