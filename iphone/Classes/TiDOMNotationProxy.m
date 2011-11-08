//
//  TiDOMNotationProxy.m
//  Titanium
//
//  Created by default on 11/1/11.
//  Copyright (c) 2011 __MyCompanyName__. All rights reserved.
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
    return nil;
}
-(id)systemId{
    //TODO
    return nil;
}
@end
#endif