/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TiDOMDocumentProxy.h"
#import "TIDOMDOMImplementationProxy.h"
#import "TIDOMDocumentTypeProxy.h"
#import "TiDOMAttrProxy.h"
#import "TiDOMCDATANodeProxy.h"
#import "TiDOMCommentProxy.h"
#import "TiDOMDocFragProxy.h"
#import "TiDOMElementProxy.h"
#import "TiDOMEntityRefProxy.h"
#import "TiDOMNodeListProxy.h"
#import "TiDOMNodeProxy.h"
#import "TiDOMPIProxy.h"
#import "TiDOMTextNodeProxy.h"
#import "TiDOMValidator.h"
#import <TitaniumKit/TiUtils.h>

@implementation TiDOMDocumentProxy

#pragma mark internal

- (void)dealloc
{
  if ([document docNode] != NULL) {
    //Ensure that docNode is removed from nodeRegistry
    [TiDOMNodeProxy removeNodeForXMLNode:(xmlNodePtr)[document docNode]];
  }
  [super dealloc];
}

- (BOOL)equals:(id)value
{
  if ([value isKindOfClass:[TiDOMDocumentProxy class]]) {
    return [value isEqual:self];
  }
  return NO;
}

- (NSString *)apiName
{
  return @"Ti.XML.Document";
}

- (void)parseString:(NSString *)xml
{
  NSError *error = nil;
  GDataXMLDocument *ourDocument = [[[GDataXMLDocument alloc] initWithXMLString:xml options:0 error:&error] autorelease];
  if (error != nil) {
    [self throwException:[error description] subreason:nil location:CODELOCATION];
  }
  [self setNode:[ourDocument rootElement]];
  [self setDocument:ourDocument];
  xmlDocPtr docPtr = [ourDocument docNode];
  [TiDOMNodeProxy setNode:self forXMLNode:(xmlNodePtr)docPtr];
}

#pragma mark Public APIs

- (id)nodeValue
{
  // DOM spec says nodeValue for document must return null
  return [NSNull null];
}

- (id)createAttribute:(id)args
{
  ENSURE_ARG_COUNT(args, 1);
  NSString *tagName = nil;
  ENSURE_ARG_AT_INDEX(tagName, args, 0, NSString);
  //Check name validity
  if (![TiDOMValidator checkAttributeName:tagName]) {
    [self throwException:@"Invalid attribute name" subreason:[NSString stringWithFormat:@"Offending tagName %@", tagName] location:CODELOCATION];
    return [NSNull null];
  }

  id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];

  TiDOMAttrProxy *result = [[[TiDOMAttrProxy alloc] _initWithPageContext:context] autorelease];
  GDataXMLNode *resultNode = (GDataXMLNode *)[GDataXMLElement attributeWithName:tagName stringValue:@""];
  [result setDocument:[self document]];
  [result setNode:resultNode];
  [result setAttribute:tagName value:@"" owner:nil];
  [result setIsSpecified:NO];
  [TiDOMNodeProxy setNode:result forXMLNode:[resultNode XMLNode]];
  return result;
}

- (id)createAttributeNS:(id)args
{
  ENSURE_ARG_COUNT(args, 2);
  NSString *theURI = [args objectAtIndex:0];
  NSString *tagName = [args objectAtIndex:1];

  ENSURE_STRING_OR_NIL(theURI);
  ENSURE_STRING(tagName);

  NSString *prefix = [GDataXMLNode prefixForName:tagName];

  if (prefix == nil && theURI == nil) {
    return [self createAttribute:[NSArray arrayWithObject:tagName]];
  }

  NSString *error = nil;
  NSString *suberror = nil;

  [TiDOMNodeProxy validateAttributeParameters:tagName withUri:theURI reason:&error subreason:&suberror];
  if (error != nil) {
    [self throwException:error subreason:suberror location:CODELOCATION];
  }

  //THIS WILL NOT WORK UNTIL ADD CHILD IS CALLED SO CREATE A NAMESPACE POINTER AND SET IT EXPLICITLY
  //GDataXMLNode* resultNode = (GDataXMLNode*)[GDataXMLElement attributeWithName:tagName URI:theURI stringValue:@""];
  NSString *localName = [GDataXMLNode localNameForName:tagName];

  id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];

  TiDOMAttrProxy *result = [[[TiDOMAttrProxy alloc] _initWithPageContext:context] autorelease];
  GDataXMLNode *resultNode = (GDataXMLNode *)[GDataXMLElement attributeWithName:localName stringValue:@""];
  xmlChar *href;
  xmlChar *pre;

  if (theURI != nil)
    href = (xmlChar *)[theURI UTF8String];
  else
    href = NULL;

  if ([prefix length] > 0) {
    pre = (xmlChar *)[prefix UTF8String];
  } else {
    // default namespace is represented by a nil prefix
    pre = NULL;
  }

  xmlNsPtr theNewNs = xmlNewNs(NULL, // parent node
      href, pre);
  [resultNode XMLNode]->ns = theNewNs;
  [result setDocument:[self document]];
  [result setNode:resultNode];
  [result setAttribute:tagName value:@"" owner:nil];
  [result setIsSpecified:NO];
  [TiDOMNodeProxy setNode:result forXMLNode:[resultNode XMLNode]];
  return result;
}

- (TiDOMCDATANodeProxy *)createCDATASection:(id)args
{
  ENSURE_ARG_COUNT(args, 1);
  NSString *textData = nil;
  ENSURE_ARG_AT_INDEX(textData, args, 0, NSString);
  id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
  TiDOMCDATANodeProxy *result = [[[TiDOMCDATANodeProxy alloc] _initWithPageContext:context] autorelease];
  GDataXMLNode *resultElement = [GDataXMLNode cDataSectionWithStringValue:textData];
  [result setDocument:[self document]];
  [result setNode:resultElement];
  [TiDOMNodeProxy setNode:result forXMLNode:[resultElement XMLNode]];
  return result;
}
- (TiDOMCommentProxy *)createComment:(id)args
{
  ENSURE_ARG_COUNT(args, 1);
  NSString *textData = nil;
  ENSURE_ARG_AT_INDEX(textData, args, 0, NSString);
  id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
  TiDOMCommentProxy *result = [[[TiDOMCommentProxy alloc] _initWithPageContext:context] autorelease];
  GDataXMLNode *resultElement = [GDataXMLNode commentWithStringValue:textData];
  [result setDocument:[self document]];
  [result setNode:resultElement];
  [TiDOMNodeProxy setNode:result forXMLNode:[resultElement XMLNode]];
  return result;
}

- (TiDOMDocFragProxy *)createDocumentFragment:(id)args
{
  id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];

  TiDOMDocFragProxy *result = [[[TiDOMDocFragProxy alloc] _initWithPageContext:context] autorelease];
  GDataXMLNode *resultElement = [GDataXMLNode createNewDocFragment];
  [result setDocument:[self document]];
  [result setNode:resultElement];
  [TiDOMNodeProxy setNode:result forXMLNode:[resultElement XMLNode]];
  return result;
}

- (id)createElement:(id)args
{
  ENSURE_ARG_COUNT(args, 1);
  NSString *tagName = nil;
  ENSURE_ARG_AT_INDEX(tagName, args, 0, NSString);

  if (![TiDOMValidator checkElementName:tagName]) {
    [self throwException:@"Invalid element name" subreason:[NSString stringWithFormat:@"Offending tagName %@", tagName] location:CODELOCATION];
    return [NSNull null];
  }
  id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
  TiDOMElementProxy *result = [[[TiDOMElementProxy alloc] _initWithPageContext:context] autorelease];
  GDataXMLElement *resultElement = [GDataXMLElement elementWithName:tagName];
  [result setDocument:[self document]];
  [result setElement:resultElement];
  [TiDOMNodeProxy setNode:result forXMLNode:[resultElement XMLNode]];
  return result;
}

- (id)createElementNS:(id)args
{
  ENSURE_ARG_COUNT(args, 2);

  NSString *theURI = [args objectAtIndex:0];
  NSString *tagName = [args objectAtIndex:1];

  ENSURE_STRING_OR_NIL(theURI);
  ENSURE_STRING(tagName);

  NSString *prefix = [GDataXMLNode prefixForName:tagName];

  if (prefix == nil && theURI == nil) {
    return [self createElement:[NSArray arrayWithObject:tagName]];
  }

  NSString *error = nil;
  NSString *suberror = nil;
  [TiDOMNodeProxy validateElementParameters:tagName withUri:theURI reason:&error subreason:&suberror];
  if (error != nil) {
    [self throwException:error subreason:suberror location:CODELOCATION];
  }

  //THIS WILL NOT WORK UNTIL ADD CHILD IS CALLED SO CREATE A NAMESPACE POINTER AND SET IT EXPLICITLY
  //GDataXMLElement * resultElement = [GDataXMLElement elementWithName:tagName URI:theURI];
  NSString *localName = [GDataXMLNode localNameForName:tagName];

  id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
  TiDOMElementProxy *result = [[[TiDOMElementProxy alloc] _initWithPageContext:context] autorelease];
  GDataXMLElement *resultElement = [GDataXMLElement elementWithName:localName];
  xmlChar *href;
  xmlChar *pre;

  if (theURI != nil)
    href = (xmlChar *)[theURI UTF8String];
  else
    href = NULL;

  if ([prefix length] > 0) {
    pre = (xmlChar *)[prefix UTF8String];
  } else {
    // default namespace is represented by a nil prefix
    pre = NULL;
  }

  xmlNsPtr theNewNs = xmlNewNs(NULL, // parent node
      href, pre);
  [resultElement XMLNode]->ns = theNewNs;
  //Assume that this NS is defined on this node. Will be fixed later when added to tree
  [resultElement XMLNode]->nsDef = theNewNs;
  [result setDocument:[self document]];
  [result setElement:resultElement];
  [TiDOMNodeProxy setNode:result forXMLNode:[resultElement XMLNode]];
  return result;
}

- (TiDOMEntityRefProxy *)createEntityReference:(id)args
{
  ENSURE_ARG_COUNT(args, 1);
  NSString *tagName = nil;
  ENSURE_ARG_AT_INDEX(tagName, args, 0, NSString);

  id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
  TiDOMEntityRefProxy *result = [[[TiDOMEntityRefProxy alloc] _initWithPageContext:context] autorelease];
  GDataXMLNode *resultElement = [[self document] entityRefForName:tagName];
  [result setNode:resultElement];
  [result setDocument:[self document]];
  [TiDOMNodeProxy setNode:result forXMLNode:[resultElement XMLNode]];
  return result;
}

- (TiDOMPIProxy *)createProcessingInstruction:(id)args
{
  ENSURE_ARG_COUNT(args, 2);
  NSString *theTarget = nil;
  NSString *theData = nil;
  ENSURE_ARG_AT_INDEX(theTarget, args, 0, NSString);
  ENSURE_ARG_AT_INDEX(theData, args, 1, NSString);
  id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
  TiDOMPIProxy *result = [[[TiDOMPIProxy alloc] _initWithPageContext:context] autorelease];
  GDataXMLNode *resultElement = [GDataXMLNode processingInstructionWithTarget:theTarget andData:theData];
  [result setDocument:[self document]];
  [result setNode:resultElement];
  [TiDOMNodeProxy setNode:result forXMLNode:[resultElement XMLNode]];
  return result;
}

- (TiDOMTextNodeProxy *)createTextNode:(id)args
{
  ENSURE_ARG_COUNT(args, 1);
  NSString *textData = nil;
  ENSURE_ARG_AT_INDEX(textData, args, 0, NSString);
  id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
  TiDOMTextNodeProxy *result = [[[TiDOMTextNodeProxy alloc] _initWithPageContext:context] autorelease];
  GDataXMLNode *resultElement = [GDataXMLNode textWithStringValue:textData];
  [result setDocument:[self document]];
  [result setNode:resultElement];
  [TiDOMNodeProxy setNode:result forXMLNode:[resultElement XMLNode]];
  return result;
}

- (id)documentElement
{
  GDataXMLElement *root = [[self document] rootElement];
  id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
  return [self makeNode:root context:context];
}

- (id)doctype
{
  xmlDtdPtr resultPtr = [[self document] intDTD];

  if (resultPtr != nil) {
    id result = [TiDOMNodeProxy nodeForXMLNode:(xmlNodePtr)resultPtr];
    if (result != nil) {
      return result;
    }
    id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
    TIDOMDocumentTypeProxy *proxy = [[[TIDOMDocumentTypeProxy alloc] _initWithPageContext:context] autorelease];
    [proxy setDocument:[self document]];
    [proxy setNode:[GDataXMLNode nodeBorrowingXMLNode:(xmlNodePtr)resultPtr]];
    [TiDOMNodeProxy setNode:proxy forXMLNode:(xmlNodePtr)resultPtr];
    return proxy;
  }
  return [NSNull null];
}

- (id)implementation
{
  id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
  TIDOMDOMImplementation *result = [[[TIDOMDOMImplementation alloc] _initWithPageContext:context] autorelease];
  return result;
}

- (id)getElementById:(id)args
{
  ENSURE_SINGLE_ARG(args, NSString);
  NSError *error = nil;
  NSArray *nodes = [[self document] nodesForXPath:[NSString stringWithFormat:@"//*[@id='%@']", args] error:&error];
  if (error == nil && nodes != nil && [nodes count] > 0) {
    id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
    return [self makeNode:[nodes objectAtIndex:0] context:context];
  }
  return [NSNull null];
}

- (id)getElementsByTagName:(id)args
{
  ENSURE_SINGLE_ARG(args, NSString);
  NSError *error = nil;
  NSString *xpath = [NSString stringWithFormat:@"//*[local-name()='%@']", args];
  // see if it's a namespace
  NSRange range = [args rangeOfString:@":"];
  if (range.location != NSNotFound) {
    xpath = [NSString stringWithFormat:@"//*[name()='%@']", args];
  }
  NSArray *nodes = [document nodesForXPath:xpath error:&error];
  if (error == nil) {
    id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
    return [self makeNodeListProxyFromArray:nodes context:context];
  }
  if (error != nil) {
    [self throwException:[error description] subreason:nil location:CODELOCATION];
  }
  return [NSNull null];
}

- (id)getElementsByTagNameNS:(id)args
{
  ENSURE_ARG_COUNT(args, 2);
  NSString *theURI = [args objectAtIndex:0];
  NSString *localName = [args objectAtIndex:1];
  ENSURE_STRING_OR_NIL(theURI);
  ENSURE_STRING(localName);

  if (theURI == nil) {
    return [self getElementsByTagName:localName];
  }

  NSError *error = nil;
  //PARAMETER IS SPECIFIED AS LOCAL NAME
  NSString *xpath = [NSString stringWithFormat:@"//*[local-name()='%@' and namespace-uri()='%@']", localName, theURI];

  NSArray *nodes = [document nodesForXPath:xpath error:&error];
  if (error == nil) {
    id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
    return [self makeNodeListProxyFromArray:nodes context:context];
  } else {
    [self throwException:[error description] subreason:nil location:CODELOCATION];
    return nil;
  }
}

- (id)importNode:(id)args
{
  ENSURE_ARG_COUNT(args, 2);
  TiDOMNodeProxy *theNodeToImport = nil;
  NSNumber *recursive = nil;
  ENSURE_ARG_AT_INDEX(theNodeToImport, args, 0, TiDOMNodeProxy);
  ENSURE_ARG_AT_INDEX(recursive, args, 1, NSNumber);

  BOOL deep = [TiUtils boolValue:recursive];

  if (theNodeToImport != nil) {
    xmlElementType type = [[theNodeToImport node] XMLNode]->type;
    if ((type == XML_DOCUMENT_NODE) || (type == XML_DOCUMENT_TYPE_NODE)) {
      [self throwException:@"document/documenttype nodes can not be imported" subreason:nil location:CODELOCATION];
      return nil;
    }
    GDataXMLNode *resultElemet = [[self document] importNode:[theNodeToImport node] recursive:deep];
    id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
    return [self makeNode:resultElemet context:context];
  }
  return nil;
}

- (id)evaluate:(id)args
{
  ENSURE_SINGLE_ARG(args, NSString);
  NSError *error = nil;
  NSArray *nodes = [[self document] nodesForXPath:args error:&error];
  if (error == nil) {
    id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
    return [self makeNodeListProxyFromArray:nodes context:context];
  }
  return [NSNull null];
}

@end

#endif
