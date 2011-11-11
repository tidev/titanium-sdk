//
//  TiDOMPIProxy.h
//  Titanium
//
//  Created by default on 10/31/11.
//  Copyright (c) 2011 Appcelerator, Inc. All rights reserved.
//
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)
#import "TiDOMNodeProxy.h"

@interface TiDOMPIProxy : TiDOMNodeProxy{   
}
@property(nonatomic,copy,readwrite) NSString * data;
@property(nonatomic,readonly) NSString * target;


@end
#endif