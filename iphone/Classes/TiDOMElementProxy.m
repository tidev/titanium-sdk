/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TiDOMElementProxy.h"
#import "TiDOMNodeProxy.h"
#import "TiDOMNodeListProxy.h"
#import "TiDOMAttrProxy.h"
#import "TiDOMNamedNodeMapProxy.h"
#import "TiUtils.h"
#import "TiDOMValidator.h"

@implementation TiDOMElementProxy

-(void)dealloc
{
	RELEASE_TO_NIL(element);
	[super dealloc];
}

-(void)setElement:(GDataXMLElement*)element_
{
	RELEASE_TO_NIL(element);
	element = [element_ retain];
	[self setNode:element];
}

-(id)nodeValue
{
	// DOM spec says nodeValue for element must return null
	return [NSNull null];
}


-(id)tagName
{
	return [element name];
}

-(id)evaluate:(id)args
{
	ENSURE_SINGLE_ARG(args,NSString);
	NSError *error = nil;
	NSArray *nodes = [node nodesForXPath:args error:&error];
	if (error==nil)
	{
		id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
		NSMutableArray *proxyArray = nil;
		if (nodes != nil) {
			proxyArray = [NSMutableArray array];
			for (GDataXMLNode* child in nodes) {
				[proxyArray addObject:[self makeNode:child context:context]];
			}
		}
		
		TiDOMNodeListProxy *proxy = [[[TiDOMNodeListProxy alloc] _initWithPageContext:context] autorelease];
		[proxy setNodes:proxyArray];
		return proxy;
	}
	return [NSNull null];
}

-(id)getElementsByTagName:(id)args
{
	ENSURE_SINGLE_ARG(args,NSString);
	NSError *error = nil;
	NSString *xpath = [NSString stringWithFormat:@"self::node()/descendant::*[local-name()='%@']",args];
	// see if it's a namespace
	NSRange range = [args rangeOfString:@":"];
	if (range.location!=NSNotFound)
	{
		xpath = [NSString stringWithFormat:@"self::node()/descendant::*[name()='%@']",args];
	}
	NSArray *nodes = [element nodesForXPath:xpath error:&error];
	if (error==nil)
	{
		id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
		NSMutableArray *proxyArray = nil;
		if (nodes != nil) {
			proxyArray = [NSMutableArray array];
			for (GDataXMLNode* child in nodes) {
				[proxyArray addObject:[self makeNode:child context:context]];
			}
		}
		TiDOMNodeListProxy *proxy = [[[TiDOMNodeListProxy alloc] _initWithPageContext:context] autorelease];
		[proxy setNodes:proxyArray];
		return proxy;
	}
	else
	{
		[self throwException:[error description] subreason:nil location:CODELOCATION];
        return nil;
	}
	
}

-(id)getElementsByTagNameNS:(id)args
{
    ENSURE_ARG_COUNT(args, 2);
    NSString * theURI;
	NSString * localName;
	ENSURE_ARG_AT_INDEX(theURI, args, 0, NSString);
	ENSURE_ARG_AT_INDEX(localName, args, 1, NSString);
    
	NSError *error = nil;
    //PARAMETER IS SPECIFIED AS LOCAL NAME
    NSString *xpath = [NSString stringWithFormat:@"self::node()/descendant::*[local-name()='%@' and namespace-uri()='%@']",localName, theURI];

    NSArray *nodes = [element nodesForXPath:xpath error:&error];
	if (error==nil)
	{
		id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
		NSMutableArray *proxyArray = nil;
		if (nodes != nil) {
			proxyArray = [NSMutableArray array];
			for (GDataXMLNode* child in nodes) {
				[proxyArray addObject:[self makeNode:child context:context]];
			}
		}
		TiDOMNodeListProxy *proxy = [[[TiDOMNodeListProxy alloc] _initWithPageContext:context] autorelease];
		[proxy setNodes:proxyArray];
		return proxy;
	}
	else
	{
		[self throwException:[error description] subreason:nil location:CODELOCATION];
        return nil;
	}
	
}


-(id)getAttribute:(id)args
{
	ENSURE_SINGLE_ARG(args,NSString);
	GDataXMLNode *_node = [element attributeForName:args];
	if (_node!=nil)
	{
		return [_node stringValue];
	}
	return @"";
}

-(id)getAttributeNS:(id)args
{
	ENSURE_ARG_COUNT(args, 2);
    NSString * theURI;
	NSString * localName;
	ENSURE_ARG_AT_INDEX(theURI, args, 0, NSString);
	ENSURE_ARG_AT_INDEX(localName, args, 1, NSString);
    GDataXMLNode *_node = [element attributeForLocalName:localName URI:theURI];
    if(_node != nil)
    {
        return [_node stringValue];
    }
    return @"";
}

-(void)setAttribute:(id)args
{
	ENSURE_ARG_COUNT(args, 2);

	NSString *name;
	NSString *val;
	
	ENSURE_ARG_AT_INDEX(name, args, 0, NSString);
	ENSURE_ARG_OR_NIL_AT_INDEX(val, args, 1, NSString);

	if (val == nil) {
		val = @"";
	}

	if (![TiDOMValidator checkAttributeName:name]) {
		[self throwException:@"Invalid attribute name" subreason:[NSString stringWithFormat:@"Offending tagName %@",name] location:CODELOCATION];
		return;
	}
	GDataXMLNode * attributeNode = [element attributeForName:name];
	if(attributeNode != nil) {
		xmlNodePtr oldNodePtr = [attributeNode XMLNode];
		TiDOMAttrProxy* result = [TiDOMNodeProxy nodeForXMLNode:oldNodePtr];
		if (result != nil) {
			[result setValue:val];
		}
		else {
			[attributeNode setStringValue:val];
		}
	}
	else {
		GDataXMLNode* resultNode = (GDataXMLNode*)[GDataXMLElement attributeWithName:name stringValue:val];
		[element addAttribute: resultNode];
	}
}

-(void)setAttributeNS:(id)args
{
	ENSURE_ARG_COUNT(args, 3);
	NSString *theURI;
	NSString *name;
	NSString *val;

	ENSURE_ARG_OR_NIL_AT_INDEX(theURI, args, 0, NSString);
	ENSURE_ARG_AT_INDEX(name, args, 1, NSString);
	ENSURE_ARG_OR_NIL_AT_INDEX(val, args, 2, NSString);
	

	NSString* prefix = [GDataXMLNode prefixForName:name];
	NSString* localName = [GDataXMLNode localNameForName:name];
	
	if (![[name lowercaseString] isEqualToString:@"xmlns"]) {
		//Check name validity
		if (![TiDOMValidator checkAttributeName:localName]) {
			[self throwException:@"Invalid attribute name" subreason:[NSString stringWithFormat:@"Offending localName %@",localName] location:CODELOCATION];
			return [NSNull null];
		}
		
		if (prefix != nil && ([theURI length]==0) ) {
			[self throwException:@"Can not have a prefix with a nil or empty URI" subreason:[NSString stringWithFormat:@"%@:%@",prefix,theURI] location:CODELOCATION];
			return [NSNull null];
		}
		
		if ( [prefix isEqualToString:@"xml"] ) {
			if (![theURI isEqualToString:@"http://www.w3.org/XML/1998/namespace"]) {
				[self throwException:@"Invalid URI for prefix" subreason:[NSString stringWithFormat:@"%@:%@",prefix,theURI] location:CODELOCATION];
				return [NSNull null];
			}
		}
		else {
			//Check prefix validity
			if (![TiDOMValidator checkNamespacePrefix:prefix]) {
				[self throwException:@"Invalid prefix" subreason:[NSString stringWithFormat:@"Offending prefix %@",prefix] location:CODELOCATION];
				return [NSNull null];
			}
			//Check URI validity
			if (![TiDOMValidator checkNamespaceURI:theURI]) {
				[self throwException:@"Invalid URI" subreason:[NSString stringWithFormat:@"Offending URI %@",theURI] location:CODELOCATION];
				return [NSNull null];
			}
		}
		
	}
	else {
		if (![theURI isEqualToString:@"http://www.w3.org/2000/xmlns/"]) {
			[self throwException:@"Invalid URI for qualified name xmlns" subreason:[NSString stringWithFormat:@"%@:%@",name,theURI] location:CODELOCATION];
			return [NSNull null];
		}
	}

	
	if (val == nil) {
		val = @"";
	}
	
	GDataXMLNode * attributeNode = [element attributeForLocalName:[GDataXMLNode localNameForName:name] URI:theURI];
	if (attributeNode != nil) {
		xmlNodePtr oldNodePtr = [attributeNode XMLNode];
		TiDOMAttrProxy* result = [TiDOMNodeProxy nodeForXMLNode:oldNodePtr];
		if (result != nil) {
			[result setValue:val];
		}
		else {
			[attributeNode setStringValue:val];
		}
	}
	else {
		GDataXMLNode* resultNode = (GDataXMLNode*)[GDataXMLElement attributeWithName:localName stringValue:val];

		xmlChar *href;
		xmlChar *pre;
		
		if (theURI != nil)
			href = (xmlChar*)[theURI UTF8String];
		else
			href = NULL;
		
		if ([prefix length] > 0) {
			pre = (xmlChar*)[prefix UTF8String];
		} else {
			// default namespace is represented by a nil prefix
			pre = NULL;
		}
		
		xmlNsPtr theNewNs = xmlNewNs(NULL, // parent node
									 href, pre);
		[resultNode XMLNode]->ns = theNewNs;
		[element addAttribute: resultNode];
	}
}


-(void)removeAttribute:(id)args
{
	ENSURE_SINGLE_ARG(args, NSString);
	
	GDataXMLNode * attributeNode = [element attributeForName:args];
	if (attributeNode != nil)
	{
		xmlNodePtr oldNodePtr = [attributeNode XMLNode];
		TiDOMAttrProxy* result = [TiDOMNodeProxy nodeForXMLNode:oldNodePtr];
		
		//Retain it here so that the node does not get freed when cached values are released
		[attributeNode retain];
		//Switch the flag here so that the node is freed only when the object is freed
		[attributeNode setShouldFreeXMLNode:YES];
		[element removeChild:attributeNode];
		
		if (result != nil) {
			[[result node]setShouldFreeXMLNode:NO];
			[result setNode:attributeNode];
			[result setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
		}
		
		//Release now and this will free the underlying memory if result is nil
		[attributeNode release];
	}
}

-(void)removeAttributeNS:(id)args
{
	ENSURE_ARG_COUNT(args, 2);
    
	NSString *theURI = [args objectAtIndex:0];
	ENSURE_STRING_OR_NIL(theURI);
    
	NSString *name = [args objectAtIndex:1];
	ENSURE_STRING_OR_NIL(name);
    
	if(theURI != nil && name != nil)
	{
		GDataXMLNode * attributeNode = [element attributeForLocalName:name URI:theURI];
		if (attributeNode != nil)
		{
			xmlNodePtr oldNodePtr = [attributeNode XMLNode];
			TiDOMAttrProxy* result = [TiDOMNodeProxy nodeForXMLNode:oldNodePtr];
			
			//Retain it here so that the node does not get freed when cached values are released
			[attributeNode retain];
			//Switch the flag here so that the node is freed only when the object is freed
			[attributeNode setShouldFreeXMLNode:YES];
			[element removeChild:attributeNode];
			if (result != nil) {
				[[result node]setShouldFreeXMLNode:NO];
				[result setNode:attributeNode];
				[result setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
			}
			//Release now and this will free the underlying memory if result is nil
			[attributeNode release];
		}
	}
}


-(id)getAttributeNode:(id)args
{
	ENSURE_SINGLE_ARG(args, NSString);
	GDataXMLNode * attributeNode = [element attributeForName:args];
	if (attributeNode == nil) 
    {
		return [NSNull null];
	}
    xmlNodePtr resultPtr = [attributeNode XMLNode];
    id resultNode = [TiDOMNodeProxy nodeForXMLNode:resultPtr];
    if(resultNode != nil)
        return resultNode;

    NSString* nodeString = [attributeNode stringValue];
    id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
    TiDOMAttrProxy * result = [[[TiDOMAttrProxy alloc] _initWithPageContext:context] autorelease];
	[result setAttribute:[attributeNode name] value:nodeString owner:element];
    [result setNode:attributeNode];
	[result setDocument:[self document]];
    [TiDOMNodeProxy setNode:result forXMLNode:resultPtr];
	return result;
}

-(id)getAttributeNodeNS:(id)args
{
    ENSURE_ARG_COUNT(args, 2);
    
	NSString *theURI = [args objectAtIndex:0];
	ENSURE_STRING_OR_NIL(theURI);
    
	NSString *name = [args objectAtIndex:1];
	ENSURE_STRING_OR_NIL(name);
    if(theURI != nil && name != nil)
    {
        GDataXMLNode * attributeNode = [element attributeForLocalName:name URI:theURI];
        if(attributeNode != nil)
        {
            xmlNodePtr resultPtr = [attributeNode XMLNode];
            id resultNode = [TiDOMNodeProxy nodeForXMLNode:resultPtr];
            if(resultNode != nil)
                return resultNode;

            NSString* nodeString = [attributeNode stringValue];
            id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
            TiDOMAttrProxy * result = [[[TiDOMAttrProxy alloc] _initWithPageContext:context] autorelease];
            [result setAttribute:[attributeNode name] value:nodeString owner:element];
            [result setNode:attributeNode];
            [result setDocument:[self document]];
            [TiDOMNodeProxy setNode:result forXMLNode:resultPtr];
            return result;
        }
    }
    return [NSNull null];
}

-(id)setAttributeNode:(id)args
{
	ENSURE_SINGLE_ARG(args, TiDOMAttrProxy);
	TiDOMAttrProxy* attProxy = (TiDOMAttrProxy*)args;
	NSString* name = [[attProxy node]name];

	TiDOMAttrProxy* result = nil;
	if (name != nil) {
		xmlNodePtr oldNodePtr = [[attProxy node]XMLNode];
		
		if (oldNodePtr->parent != NULL) {
			[self throwException:@"Attribute in use" subreason:nil location:CODELOCATION];
			return [NSNull null];
		}
       
		if ([attProxy document] != [self document]) {
			[self throwException:@"mismatched documents" subreason:nil location:CODELOCATION];
			return [NSNull null];
		}

		GDataXMLNode * attributeNode = [element attributeForName:name];
		if (attributeNode != nil) {
			[attributeNode retain];
			[attributeNode setShouldFreeXMLNode:YES];
			oldNodePtr = [attributeNode XMLNode];
			result = [TiDOMNodeProxy nodeForXMLNode:oldNodePtr];
			//Remove Child Now
			[element removeChild:attributeNode];
			if (result == nil) {
				//Need to return the old attribute node
				id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
				result = [[[TiDOMAttrProxy alloc] _initWithPageContext:context] autorelease];
				[result setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
				[result setNode:attributeNode];
				[result setDocument:[self document]];
			}
			else {
				[[result node]setShouldFreeXMLNode:NO];
				[result setNode:attributeNode];
				[result setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
			}
			//Release now and this will free the underlying memory when proxy is released
			[attributeNode release];
		}
		
		oldNodePtr = [[attProxy node]XMLNode];
		if(oldNodePtr != NULL) {
			[TiDOMNodeProxy removeNodeForXMLNode:oldNodePtr];
		}
		//This adds by copying
		[element addAttribute: [attProxy node]];
		attributeNode = [element attributeForName:name];
		[attProxy setNode:attributeNode];
		[attProxy setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
		[TiDOMNodeProxy setNode:attProxy forXMLNode:[attributeNode XMLNode]];
	}
			
	if(result == nil)
		return [NSNull null];
	return result;
}

-(id)setAttributeNodeNS:(id)args
{
	ENSURE_SINGLE_ARG(args, TiDOMAttrProxy);
	TiDOMAttrProxy* attProxy = (TiDOMAttrProxy*)args;
	NSString* name = [[attProxy node]name];

	NSString* theURI = [[attProxy node]URI];
	TiDOMAttrProxy* result = nil;
	if (name != nil) {
		xmlNodePtr oldNodePtr = [[attProxy node]XMLNode];
		
		if (oldNodePtr->parent != NULL) {
			[self throwException:@"Attribute in use" subreason:nil location:CODELOCATION];
			return [NSNull null];
		}

		if ([attProxy document] != [self document]) {
			[self throwException:@"mismatched documents" subreason:nil location:CODELOCATION];
			return [NSNull null];
		}
		GDataXMLNode * attributeNode = [element attributeForLocalName:[GDataXMLNode localNameForName:name] URI:theURI];
		if (attributeNode != nil) {
			[attributeNode retain];
			[attributeNode setShouldFreeXMLNode:YES];
			oldNodePtr = [attributeNode XMLNode];
			result = [TiDOMNodeProxy nodeForXMLNode:oldNodePtr];
			//Remove Child Now
			[element removeChild:attributeNode];
			if (result == nil) {
				//Need to return the old attribute node
				id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
				result = [[[TiDOMAttrProxy alloc] _initWithPageContext:context] autorelease];
				[result setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
				[result setNode:attributeNode];
				[result setDocument:[self document]];
			}
			else {
				[[result node]setShouldFreeXMLNode:NO];
				[result setNode:attributeNode];
				[result setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
			}
			//Release now and this will free the underlying memory when proxy is released
			[attributeNode release];
		}

		oldNodePtr = [[attProxy node]XMLNode];
		if(oldNodePtr != NULL) {
			[TiDOMNodeProxy removeNodeForXMLNode:oldNodePtr];
		}
		//This adds by copying
		[element addAttribute: [attProxy node]];
		attributeNode = [element attributeForName:name];
		[attProxy setNode:attributeNode];
		[attProxy setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
		[TiDOMNodeProxy setNode:attProxy forXMLNode:[attributeNode XMLNode]];
	}		
	if(result == nil)
		return [NSNull null];
	return result;
}

-(id)removeAttributeNode:(id)args
{
	ENSURE_SINGLE_ARG(args, TiDOMAttrProxy);
    TiDOMAttrProxy* attProxy = (TiDOMAttrProxy*)args;
    
    xmlNodePtr theNodeToRemove = [[attProxy node]XMLNode];
    
    NSArray* elemAttributes = [element attributes];
    GDataXMLNode* nodeToRemove = nil;
    
    if([elemAttributes count]>0)
    {
        for(GDataXMLNode* node_ in elemAttributes)
        {
            if([node_ XMLNode] == theNodeToRemove)
            {
                nodeToRemove = node_;
                break;
            }
        }
        
        if(nodeToRemove == nil)
        {
            [self throwException:@"no node found to remove" subreason:nil location:CODELOCATION];
            return;
        }
        else
        {
            //Switch the flag here so that the node is freed only when the object is freed
			[nodeToRemove retain];
			[nodeToRemove setShouldFreeXMLNode:YES];
            [element removeChild:nodeToRemove];
            [[attProxy node]setShouldFreeXMLNode:NO];
			[attProxy setNode:nodeToRemove];
            return attProxy;
        }
    }
    else
    {
        [self throwException:@"no node found to remove" subreason:nil location:CODELOCATION];
        return;
    }
}


-(id)insertBefore:(id)args
{
	ENSURE_ARG_COUNT(args, 2);
	TiDOMNodeProxy* newChild;
	TiDOMNodeProxy* refChild;
    
	ENSURE_ARG_AT_INDEX(newChild, args, 0, TiDOMNodeProxy);
	ENSURE_ARG_AT_INDEX(refChild, args, 1, TiDOMNodeProxy);
	
	xmlNodePtr refNodePtr = [[refChild node]XMLNode];
	xmlNodePtr newNodePtr = [[newChild node]XMLNode];
	if (newNodePtr == refNodePtr)
		return;
	
	TiDOMNodeListProxy* nodeList = [self childNodes];
	
	
	TiDOMNodeProxy* cur= nil;
	int max = [TiUtils intValue:[nodeList length]];
	BOOL found = NO;
	for (int i=0; i<max && !found; i++) {
		cur = (TiDOMNodeProxy*)[nodeList item:[NSNumber numberWithInt:i]];
		if ([[cur node]XMLNode] == refNodePtr) {
			found = YES;
		}
	}
	
	if (found) {
		[[self node]releaseCachedValues];
		xmlNodePtr returnNodePtr = xmlAddPrevSibling(refNodePtr, newNodePtr);
		[[newChild node]setShouldFreeXMLNode:NO];
		if (returnNodePtr != nil) {
			if (returnNodePtr == newNodePtr) {
				return newChild;
			}
			else {
				//This should not happen
				id result = [TiDOMNodeProxy nodeForXMLNode:returnNodePtr];
				if (result == nil) {
					GDataXMLNode* retVal = [GDataXMLNode nodeConsumingXMLNode:returnNodePtr];
					id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
					result = [self makeNode:retVal context:context];
				}
				return result;
			}
			
		}
		else {
			//Will get here if there in an internal API error
			return [NSNull null];
		}
	}
	else {
		[self throwException:@"node is not part of children nodes" subreason:nil location:CODELOCATION];
		return [NSNull null];
	}
}

-(id)replaceChild:(id)args
{
	ENSURE_ARG_COUNT(args, 2);
	TiDOMNodeProxy* newChild;
	TiDOMNodeProxy* refChild;
    
	ENSURE_ARG_AT_INDEX(newChild, args, 0, TiDOMNodeProxy);
	ENSURE_ARG_AT_INDEX(refChild, args, 1, TiDOMNodeProxy);
	
	xmlNodePtr refNodePtr = [[refChild node]XMLNode];
	xmlNodePtr newNodePtr = [[newChild node]XMLNode];
	if (newNodePtr == refNodePtr)
		return;
	
	TiDOMNodeListProxy* nodeList = [self childNodes];
	
	
	TiDOMNodeProxy* cur= nil;
	int max = [TiUtils intValue:[nodeList length]];
	BOOL found = NO;
	for (int i=0; i<max && !found; i++) {
		cur = (TiDOMNodeProxy*)[nodeList item:[NSNumber numberWithInt:i]];
		if ([[cur node]XMLNode] == refNodePtr) {
			found = YES;
		}
	}
	
	if (found) {
		[[self node]releaseCachedValues];
		xmlNodePtr returnNodePtr = xmlReplaceNode(refNodePtr, newNodePtr);
		if (returnNodePtr != nil) {
			[[newChild node]setShouldFreeXMLNode:NO];
			if (returnNodePtr == refNodePtr) {
				[[refChild node]setShouldFreeXMLNode:YES];
				return refChild;
			}
			else {
				//This should not happen
				id result = [TiDOMNodeProxy nodeForXMLNode:returnNodePtr];
				if (result == nil) {
					GDataXMLNode* retVal = [GDataXMLNode nodeConsumingXMLNode:returnNodePtr];
					id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
					result = [self makeNode:retVal context:context];
				}
				return result;
			}
			
		}
		else {
			//Will get here if there in an internal API error
			return [NSNull null];
		}
	}
	else {
		[self throwException:@"no node found to replace" subreason:nil location:CODELOCATION];
		return [NSNull null];
	}
}

-(id)removeChild:(id)args
{
	ENSURE_SINGLE_ARG(args, TiDOMNodeProxy);
	TiDOMNodeProxy * oldChild = (TiDOMNodeProxy*)args;
    NSArray* children = [node children];
    GDataXMLNode* refChildNode = [oldChild node];
    GDataXMLNode* actualRefChildNode = nil;
    for(GDataXMLNode* childNode in children)
    {
        if ([childNode XMLNode] == [refChildNode XMLNode])
        {
            actualRefChildNode = childNode;
            break;
        }
    }
    if(actualRefChildNode != nil)
    {
		[actualRefChildNode retain];
        [actualRefChildNode setShouldFreeXMLNode:YES];
        [element removeChild:actualRefChildNode];
		
		[[oldChild node]setShouldFreeXMLNode:NO];

		if ([oldChild isKindOfClass:[TiDOMElementProxy class]]) {
			[(TiDOMElementProxy*)oldChild setElement:(GDataXMLElement*)actualRefChildNode];
		}
		else {
			[oldChild setNode:actualRefChildNode];
		}
		[actualRefChildNode release];
        return oldChild;
    }
    else
    {
        [self throwException:@"no node found to remove" subreason:nil location:CODELOCATION];
        return [NSNull null];
    }
}

-(id)appendChild:(id)args
{
	ENSURE_SINGLE_ARG(args, TiDOMNodeProxy);
	TiDOMNodeProxy * newChild = (TiDOMNodeProxy*)args;
	xmlNodePtr oldNodePtr = [[newChild node]XMLNode];
	GDataXMLNode* resultElement = [element addChild:[newChild node]];

	if (resultElement != nil)
	{
		//No longer part of tree set to free node since add child adds by creating copy
		[[newChild node]setShouldFreeXMLNode:YES];
		if (oldNodePtr != NULL)
		{
			[TiDOMNodeProxy removeNodeForXMLNode:oldNodePtr];
		}
		if ([newChild isKindOfClass:[TiDOMElementProxy class]])
		{
			[(TiDOMElementProxy*)newChild setElement:(GDataXMLElement*)resultElement];
		}
		else
		{
			[newChild setNode:resultElement];
		}
		[TiDOMNodeProxy setNode:newChild forXMLNode:[resultElement XMLNode]];
		return newChild;
	}
	else
	{
		return [NSNull null];
	}
}

-(id)attributes
{
	id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
	TiDOMNamedNodeMapProxy *proxy = [[[TiDOMNamedNodeMapProxy alloc] _initWithPageContext:context] autorelease];
	[proxy setElement:self];
	return proxy;
}


-(id)hasAttribute:(id)args
{
	ENSURE_SINGLE_ARG(args,NSString);
	GDataXMLNode *_node = [element attributeForName:args];
	return NUMBOOL(_node!=nil);
}

-(id)hasAttributeNS:(id)args
{
	ENSURE_ARG_COUNT(args, 2);
    
	NSString *theURI = [args objectAtIndex:0];
	ENSURE_STRING_OR_NIL(theURI);
    
	NSString *name = [args objectAtIndex:1];
	ENSURE_STRING_OR_NIL(name);
    
    if(theURI != nil && name != nil)
    {
        GDataXMLNode *_node = [element attributeForLocalName:name URI:theURI];
        return NUMBOOL(_node!=nil);
    }
    
	return NUMBOOL(NO);
}

@end

#endif