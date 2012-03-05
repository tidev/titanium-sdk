/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)
#import "TiDOMNodeProxy.h"
// Corresponds to Interface ProcessingInstruction of DOM2 Spec.

@interface TiDOMPIProxy : TiDOMNodeProxy{   
}
@property(nonatomic,copy,readwrite) NSString * data;
@property(nonatomic,readonly) NSString * target;


@end
#endif