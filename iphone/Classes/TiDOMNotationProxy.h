//
//  TiDOMNotationProxy.h
//  Titanium
//
//  Created by default on 11/1/11.
//  Copyright (c) 2011 Appcelerator, Inc. All rights reserved.
//
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)
#import "TiDOMNodeProxy.h"

@interface TiDOMNotationProxy : TiDOMNodeProxy{
    
}
@property(nonatomic,readonly) id publicId;
@property(nonatomic,readonly) id systemId;

@end
#endif