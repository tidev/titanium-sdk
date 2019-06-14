/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TIDOMDOMImplementationProxy.h"
#import "TIDOMDocumentTypeProxy.h"
#import "TiDOMDocumentProxy.h"
#import "TiDOMValidator.h"
#import <TitaniumKit/TiUtils.h>

@implementation TIDOMDOMImplementation

- (NSString *)apiName
{
  return @"Ti.XML.DOMImplementation";
}

- (id)hasFeature:(id)args
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

- (id)createDocumentType:(id)args
{
  ENSURE_ARG_COUNT(args, 3);
  NSString *qualifiedName = nil;
  NSString *publicId = nil;
  NSString *systemId = nil;

  ENSURE_ARG_OR_NIL_AT_INDEX(qualifiedName, args, 0, NSString);
  ENSURE_ARG_OR_NIL_AT_INDEX(publicId, args, 1, NSString);
  ENSURE_ARG_OR_NIL_AT_INDEX(systemId, args, 2, NSString);

  GDataXMLNode *resultElement = [GDataXMLNode dtdWithQualifiedName:qualifiedName publicId:publicId sysId:systemId];

  id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
  TIDOMDocumentTypeProxy *result = [[[TIDOMDocumentTypeProxy alloc] _initWithPageContext:context] autorelease];
  [result setNode:resultElement];
  [result setDocument:nil];
  [TiDOMNodeProxy setNode:result forXMLNode:[resultElement XMLNode]];
  return result;
}

- (id)createDocument:(id)args
{
  ENSURE_ARG_COUNT(args, 3);
  NSString *theURI = [args objectAtIndex:0];
  NSString *qualifiedName = [args objectAtIndex:1];
  TIDOMDocumentTypeProxy *docType = [args objectAtIndex:2];

  ENSURE_STRING_OR_NIL(theURI);
  ENSURE_STRING(qualifiedName);
  ENSURE_TYPE_OR_NIL(docType, TIDOMDocumentTypeProxy);

  //Validate the parameters
  NSString *error = nil;
  NSString *suberror = nil;

  [TiDOMNodeProxy validateElementParameters:qualifiedName withUri:theURI reason:&error subreason:&suberror];

  if (error != nil) {
    [self throwException:error subreason:suberror location:CODELOCATION];
  }

  NSString *prefix = [GDataXMLNode prefixForName:qualifiedName];
  NSString *localName = [GDataXMLNode localNameForName:qualifiedName];

  //Create the new NS pointer
  xmlChar *pre = NULL;
  xmlChar *href = NULL;
  if (theURI != nil) {
    href = (xmlChar *)[theURI UTF8String];
  }
  if ([prefix length] > 0) {
    pre = (xmlChar *)[prefix UTF8String];
  }
  xmlNsPtr theNewNs = xmlNewNs(NULL, // parent node
      href, pre);

  //Create the doc node with root element
  xmlNodePtr rootPtr = xmlNewNode(theNewNs, (xmlChar *)[localName UTF8String]);
  rootPtr->nsDef = theNewNs;
  xmlDocPtr doc = xmlNewDoc(NULL);
  xmlDocSetRootElement(doc, rootPtr);

  if (docType != nil) {
    GDataXMLNode *docTypeNode = [docType node];
    xmlNodePtr ret = xmlAddChild((xmlNodePtr)doc, [docTypeNode XMLNode]);
    if (ret != NULL) {
      //Now it is part of the tree so switch flag to ensur it gets freed when doc is released
      [docTypeNode setShouldFreeXMLNode:NO];
    }
  }

  GDataXMLDocument *theDocument = [[[GDataXMLDocument alloc] initWithDocument:doc] autorelease];
  id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
  TiDOMDocumentProxy *result = [[[TiDOMDocumentProxy alloc] _initWithPageContext:context] autorelease];
  [result setNode:[theDocument rootElement]];
  [result setDocument:theDocument];
  [TiDOMNodeProxy setNode:result forXMLNode:(xmlNodePtr)doc];
  return result;
}

@end

#endif
