/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)
#import "TiDOMPIProxy.h"
// Corresponds to Interface ProcessingInstruction of DOM2 Spec.
@implementation TiDOMPIProxy

-(NSString *)data
{
	return [node stringValue];
}

-(void)setData:(NSString *)data
{
	ENSURE_TYPE(data, NSString);
	[node setStringValue:data];
}

-(NSString*)target
{
    return [node name];
}


@end
#endif