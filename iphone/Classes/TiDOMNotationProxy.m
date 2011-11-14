//
//  TiDOMNotationProxy.m
//  Titanium
//
//  Created by default on 11/1/11.
//  Copyright (c) 2011 Appcelerator, Inc. All rights reserved.
//
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)
#import "TiDOMNotationProxy.h"

@implementation TiDOMNotationProxy

-(id)nodeValue
{
	// DOM spec says nodeValue must return null
	return [NSNull null];
}

-(id)publicId{
    //TODO
    return [NSNull null];
}
-(id)systemId{
    //TODO
    return [NSNull null];
}
@end
#endif