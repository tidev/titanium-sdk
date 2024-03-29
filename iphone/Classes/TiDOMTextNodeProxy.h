/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TIDOMCharacterDataProxy.h"
#import <TitaniumKit/TiProxy.h>

@interface TiDOMTextNodeProxy : TiDOMCharacterDataProxy {
  @private
}

- (TiDOMTextNodeProxy *)splitText:(id)args;

@end

#endif
