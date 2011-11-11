//
//  TiDOMPIProxy.m
//  Titanium
//
//  Created by default on 10/31/11.
//  Copyright (c) 2011 Appcelerator, Inc. All rights reserved.
//  Corresponds to Interface ProcessingInstruction of DOM2 Spec.
//
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)
#import "TiDOMPIProxy.h"

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