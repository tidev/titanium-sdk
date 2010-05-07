/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TiProxy.h"
#import "GDataXMLNode.h"

//TODO: extend from TiDOMNodeProxy
@interface TiDOMAttrProxy : TiProxy {
@private
	NSString *name;
	NSString *value;
	GDataXMLElement *owner;
}

@property(nonatomic,readonly) id name;
@property(nonatomic,readonly) id value;
@property(nonatomic,readonly) id ownerElement;

-(void)setAttribute:(NSString*)name value:(NSString*)value owner:(GDataXMLElement*)owner;

@end

#endif