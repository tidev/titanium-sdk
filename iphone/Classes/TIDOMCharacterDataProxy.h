/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TiDOMNodeProxy.h"
#import <TitaniumKit/TiProxy.h>

@interface TiDOMCharacterDataProxy : TiDOMNodeProxy {
  @private
}

@property (nonatomic, copy, readwrite) NSString *data;
@property (nonatomic, readonly) NSNumber *length;
- (NSString *)substringData:(id)args;
- (void)appendData:(id)args;
- (void)insertData:(id)args;
- (void)deleteData:(id)args;
- (void)replaceData:(id)args;

@end

#endif
