/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TiDOMNodeProxy.h"
#import "TIDOMDocumentTypeProxy.h"
#import "TiDOMAttrProxy.h"
#import "TiDOMCDATANodeProxy.h"
#import "TiDOMCommentProxy.h"
#import "TiDOMDocFragProxy.h"
#import "TiDOMDocumentProxy.h"
#import "TiDOMElementProxy.h"
#import "TiDOMEntityProxy.h"
#import "TiDOMEntityRefProxy.h"
#import "TiDOMNamedNodeMapProxy.h"
#import "TiDOMNodeListProxy.h"
#import "TiDOMNotationProxy.h"
#import "TiDOMPIProxy.h"
#import "TiDOMTextNodeProxy.h"
#import "TiDOMValidator.h"
#import <TitaniumKit/TiUtils.h>
#include <libkern/OSAtomic.h>
#import <os/lock.h>
/*
 * The nodeRegistry is used to map xmlNodePtr objects to TiDOMNodeProxies
 * Ensures that there is only one active proxy for a give xmlNodePtr.
 * Values are inserted when the proxies are created
 * Values are removed when the proxies are freed
 */
static CFMutableDictionaryRef nodeRegistry = NULL;
os_unfair_lock nodeRegistryLock = OS_UNFAIR_LOCK_INIT;

@implementation TiDOMNodeProxy
@synthesize document, node;

#pragma mark Internal

- (void)dealloc
{
  if ([node XMLNode] != NULL) {
    [TiDOMNodeProxy removeNodeForXMLNode:[node XMLNode]];
  }
  RELEASE_TO_NIL(node);
  RELEASE_TO_NIL(document);
  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.XML.Node";
}

- (NSString *)XMLString
{
  return [node XMLString];
}

+ (id)nodeForXMLNode:(xmlNodePtr)nodePtr
{
  id result = nil;
  os_unfair_lock_lock(&nodeRegistryLock);
  if (nodeRegistry != NULL) {
    result = CFDictionaryGetValue(nodeRegistry, nodePtr);
  }
  os_unfair_lock_unlock(&nodeRegistryLock);
  return result;
}

Boolean simpleEquals(const void *value1, const void *value2)
{
  return value1 == value2;
}

CFHashCode simpleHash(const void *value)
{
  return (CFHashCode)value;
}

+ (void)setNode:(id)node forXMLNode:(xmlNodePtr)nodePtr
{
  if ((node == nil) || (nodePtr == NULL)) {
    return;
  }
  os_unfair_lock_lock(&nodeRegistryLock);
  if (nodeRegistry == NULL) {
    CFDictionaryKeyCallBacks keyCallbacks = kCFTypeDictionaryKeyCallBacks;
    CFDictionaryValueCallBacks callbacks = kCFTypeDictionaryValueCallBacks;
    keyCallbacks.retain = NULL;
    keyCallbacks.release = NULL;
    keyCallbacks.equal = simpleEquals;
    keyCallbacks.hash = simpleHash;
    callbacks.retain = NULL;
    callbacks.release = NULL;
    nodeRegistry = CFDictionaryCreateMutable(nil, 0, &keyCallbacks, &callbacks);
  }
  CFDictionarySetValue(nodeRegistry, (void *)nodePtr, node);
  os_unfair_lock_unlock(&nodeRegistryLock);
}

+ (void)removeNodeForXMLNode:(xmlNodePtr)nodePtr
{
  os_unfair_lock_lock(&nodeRegistryLock);
  if (nodeRegistry == NULL)
    return;
  CFDictionaryRemoveValue(nodeRegistry, nodePtr);
  os_unfair_lock_unlock(&nodeRegistryLock);
}

- (id)makeNodeListProxyFromArray:(NSArray *)nodes context:(id<TiEvaluator>)context
{
  return [[[TiDOMNodeListProxy alloc] _initWithPageContext:context nodes:nodes document:[self document]] autorelease];
}

+ (void)validateAttributeParameters:(NSString *)tagName withUri:(NSString *)theURI reason:(NSString **)error subreason:(NSString **)suberror
{
  NSString *prefix = [GDataXMLNode prefixForName:tagName];
  NSString *localName = [GDataXMLNode localNameForName:tagName];

  if (![[tagName lowercaseString] isEqualToString:@"xmlns"]) {
    //Check name validity
    if (![TiDOMValidator checkAttributeName:localName]) {
      *error = @"Invalid attribute name";
      *suberror = [NSString stringWithFormat:@"Offending localName %@", localName];
      return;
    }

    if (prefix != nil && ([theURI length] == 0)) {
      *error = @"Can not have a prefix with a nil or empty URI";
      return;
    }

    if ([prefix isEqualToString:@"xml"]) {
      if (![theURI isEqualToString:@"http://www.w3.org/XML/1998/namespace"]) {
        *error = @"Invalid URI for prefix";
        *suberror = [NSString stringWithFormat:@"%@:%@", prefix, theURI];
        return;
      }
    } else if ([prefix isEqualToString:@"xmlns"]) {
      if (![theURI isEqualToString:@"http://www.w3.org/2000/xmlns/"]) {
        *error = @"Invalid URI for prefix";
        *suberror = [NSString stringWithFormat:@"%@:%@", prefix, theURI];
        return;
      }
    } else {
      //Check prefix validity
      if (![TiDOMValidator checkNamespacePrefix:prefix]) {
        *error = @"Invalid prefix";
        *suberror = [NSString stringWithFormat:@"Offending prefix %@", prefix];
        return;
      }
      //Check URI validity
      if (![TiDOMValidator checkNamespaceURI:theURI]) {
        *error = @"Invalid URI";
        *suberror = [NSString stringWithFormat:@"Offending URI %@", theURI];
        return;
      }
    }

  } else {
    if (![theURI isEqualToString:@"http://www.w3.org/2000/xmlns/"]) {
      *error = @"Invalid URI for qualified name xmlns";
      *suberror = [NSString stringWithFormat:@"%@:%@", tagName, theURI];
    }
  }
}

+ (void)validateElementParameters:(NSString *)tagName withUri:(NSString *)theURI reason:(NSString **)error subreason:(NSString **)suberror
{
  NSString *prefix = [GDataXMLNode prefixForName:tagName];
  NSString *localName = [GDataXMLNode localNameForName:tagName];

  //Check name validity
  if (![TiDOMValidator checkElementName:localName]) {
    *error = @"Invalid element name";
    *suberror = [NSString stringWithFormat:@"Offending localName %@", localName];
    return;
  }

  if (prefix != nil && ([theURI length] == 0)) {
    *error = @"Can not have a prefix with a nil or empty URI";
    return;
  }

  if ([prefix isEqualToString:@"xml"]) {
    if (![theURI isEqualToString:@"http://www.w3.org/XML/1998/namespace"]) {
      *error = @"Invalid URI for prefix xml";
      *suberror = [NSString stringWithFormat:@"%@:%@", prefix, theURI];
      return;
    }
  } else {
    //Check prefix validity
    if (![TiDOMValidator checkNamespacePrefix:prefix]) {
      *error = @"Invalid prefix";
      *suberror = [NSString stringWithFormat:@"Offending prefix %@", prefix];
      return;
    }
    //Check URI validity
    if (![TiDOMValidator checkNamespaceURI:theURI]) {
      *error = @"Invalid URI";
      *suberror = [NSString stringWithFormat:@"Offending URI %@", theURI];
      return;
    }
  }
}

- (id)makeNode:(id)child context:(id<TiEvaluator>)context
{
  // if already a proxy, just return it.
  if ([child isKindOfClass:[TiDOMNodeProxy class]]) {
    return child;
  }

  id result = [TiDOMNodeProxy makeNode:child context:context];
  [result setDocument:[self document]];
  return result;
}

+ (id)makeNode:(id)child context:(id<TiEvaluator>)context
{
  // if already a proxy, just return it.
  if ([child isKindOfClass:[TiDOMNodeProxy class]]) {
    return child;
  }

  xmlNodePtr childXmlNode = [child XMLNode];

  id result = [TiDOMNodeProxy nodeForXMLNode:childXmlNode];
  if (result != nil) {
    return result;
  }

  switch (childXmlNode->type) {
  case XML_ELEMENT_NODE: {
    TiDOMElementProxy *element = [[[TiDOMElementProxy alloc] _initWithPageContext:context] autorelease];
    [element setElement:(GDataXMLElement *)child];
    [TiDOMNodeProxy setNode:element forXMLNode:childXmlNode];
    return element;
  }
  case XML_ATTRIBUTE_NODE: {
    TiDOMAttrProxy *proxy = [[[TiDOMAttrProxy alloc] _initWithPageContext:context] autorelease];
    [proxy setAttribute:[child name] value:[child stringValue] owner:nil];
    [proxy setNode:child];
    [TiDOMNodeProxy setNode:proxy forXMLNode:childXmlNode];
    return proxy;
  }
  case XML_TEXT_NODE: {
    TiDOMTextNodeProxy *proxy = [[[TiDOMTextNodeProxy alloc] _initWithPageContext:context] autorelease];
    [proxy setNode:child];
    [TiDOMNodeProxy setNode:proxy forXMLNode:childXmlNode];
    return proxy;
  }
  case XML_COMMENT_NODE: {
    TiDOMCommentProxy *proxy = [[[TiDOMCommentProxy alloc] _initWithPageContext:context] autorelease];
    [proxy setNode:child];
    [TiDOMNodeProxy setNode:proxy forXMLNode:childXmlNode];
    return proxy;
  }
  case XML_CDATA_SECTION_NODE: {
    TiDOMCDATANodeProxy *proxy = [[[TiDOMCDATANodeProxy alloc] _initWithPageContext:context] autorelease];
    [proxy setNode:child];
    [TiDOMNodeProxy setNode:proxy forXMLNode:childXmlNode];
    return proxy;
  }
  case XML_DOCUMENT_TYPE_NODE:
  case XML_DTD_NODE: {
    TIDOMDocumentTypeProxy *proxy = [[[TIDOMDocumentTypeProxy alloc] _initWithPageContext:context] autorelease];
    [proxy setNode:child];
    [TiDOMNodeProxy setNode:proxy forXMLNode:childXmlNode];
    return proxy;
  }
  case XML_DOCUMENT_FRAG_NODE: {
    TiDOMDocFragProxy *proxy = [[[TiDOMDocFragProxy alloc] _initWithPageContext:context] autorelease];
    [proxy setNode:child];
    [TiDOMNodeProxy setNode:proxy forXMLNode:childXmlNode];
    return proxy;
  }
  case XML_PI_NODE: {
    TiDOMPIProxy *proxy = [[[TiDOMPIProxy alloc] _initWithPageContext:context] autorelease];
    [proxy setNode:child];
    [TiDOMNodeProxy setNode:proxy forXMLNode:childXmlNode];
    return proxy;
  }
  case XML_ENTITY_REF_NODE: {
    TiDOMEntityRefProxy *proxy = [[[TiDOMEntityRefProxy alloc] _initWithPageContext:context] autorelease];
    [proxy setNode:child];
    [TiDOMNodeProxy setNode:proxy forXMLNode:childXmlNode];
    return proxy;
  }
  case XML_ENTITY_NODE: {
    TiDOMEntityProxy *proxy = [[[TiDOMEntityProxy alloc] _initWithPageContext:context] autorelease];
    [proxy setNode:child];
    [TiDOMNodeProxy setNode:proxy forXMLNode:childXmlNode];
    return proxy;
  }
  case XML_NOTATION_NODE: {
    TiDOMNotationProxy *proxy = [[[TiDOMNotationProxy alloc] _initWithPageContext:context] autorelease];
    [proxy setNode:child];
    [TiDOMNodeProxy setNode:proxy forXMLNode:childXmlNode];
    return proxy;
  }
  default: {
    TiDOMNodeProxy *element = [[[TiDOMNodeProxy alloc] _initWithPageContext:context] autorelease];
    [element setNode:child];
    [TiDOMNodeProxy setNode:element forXMLNode:childXmlNode];
    return element;
  }
  }
}

#pragma mark Public APIs

- (id)nodeName
{
  xmlNodePtr realNode = [node XMLNode];
  if (realNode == NULL) {
    return [NSNull null];
  }
  xmlElementType realNodeType = realNode->type;

  switch (realNodeType) {
  case XML_TEXT_NODE:
    return @"#text";
  case XML_COMMENT_NODE:
    return @"#comment";
  case XML_CDATA_SECTION_NODE:
    return @"#cdata-section";
  case XML_DOCUMENT_NODE:
    return @"#document";
  case XML_DOCUMENT_FRAG_NODE:
    return @"#document-fragment";
  default:
    return [node name];
  }
}

- (id)nodeValue
{
  return [node stringValue];
}

- (void)setNodeValue:(NSString *)data
{
  [self throwException:[NSString stringWithFormat:@"Setting NodeValue not supported for %d type of Node", [[self nodeType] intValue]] subreason:nil location:CODELOCATION];
}

- (id)textContent
{
  return [node stringValue];
}

- (id)text
{
  return [node stringValue];
}

- (id)parentNode
{
  xmlNodePtr p = [node XMLNode]->parent;
  if (p == NULL)
    return [NSNull null];

  GDataXMLNode *sibling = [GDataXMLNode nodeBorrowingXMLNode:p];
  id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
  return [self makeNode:sibling context:context];
}

- (id)childNodes
{
  [node releaseCachedValues];
  id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
  return [self makeNodeListProxyFromArray:[node children] context:context];
}

- (id)firstChild
{
  [node releaseCachedValues];
  NSUInteger count = [node childCount];
  if (count == 0)
    return [NSNull null];
  id child = [node childAtIndex:0];
  id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
  return [self makeNode:child context:context];
}

- (id)lastChild
{
  [node releaseCachedValues];
  NSUInteger count = [node childCount];
  if (count == 0)
    return [NSNull null];
  id child = [node childAtIndex:count - 1];
  id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
  return [self makeNode:child context:context];
}

- (id)previousSibling
{
  xmlNodePtr p = [node XMLNode]->prev;
  if (p == NULL) {
    return [NSNull null];
  }
  id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
  GDataXMLNode *sibling = [GDataXMLNode nodeBorrowingXMLNode:p];
  return [self makeNode:sibling context:context];
}

- (id)nextSibling
{
  xmlNodePtr p = [node XMLNode]->next;
  if (p == NULL) {
    return [NSNull null];
  }
  id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
  GDataXMLNode *sibling = [GDataXMLNode nodeBorrowingXMLNode:p];
  return [self makeNode:sibling context:context];
}

- (id)attributes
{
  return [NSNull null];
}

- (id)ownerDocument
{
  xmlDocPtr p = [node XMLNode]->doc;
  if (p == NULL) {
    if ([self document] != nil) {
      p = [[self document] docNode];
    }
    if (p == NULL) {
      VerboseLog(@"[DEBUG]ownerDocument property is NULL for node %@", [self class]);
      return [NSNull null];
    }
  }
  TiDOMDocumentProxy *proxy = [TiDOMNodeProxy nodeForXMLNode:(xmlNodePtr)p];
  if (proxy == nil) {
    id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
    proxy = [[[TiDOMDocumentProxy alloc] _initWithPageContext:context] autorelease];
    [proxy setDocument:[self document]];
    [proxy setNode:[[self document] rootElement]];
    [TiDOMNodeProxy setNode:proxy forXMLNode:(xmlNodePtr)p];
  }
  return proxy;
}

- (id)insertBefore:(id)args
{
  [self throwException:@"mutation not supported" subreason:nil location:CODELOCATION];
}

- (id)replaceChild:(id)args
{
  [self throwException:@"mutation not supported" subreason:nil location:CODELOCATION];
}

- (id)removeChild:(id)args
{
  [self throwException:@"mutation not supported" subreason:nil location:CODELOCATION];
}

- (id)appendChild:(id)args
{
  [self throwException:@"mutation not supported" subreason:nil location:CODELOCATION];
}

- (id)hasChildNodes:(id)args
{
  return NUMBOOL([node childCount] > 0);
}

- (void)normalize:(id)args
{
  //TODO
}

- (id)isSupported:(id)args
{
  ENSURE_ARG_COUNT(args, 2);

  NSString *feature = [args objectAtIndex:0];
  ENSURE_STRING_OR_NIL(feature);

  NSString *version = [args objectAtIndex:1];
  ENSURE_STRING_OR_NIL(version);

  if (feature != nil) {
    if ((version == nil) || ([[version lowercaseString] compare:@"1.0"] == 0) || ([[version lowercaseString] compare:@"2.0"] == 0)) {
      if ([[feature lowercaseString] compare:@"core"] == 0)
        return NUMBOOL(YES);
      else if ([[feature lowercaseString] compare:@"xml"] == 0)
        return NUMBOOL(YES);
      else
        return NUMBOOL(NO);
    }
  }

  return NUMBOOL(NO);
}

- (id)namespaceURI
{
  NSString *result = [node URI];
  if (result == nil)
    return [NSNull null];
  return result;
}

- (id)prefix
{
  NSString *result = [node prefix];
  if ([result length] == 0)
    return [NSNull null];
  return result;
}

- (id)localName
{
  if (node != nil) {
    xmlNodePtr theRealNode = [node XMLNode];
    if (theRealNode != nil) {
      xmlElementType nodeType = theRealNode->type;
      if (nodeType == XML_ELEMENT_NODE || nodeType == XML_ATTRIBUTE_NODE) {
        if (theRealNode->ns != nil) {
          return [GDataXMLNode localNameForName:[node name]];
        }
      }
    }
  }
  return [NSNull null];
}

- (id)hasAttributes:(id)args
{
  if ([node kind] == GDataXMLElementKind) {
    GDataXMLElement *element = (GDataXMLElement *)node;
    if ([element attributes] != nil) {
      return NUMBOOL([[element attributes] count] > 0);
    }
  }
  return NUMBOOL(NO);
}

- (id)nodeType
{
  xmlNodePtr realNode = [node XMLNode];
  if (realNode == NULL) {
    return NUMINT(0);
  }
  xmlElementType realNodeType = realNode->type;
  if (realNodeType == XML_DTD_NODE)
    realNodeType = XML_DOCUMENT_TYPE_NODE;
  return NUMINT(realNodeType);
}

- (id)cloneNode:(id)args
{
  int recursive;
  ENSURE_SINGLE_ARG(args, NSNumber);

  BOOL deep = [TiUtils boolValue:args];

  if (deep)
    recursive = 1;
  else
    recursive = 2;

  xmlNodePtr ourRealNode = [node XMLNode];
  xmlNodePtr ret = xmlCopyNode(ourRealNode, recursive);

  if (ret == nil)
    return [NSNull null];
  else {
    GDataXMLNode *resultElement = [GDataXMLNode nodeBorrowingXMLNode:ret];
    id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
    return [self makeNode:resultElement context:context];
  }
}

MAKE_SYSTEM_PROP(ELEMENT_NODE, XML_ELEMENT_NODE);
MAKE_SYSTEM_PROP(ATTRIBUTE_NODE, XML_ATTRIBUTE_NODE);
MAKE_SYSTEM_PROP(TEXT_NODE, XML_TEXT_NODE);
MAKE_SYSTEM_PROP(CDATA_SECTION_NODE, XML_CDATA_SECTION_NODE);
MAKE_SYSTEM_PROP(ENTITY_REFERENCE_NODE, XML_ENTITY_REF_NODE);
MAKE_SYSTEM_PROP(ENTITY_NODE, XML_ENTITY_NODE);
MAKE_SYSTEM_PROP(PROCESSING_INSTRUCTION_NODE, XML_PI_NODE);
MAKE_SYSTEM_PROP(COMMENT_NODE, XML_COMMENT_NODE);
MAKE_SYSTEM_PROP(DOCUMENT_NODE, XML_DOCUMENT_NODE);
MAKE_SYSTEM_PROP(DOCUMENT_TYPE_NODE, XML_DOCUMENT_TYPE_NODE);
MAKE_SYSTEM_PROP(DOCUMENT_FRAGMENT_NODE, XML_DOCUMENT_FRAG_NODE);
MAKE_SYSTEM_PROP(NOTATION_NODE, XML_NOTATION_NODE);

@end

#endif
