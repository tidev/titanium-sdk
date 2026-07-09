/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)
#import "TiDOMNodeProxy.h"

@interface TiDOMEntityProxy : TiDOMNodeProxy {
}
@property (nonatomic, readonly) id notationName;
@property (nonatomic, readonly) id publicId;
@property (nonatomic, readonly) id systemId;
@end
#endif
