/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TiDOMNodeListProxy.h"
#import "TiDOMNodeProxy.h"
#import <TitaniumKit/TiUtils.h>

@implementation TiDOMNodeListProxy

- (id)_initWithPageContext:(id<TiEvaluator>)context nodes:(NSArray *)nodeList document:(GDataXMLDocument *)theDocument;
{
  if (self = [super _initWithPageContext:context]) {
    nodes = [nodeList retain];
    document = [theDocument retain];
  }
  return self;
}

- (void)dealloc
{
  [nodes release];
  [document release];
  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.XML.NodeList";
}

- (id)item:(id)args
{
  ENSURE_SINGLE_ARG(args, NSObject);
  int index = [TiUtils intValue:args];

  if ((index < [nodes count]) && (index >= 0)) {
    GDataXMLNode *theNode = [nodes objectAtIndex:index];
    id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
    id nodeProxy = [TiDOMNodeProxy makeNode:theNode context:context];
    [(TiDOMNodeProxy *)nodeProxy setDocument:document];
    return nodeProxy;
  }
  return [NSNull null];
}

- (NSNumber *)length
{
  return NUMUINTEGER([nodes count]);
}

@end

#endif
