/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TiDOMElementProxy.h"
#import "TiDOMAttrProxy.h"
#import "TiDOMNamedNodeMapProxy.h"
#import "TiDOMNodeListProxy.h"
#import "TiDOMNodeProxy.h"
#import "TiDOMValidator.h"
#import <TitaniumKit/TiUtils.h>

@implementation TiDOMElementProxy

- (void)dealloc
{
  RELEASE_TO_NIL(element);
  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.XML.Element";
}

- (void)setElement:(GDataXMLElement *)element_
{
  RELEASE_TO_NIL(element);
  element = [element_ retain];
  [self setNode:element];
}

- (id)nodeValue
{
  // DOM spec says nodeValue for element must return null
  return [NSNull null];
}

- (id)tagName
{
  return [element name];
}

- (id)evaluate:(id)args
{
  ENSURE_SINGLE_ARG(args, NSString);
  NSError *error = nil;
  NSArray *nodes = [node nodesForXPath:args error:&error];
  if (error == nil) {
    id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
    return [self makeNodeListProxyFromArray:nodes context:context];
  }
  return [NSNull null];
}

- (id)getElementsByTagName:(id)args
{
  ENSURE_SINGLE_ARG(args, NSString);
  NSError *error = nil;
  NSString *xpath = [NSString stringWithFormat:@"self::node()/descendant::*[local-name()='%@']", args];
  // see if it's a namespace
  NSRange range = [args rangeOfString:@":"];
  if (range.location != NSNotFound) {
    xpath = [NSString stringWithFormat:@"self::node()/descendant::*[name()='%@']", args];
  }
  NSArray *nodes = [element nodesForXPath:xpath error:&error];
  if (error == nil) {
    id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
    return [self makeNodeListProxyFromArray:nodes context:context];
  } else {
    [self throwException:[error description] subreason:nil location:CODELOCATION];
    return nil;
  }
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
  NSString *xpath = [NSString stringWithFormat:@"self::node()/descendant::*[local-name()='%@' and namespace-uri()='%@']", localName, theURI];

  NSArray *nodes = [element nodesForXPath:xpath error:&error];
  if (error == nil) {
    id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
    return [self makeNodeListProxyFromArray:nodes context:context];
  } else {
    [self throwException:[error description] subreason:nil location:CODELOCATION];
    return nil;
  }
}

- (id)getAttribute:(id)args
{
  ENSURE_SINGLE_ARG(args, NSString);
  GDataXMLNode *_node = [element attributeForName:args];
  if (_node != nil) {
    return [_node stringValue];
  }
  return @"";
}

- (id)getAttributeNS:(id)args
{
  ENSURE_ARG_COUNT(args, 2);
  NSString *theURI = [args objectAtIndex:0];
  NSString *localName = [args objectAtIndex:1];

  ENSURE_STRING_OR_NIL(theURI);
  ENSURE_STRING(localName);

  if (theURI == nil) {
    return [self getAttribute:localName];
  }

  GDataXMLNode *_node = [element attributeForLocalName:localName URI:theURI];
  if (_node != nil) {
    return [_node stringValue];
  }
  return @"";
}

- (void)setAttribute:(id)args
{
  ENSURE_ARG_COUNT(args, 2);

  NSString *name = nil;
  NSString *val = nil;

  ENSURE_ARG_AT_INDEX(name, args, 0, NSString);
  ENSURE_ARG_OR_NIL_AT_INDEX(val, args, 1, NSString);

  if (val == nil) {
    val = @"";
  }

  if (![TiDOMValidator checkAttributeName:name]) {
    [self throwException:@"Invalid attribute name" subreason:[NSString stringWithFormat:@"Offending tagName %@", name] location:CODELOCATION];
    return;
  }
  GDataXMLNode *attributeNode = [element attributeForName:name];
  if (attributeNode != nil) {
    xmlNodePtr oldNodePtr = [attributeNode XMLNode];
    TiDOMAttrProxy *result = [TiDOMNodeProxy nodeForXMLNode:oldNodePtr];
    if (result != nil) {
      [result setValue:val];
    } else {
      [attributeNode setStringValue:val];
    }
  } else {
    GDataXMLNode *resultNode = (GDataXMLNode *)[GDataXMLElement attributeWithName:name stringValue:val];
    [element addAttribute:resultNode];
  }
}

- (void)setAttributeNS:(id)args
{
  ENSURE_ARG_COUNT(args, 3);
  NSString *theURI = [args objectAtIndex:0];
  NSString *name = [args objectAtIndex:1];
  NSString *val = [args objectAtIndex:2];

  ENSURE_STRING_OR_NIL(theURI);
  ENSURE_STRING(name);
  ENSURE_STRING_OR_NIL(val);

  NSString *prefix = [GDataXMLNode prefixForName:name];

  if (theURI == nil && prefix == nil) {
    return [self setAttribute:[NSArray arrayWithObjects:name, val, nil]];
  }

  NSString *error = nil;
  NSString *suberror = nil;

  [TiDOMNodeProxy validateAttributeParameters:name withUri:theURI reason:&error subreason:&suberror];
  if (error != nil) {
    [self throwException:error subreason:suberror location:CODELOCATION];
  }

  NSString *localName = [GDataXMLNode localNameForName:name];

  if (val == nil) {
    val = @"";
  }

  GDataXMLNode *attributeNode = [element attributeForLocalName:[GDataXMLNode localNameForName:name] URI:theURI];
  if (attributeNode != nil) {
    xmlNodePtr oldNodePtr = [attributeNode XMLNode];
    TiDOMAttrProxy *result = [TiDOMNodeProxy nodeForXMLNode:oldNodePtr];
    if (result != nil) {
      [result setValue:val];
    } else {
      [attributeNode setStringValue:val];
    }
  } else {
    [element releaseCachedValues];
    xmlNodePtr curNode = [element XMLNode];

    xmlChar *href;
    xmlChar *pre;

    if (theURI != nil) {
      href = (xmlChar *)[theURI UTF8String];
    } else {
      href = NULL;
    }

    if ([prefix length] > 0) {
      pre = (xmlChar *)[prefix UTF8String];
    } else {
      // default namespace is represented by a nil prefix
      pre = NULL;
    }

    xmlNsPtr theNewNs = xmlNewNs(NULL, // parent node
        href, pre);
    xmlNewNsProp(curNode, theNewNs, (xmlChar *)[localName UTF8String], (xmlChar *)[val UTF8String]);
    [GDataXMLElement fixUpNamespacesForNode:curNode graftingToTreeNode:curNode];
  }
}

- (void)removeAttribute:(id)args
{
  ENSURE_SINGLE_ARG(args, NSString);

  GDataXMLNode *attributeNode = [element attributeForName:args];
  if (attributeNode != nil) {
    xmlNodePtr oldNodePtr = [attributeNode XMLNode];
    TiDOMAttrProxy *result = [TiDOMNodeProxy nodeForXMLNode:oldNodePtr];

    //Retain it here so that the node does not get freed when cached values are released
    [attributeNode retain];
    //Switch the flag here so that the node is freed only when the object is freed
    [attributeNode setShouldFreeXMLNode:YES];
    [element removeChild:attributeNode];

    if (result != nil) {
      [[result node] setShouldFreeXMLNode:NO];
      [result setNode:attributeNode];
      [result setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
    }

    //Release now and this will free the underlying memory if result is nil
    [attributeNode release];
  }
}

- (void)removeAttributeNS:(id)args
{
  ENSURE_ARG_COUNT(args, 2);

  NSString *theURI = [args objectAtIndex:0];
  ENSURE_STRING_OR_NIL(theURI);

  NSString *name = [args objectAtIndex:1];
  ENSURE_STRING_OR_NIL(name);

  if (theURI == nil) {
    [self removeAttribute:name];
  } else if (name != nil) {
    GDataXMLNode *attributeNode = [element attributeForLocalName:name URI:theURI];
    if (attributeNode != nil) {
      xmlNodePtr oldNodePtr = [attributeNode XMLNode];
      TiDOMAttrProxy *result = [TiDOMNodeProxy nodeForXMLNode:oldNodePtr];

      //Retain it here so that the node does not get freed when cached values are released
      [attributeNode retain];
      //Switch the flag here so that the node is freed only when the object is freed
      [attributeNode setShouldFreeXMLNode:YES];
      [element removeChild:attributeNode];
      if (result != nil) {
        [[result node] setShouldFreeXMLNode:NO];
        [result setNode:attributeNode];
        [result setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
      }
      //Release now and this will free the underlying memory if result is nil
      [attributeNode release];
    }
  }
}

- (id)getAttributeNode:(id)args
{
  ENSURE_SINGLE_ARG(args, NSString);
  GDataXMLNode *attributeNode = [element attributeForName:args];
  if (attributeNode == nil) {
    return [NSNull null];
  }
  xmlNodePtr resultPtr = [attributeNode XMLNode];
  id resultNode = [TiDOMNodeProxy nodeForXMLNode:resultPtr];
  if (resultNode != nil)
    return resultNode;

  NSString *nodeString = [attributeNode stringValue];
  id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
  TiDOMAttrProxy *result = [[[TiDOMAttrProxy alloc] _initWithPageContext:context] autorelease];
  [result setAttribute:[attributeNode name] value:nodeString owner:element];
  [result setNode:attributeNode];
  [result setDocument:[self document]];
  [TiDOMNodeProxy setNode:result forXMLNode:resultPtr];
  return result;
}

- (id)getAttributeNodeNS:(id)args
{
  ENSURE_ARG_COUNT(args, 2);

  NSString *theURI = [args objectAtIndex:0];
  ENSURE_STRING_OR_NIL(theURI);

  NSString *name = [args objectAtIndex:1];
  ENSURE_STRING_OR_NIL(name);

  if (theURI == nil) {
    return [self getAttributeNode:name];
  } else if (name != nil) {
    GDataXMLNode *attributeNode = [element attributeForLocalName:name URI:theURI];
    if (attributeNode != nil) {
      xmlNodePtr resultPtr = [attributeNode XMLNode];
      id resultNode = [TiDOMNodeProxy nodeForXMLNode:resultPtr];
      if (resultNode != nil)
        return resultNode;

      NSString *nodeString = [attributeNode stringValue];
      id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
      TiDOMAttrProxy *result = [[[TiDOMAttrProxy alloc] _initWithPageContext:context] autorelease];
      [result setAttribute:[attributeNode name] value:nodeString owner:element];
      [result setNode:attributeNode];
      [result setDocument:[self document]];
      [TiDOMNodeProxy setNode:result forXMLNode:resultPtr];
      return result;
    }
  }
  return [NSNull null];
}

- (id)setAttributeNode:(id)args
{
  ENSURE_SINGLE_ARG(args, TiDOMAttrProxy);
  TiDOMAttrProxy *attProxy = (TiDOMAttrProxy *)args;

  if ([[attProxy node] URI] != nil) {
    return [self setAttributeNodeNS:args];
  }

  NSString *name = [[attProxy node] name];

  TiDOMAttrProxy *result = nil;
  if (name != nil) {
    xmlNodePtr oldNodePtr = [[attProxy node] XMLNode];

    if (oldNodePtr->parent != NULL) {
      [self throwException:@"Attribute in use" subreason:nil location:CODELOCATION];
      return [NSNull null];
    }

    if ([attProxy document] != [self document]) {
      [self throwException:@"mismatched documents" subreason:nil location:CODELOCATION];
      return [NSNull null];
    }

    GDataXMLNode *attributeNode = [element attributeForName:name];
    if (attributeNode != nil) {
      [attributeNode retain];
      [attributeNode setShouldFreeXMLNode:YES];
      oldNodePtr = [attributeNode XMLNode];
      result = [TiDOMNodeProxy nodeForXMLNode:oldNodePtr];
      //Remove Child Now
      [element removeChild:attributeNode];
      if (result == nil) {
        //Need to return the old attribute node
        id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
        result = [[[TiDOMAttrProxy alloc] _initWithPageContext:context] autorelease];
        [result setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
        [result setNode:attributeNode];
        [result setDocument:[self document]];
      } else {
        [[result node] setShouldFreeXMLNode:NO];
        [result setNode:attributeNode];
        [result setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
      }
      //Release now and this will free the underlying memory when proxy is released
      [attributeNode release];
    }

    oldNodePtr = [[attProxy node] XMLNode];
    if (oldNodePtr != NULL) {
      [TiDOMNodeProxy removeNodeForXMLNode:oldNodePtr];
    }
    //This adds by copying
    [element addAttribute:[attProxy node]];
    attributeNode = [element attributeForName:name];
    [attProxy setNode:attributeNode];
    [attProxy setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
    [TiDOMNodeProxy setNode:attProxy forXMLNode:[attributeNode XMLNode]];
  }

  if (result == nil)
    return [NSNull null];
  return result;
}

- (id)setAttributeNodeNS:(id)args
{
  ENSURE_SINGLE_ARG(args, TiDOMAttrProxy);
  TiDOMAttrProxy *attProxy = (TiDOMAttrProxy *)args;
  NSString *name = [[attProxy node] name];

  NSString *theURI = [[attProxy node] URI];
  TiDOMAttrProxy *result = nil;
  if (name != nil) {
    xmlNodePtr oldNodePtr = [[attProxy node] XMLNode];

    if (oldNodePtr->parent != NULL) {
      [self throwException:@"Attribute in use" subreason:nil location:CODELOCATION];
      return [NSNull null];
    }

    if ([attProxy document] != [self document]) {
      [self throwException:@"mismatched documents" subreason:nil location:CODELOCATION];
      return [NSNull null];
    }

    GDataXMLNode *attributeNode = [element attributeForLocalName:[GDataXMLNode localNameForName:name] URI:theURI];
    if (attributeNode != nil) {
      [attributeNode retain];
      [attributeNode setShouldFreeXMLNode:YES];
      oldNodePtr = [attributeNode XMLNode];
      result = [TiDOMNodeProxy nodeForXMLNode:oldNodePtr];
      //Remove Child Now
      [element removeChild:attributeNode];
      if (result == nil) {
        //Need to return the old attribute node
        id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
        result = [[[TiDOMAttrProxy alloc] _initWithPageContext:context] autorelease];
        [result setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
        [result setNode:attributeNode];
        [result setDocument:[self document]];
      } else {
        [[result node] setShouldFreeXMLNode:NO];
        [result setNode:attributeNode];
        [result setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
      }
      //Release now and this will free the underlying memory when proxy is released
      [attributeNode release];
    }

    oldNodePtr = [[attProxy node] XMLNode];
    if (oldNodePtr != NULL) {
      [TiDOMNodeProxy removeNodeForXMLNode:oldNodePtr];
    }
    //Duplicate methodology in setAttributeNS
    [element releaseCachedValues];
    xmlNodePtr curNode = [element XMLNode];
    xmlNodePtr curAttr = [[attProxy node] XMLNode];
    xmlNsPtr theNewNs = xmlCopyNamespace(curAttr->ns);
    NSString *localName = [GDataXMLNode localNameForName:name];
    NSString *val = [[attProxy node] stringValue];

    xmlNewNsProp(curNode, theNewNs, (xmlChar *)[localName UTF8String], (xmlChar *)[val UTF8String]);
    [GDataXMLElement fixUpNamespacesForNode:curNode graftingToTreeNode:curNode];
    attributeNode = [element attributeForLocalName:localName URI:theURI];
    [attProxy setNode:attributeNode];
    [attProxy setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
    [TiDOMNodeProxy setNode:attProxy forXMLNode:[attributeNode XMLNode]];
  }
  if (result == nil)
    return [NSNull null];
  return result;
}

- (id)removeAttributeNode:(id)args
{
  ENSURE_SINGLE_ARG(args, TiDOMAttrProxy);
  TiDOMAttrProxy *attProxy = (TiDOMAttrProxy *)args;

  xmlNodePtr theNodeToRemove = [[attProxy node] XMLNode];

  NSArray *elemAttributes = [element attributes];
  GDataXMLNode *nodeToRemove = nil;

  if ([elemAttributes count] > 0) {
    for (GDataXMLNode *node_ in elemAttributes) {
      if ([node_ XMLNode] == theNodeToRemove) {
        nodeToRemove = node_;
        break;
      }
    }

    if (nodeToRemove == nil) {
      [self throwException:@"no node found to remove" subreason:nil location:CODELOCATION];
      return nil;
    } else {
      //Switch the flag here so that the node is freed only when the object is freed
      [nodeToRemove retain];
      [nodeToRemove setShouldFreeXMLNode:YES];
      [element removeChild:nodeToRemove];
      [[attProxy node] setShouldFreeXMLNode:NO];
      [attProxy setNode:nodeToRemove];
      return attProxy;
    }
  } else {
    [self throwException:@"no node found to remove" subreason:nil location:CODELOCATION];
    return nil;
  }
}

- (id)insertBefore:(id)args
{
  ENSURE_ARG_COUNT(args, 2);
  TiDOMNodeProxy *newChild = nil;
  TiDOMNodeProxy *refChild = nil;

  ENSURE_ARG_AT_INDEX(newChild, args, 0, TiDOMNodeProxy);
  ENSURE_ARG_AT_INDEX(refChild, args, 1, TiDOMNodeProxy);

  xmlNodePtr refNodePtr = [[refChild node] XMLNode];
  xmlNodePtr newNodePtr = [[newChild node] XMLNode];
  if (newNodePtr == refNodePtr)
    return newChild;

  [[self node] releaseCachedValues];
  NSArray *theChildren = [[self node] children];

  BOOL found = NO;
  for (GDataXMLNode *cur in theChildren) {
    if ([cur XMLNode] == refNodePtr) {
      found = YES;
    }
  }

  if (found) {
    [[self node] releaseCachedValues];
    xmlNodePtr returnNodePtr = xmlAddPrevSibling(refNodePtr, newNodePtr);
    [[newChild node] setShouldFreeXMLNode:NO];
    if (returnNodePtr != nil) {
      if (returnNodePtr == newNodePtr) {
        return newChild;
      } else {
        //This should not happen
        id result = [TiDOMNodeProxy nodeForXMLNode:returnNodePtr];
        if (result == nil) {
          GDataXMLNode *retVal = [GDataXMLNode nodeConsumingXMLNode:returnNodePtr];
          id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
          result = [self makeNode:retVal context:context];
        }
        return result;
      }

    } else {
      //Will get here if there in an internal API error
      return [NSNull null];
    }
  } else {
    [self throwException:@"node is not part of children nodes" subreason:nil location:CODELOCATION];
    return [NSNull null];
  }
}

- (id)replaceChild:(id)args
{
  ENSURE_ARG_COUNT(args, 2);
  TiDOMNodeProxy *newChild = nil;
  TiDOMNodeProxy *refChild = nil;

  ENSURE_ARG_AT_INDEX(newChild, args, 0, TiDOMNodeProxy);
  ENSURE_ARG_AT_INDEX(refChild, args, 1, TiDOMNodeProxy);

  xmlNodePtr refNodePtr = [[refChild node] XMLNode];
  xmlNodePtr newNodePtr = [[newChild node] XMLNode];
  if (newNodePtr == refNodePtr)
    return refChild;

  [[self node] releaseCachedValues];
  NSArray *theChildren = [[self node] children];

  BOOL found = NO;
  for (GDataXMLNode *cur in theChildren) {
    if ([cur XMLNode] == refNodePtr) {
      found = YES;
    }
  }

  if (found) {
    [[self node] releaseCachedValues];
    xmlNodePtr returnNodePtr = xmlReplaceNode(refNodePtr, newNodePtr);
    if (returnNodePtr != nil) {
      [[newChild node] setShouldFreeXMLNode:NO];
      if (returnNodePtr == refNodePtr) {
        [[refChild node] setShouldFreeXMLNode:YES];
        return refChild;
      } else {
        //This should not happen
        id result = [TiDOMNodeProxy nodeForXMLNode:returnNodePtr];
        if (result == nil) {
          GDataXMLNode *retVal = [GDataXMLNode nodeConsumingXMLNode:returnNodePtr];
          id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
          result = [self makeNode:retVal context:context];
        }
        return result;
      }

    } else {
      //Will get here if there in an internal API error
      return [NSNull null];
    }
  } else {
    [self throwException:@"no node found to replace" subreason:nil location:CODELOCATION];
    return [NSNull null];
  }
}

- (id)removeChild:(id)args
{
  ENSURE_SINGLE_ARG(args, TiDOMNodeProxy);
  TiDOMNodeProxy *oldChild = (TiDOMNodeProxy *)args;

  xmlNodePtr refNodePtr = [[oldChild node] XMLNode];

  [[self node] releaseCachedValues];
  NSArray *theChildren = [[self node] children];
  BOOL found = NO;
  for (GDataXMLNode *cur in theChildren) {
    if ([cur XMLNode] == refNodePtr) {
      found = YES;
    }
  }

  if (found) {
    [[oldChild node] setShouldFreeXMLNode:YES];
    [element removeChild:[oldChild node]];
    return oldChild;
  } else {
    [self throwException:@"no node found to remove" subreason:nil location:CODELOCATION];
    return [NSNull null];
  }
}

- (id)appendChild:(id)args
{
  ENSURE_SINGLE_ARG(args, TiDOMNodeProxy);
  TiDOMNodeProxy *newChild = (TiDOMNodeProxy *)args;
  if ([newChild document] != [self document]) {
    [self throwException:@"mismatched documents" subreason:nil location:CODELOCATION];
    return [NSNull null];
  }
  BOOL needsReconciliateNS = [newChild isKindOfClass:[TiDOMElementProxy class]];
  xmlNodePtr oldNodePtr = [[newChild node] XMLNode];
  xmlNodePtr parent = [element XMLNode];
  xmlNodePtr resultPtr = xmlAddChild(parent, oldNodePtr);

  if (resultPtr != NULL) {
    [[self node] releaseCachedValues];
    if (needsReconciliateNS) {
      [GDataXMLElement fixUpNamespacesForNode:resultPtr graftingToTreeNode:parent];
    }
    //Child added successfully
    if (resultPtr == oldNodePtr) {
      //Child pointer not modified
      [[newChild node] setShouldFreeXMLNode:NO];
      return newChild;
    } else {
      //Child pointer modified
      [[newChild node] setShouldFreeXMLNode:YES];
      if (oldNodePtr != NULL) {
        [TiDOMNodeProxy removeNodeForXMLNode:oldNodePtr];
      }
      TiDOMNodeProxy *result = [TiDOMNodeProxy nodeForXMLNode:resultPtr];
      if (result == nil) {
        GDataXMLNode *resultNode = [GDataXMLNode nodeBorrowingXMLNode:resultPtr];
        id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
        result = [self makeNode:resultNode context:context];
      }
      return result;
    }
  } else {
    return [NSNull null];
  }
}

- (id)attributes
{
  id context = ([self executionContext] == nil) ? [self pageContext] : [self executionContext];
  TiDOMNamedNodeMapProxy *proxy = [[[TiDOMNamedNodeMapProxy alloc] _initWithPageContext:context] autorelease];
  [proxy setElement:self];
  return proxy;
}

- (id)hasAttribute:(id)args
{
  ENSURE_SINGLE_ARG(args, NSString);
  GDataXMLNode *_node = [element attributeForName:args];
  return NUMBOOL(_node != nil);
}

- (id)hasAttributeNS:(id)args
{
  ENSURE_ARG_COUNT(args, 2);

  NSString *theURI = [args objectAtIndex:0];
  ENSURE_STRING_OR_NIL(theURI);

  NSString *name = [args objectAtIndex:1];
  ENSURE_STRING_OR_NIL(name);

  if (theURI != nil && name != nil) {
    GDataXMLNode *_node = [element attributeForLocalName:name URI:theURI];
    return NUMBOOL(_node != nil);
  }

  return NUMBOOL(NO);
}

@end

#endif
