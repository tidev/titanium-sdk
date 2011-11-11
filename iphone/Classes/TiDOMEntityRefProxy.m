//
//  TiDOMEntityRefProxy.m
//  Titanium
//
//  Created by default on 11/1/11.
//  Copyright (c) 2011 Appcelerator, Inc. All rights reserved.
//
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)
#import "TiDOMEntityRefProxy.h"

@implementation TiDOMEntityRefProxy
-(id)nodeValue
{
	// DOM spec says nodeValue must return null
	return [NSNull null];
}
@end
#endif