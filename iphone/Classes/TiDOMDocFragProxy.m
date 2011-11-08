//
//  TiDOMDocFragProxy.m
//  Titanium
//
//  Created by default on 10/31/11.
//  Copyright (c) 2011 __MyCompanyName__. All rights reserved.
//
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)
#import "TiDOMDocFragProxy.h"

@implementation TiDOMDocFragProxy

-(id)nodeValue
{
	// DOM spec says nodeValue must return null
	return [NSNull null];
}
@end
#endif