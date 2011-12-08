/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

/**
 * This supports the NamedNodeMap for the property "attributes"
 * defined by Interface Node.
 * The support for NamedNodeMap for the properties "entites" and "notations" 
 * defined by Interface DocumentType is not yet implemented.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TiProxy.h"
#import "GDataXMLNode.h"
#import "TiDOMElementProxy.h"

@interface TiDOMNamedNodeMapProxy : TiProxy {
@private
	TiDOMElementProxy* element;
}

@property(nonatomic,readonly) NSNumber* length;

-(void)setElement:(TiDOMElementProxy*)element;

@end

#endif