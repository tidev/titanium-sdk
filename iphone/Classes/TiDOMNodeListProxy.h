/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TiProxy.h"
#import "GDataXMLNode.h"

@interface TiDOMNodeListProxy : TiProxy {
@private
	NSArray *nodes;
}

@property(nonatomic,readonly) NSNumber *length;

-(void)setNodes:(NSArray*)nodes_;

@end

#endif