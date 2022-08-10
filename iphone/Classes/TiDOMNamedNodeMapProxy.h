/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
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

#import "GDataXMLNode.h"
#import "TiDOMElementProxy.h"
#import <TitaniumKit/TiProxy.h>

@interface TiDOMNamedNodeMapProxy : TiProxy {
  @private
  TiDOMElementProxy *element;
}

@property (nonatomic, readonly) NSNumber *length;

- (void)setElement:(TiDOMElementProxy *)element;

@end

#endif
