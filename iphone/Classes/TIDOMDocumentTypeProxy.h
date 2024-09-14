/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "GDataXMLNode.h"
#import "TiDOMNodeProxy.h"

@interface TIDOMDocumentTypeProxy : TiDOMNodeProxy {
}
@property (nonatomic, readonly) id name;
@property (nonatomic, readonly) id entities;
@property (nonatomic, readonly) id notations;
@property (nonatomic, readonly) id publicId;
@property (nonatomic, readonly) id systemId;
@property (nonatomic, readonly) id internalSubset;
@end

#endif
