/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "GDataXMLNode.h"
#import <TitaniumKit/TiProxy.h>

@interface TiDOMNodeListProxy : TiProxy {
  @private
  NSArray *nodes;
  GDataXMLDocument *document;
}

@property (nonatomic, readonly) NSNumber *length;
- (id)item:(id)args;
- (NSNumber *)length;

- (id)_initWithPageContext:(id<TiEvaluator>)context nodes:(NSArray *)nodeList document:(GDataXMLDocument *)theDocument;

@end

#endif
