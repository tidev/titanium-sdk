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
#import "TiUtils.h"

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
		TiDOMNodeListProxy *proxy = [[[TiDOMNodeListProxy alloc] _initWithPageContext:context] autorelease];
		[proxy setNodes:nodes];
		[proxy setDocument:[self document]];
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
		TiDOMNodeListProxy *proxy = [[[TiDOMNodeListProxy alloc] _initWithPageContext:context] autorelease];
		[proxy setNodes:nodes];
		[proxy setDocument:[self document]];
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
		TiDOMNodeListProxy *proxy = [[[TiDOMNodeListProxy alloc] _initWithPageContext:context] autorelease];
		[proxy setNodes:nodes];
		[proxy setDocument:[self document]];
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

	NSString *name = [args objectAtIndex:0];
	ENSURE_STRING_OR_NIL(name);

	NSString *val = [args objectAtIndex:1];
	ENSURE_STRING_OR_NIL(val);

	if (name != nil && val != nil)
	{
        GDataXMLNode * attributeNode = [element attributeForName:name];
        if(attributeNode != nil)
        {
            [attributeNode setStringValue:val];
        }
        else
        {
            [element addAttribute: [GDataXMLNode attributeWithName: name stringValue: val]];
        }
        
	}
}

-(void)setAttributeNS:(id)args
{
	ENSURE_ARG_COUNT(args, 3);
    NSString *theURI = [args objectAtIndex:0];
    ENSURE_STRING_OR_NIL(theURI);
    
	NSString *name = [args objectAtIndex:1];
	ENSURE_STRING_OR_NIL(name);
    
	NSString *val = [args objectAtIndex:2];
	ENSURE_STRING_OR_NIL(val);
    
	if (theURI != nil && name != nil && val != nil)
	{
        GDataXMLNode * attributeNode = [element attributeForLocalName:[GDataXMLNode localNameForName:name] URI:theURI];
        if(attributeNode != nil)
            [element removeChild:attributeNode];
        [element addAttribute: [GDataXMLNode attributeWithName:name URI:theURI stringValue:val]];
	}
}


-(void)removeAttribute:(id)args
{
	ENSURE_SINGLE_ARG(args, NSString);
	
	GDataXMLNode * attributeNode = [element attributeForName:args];
    if(attributeNode != nil)
        [element removeChild:attributeNode];
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
        if(attributeNode != nil)
            [element removeChild:attributeNode];
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
    NSString* val = [attProxy value];
    TiDOMAttrProxy* result = nil;
    if(name != nil && val != nil)
    {
        NSObject* ownerObj = [attProxy ownerElement];
        if(![ownerObj isKindOfClass:[NSNull class]])
        {
            GDataXMLElement *owner = [attProxy ownerElement];
        
            if( (owner != nil)&&([node isEqual:owner] == NO) )
            {
                [self throwException:@"mismatched owner elements" subreason:nil location:CODELOCATION];
                return [NSNull null];
            }
        }
        if ([attProxy document] != [self document])
        {
            [self throwException:@"mismatched documents" subreason:nil location:CODELOCATION];
            return [NSNull null];
        }
        GDataXMLNode * attributeNode = [element attributeForName:name];
        if (attributeNode != nil) 
        {
            //Switch the flag here so that the node is freed only when the object is freed
            [attributeNode setShouldFreeXMLNode:YES];
            result = [TiDOMNodeProxy nodeForXMLNode:[attributeNode XMLNode]];
            if(result == nil)
            {
                NSString* nodeString = [attributeNode stringValue];
                //Need to return the old attribute node
                id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
                result = [[[TiDOMAttrProxy alloc] _initWithPageContext:context] autorelease];
                [result setAttribute:[attributeNode name] value:nodeString owner:element];
                [result setNode:attributeNode];
                [result setDocument:[self document]];
                [TiDOMNodeProxy setNode:result forXMLNode:[attributeNode XMLNode]];
            }
            [element removeChild:attributeNode];
        }
        xmlNodePtr oldNodePtr = [[attProxy node]XMLNode];
        if(oldNodePtr != NULL)
        {
            [TiDOMNodeProxy removeNodeForXMLNode:oldNodePtr];
        }
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
    NSString* val = [attProxy value];
    NSString* theURI = [[attProxy node]URI];
    TiDOMAttrProxy* result = nil;
    if(name != nil && val != nil)
    {
        NSObject* ownerObj = [attProxy ownerElement];
        if(![ownerObj isKindOfClass:[NSNull class]])
        {
            GDataXMLElement *owner = [attProxy ownerElement];
            
            if( (owner != nil)&&([node isEqual:owner] == NO) )
            {
                [self throwException:@"mismatched owner elements" subreason:nil location:CODELOCATION];
                return [NSNull null];
            }
        }
        if ([attProxy document] != [self document])
        {
            [self throwException:@"mismatched documents" subreason:nil location:CODELOCATION];
            return [NSNull null];
        }
        GDataXMLNode * attributeNode = [element attributeForLocalName:[GDataXMLNode localNameForName:name] URI:theURI];
        if (attributeNode != nil) 
        {
            //Switch the flag here so that the node is freed only when the object is freed
            [attributeNode setShouldFreeXMLNode:YES];
            result = [TiDOMNodeProxy nodeForXMLNode:[attributeNode XMLNode]];
            if(result == nil)
            {
                NSString* nodeString = [attributeNode stringValue];
                id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
                //Need to return the old attribute node
                result = [[[TiDOMAttrProxy alloc] _initWithPageContext:context] autorelease];
                [result setAttribute:[attributeNode name] value:nodeString owner:nil];
                [result setNode:attributeNode];
                [result setDocument:[self document]];
                [TiDOMNodeProxy setNode:result forXMLNode:[attributeNode XMLNode]];
            }
            [element removeChild:attributeNode];
        }
        xmlNodePtr oldNodePtr = [[attProxy node]XMLNode];
        if(oldNodePtr != NULL)
        {
            [TiDOMNodeProxy removeNodeForXMLNode:oldNodePtr];
        }
        [element addAttribute: [attProxy node]];
        attributeNode = attributeNode = [element attributeForLocalName:[GDataXMLNode localNameForName:name] URI:theURI];
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
            [[attProxy node]setShouldFreeXMLNode:YES];
            [element removeChild:nodeToRemove];
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
    
    NSArray* children = [node children];
    GDataXMLNode* refChildNode = [refChild node];
    GDataXMLNode* actualRefChildNode = nil;
    
    for(GDataXMLNode* childNode in children)
    {
        if([childNode isEqual:refChildNode])
        {
            actualRefChildNode = childNode;
            break;
        }
    }
    
    if(actualRefChildNode != nil)
    {
        xmlNodePtr returnNode = xmlAddPrevSibling([actualRefChildNode XMLNode], [[newChild node] XMLNode]);
        if(returnNode != NULL)
        {
            [[self node]releaseCachedValues];
            if (returnNode == [[newChild node] XMLNode])
            {
                //Now it is part of the tree so switch flag to ensur it gets freed when doc is released
                [[newChild node]setShouldFreeXMLNode:NO];
                return newChild;
			}
            GDataXMLNode* retVal = [GDataXMLNode nodeBorrowingXMLNode:returnNode];
            id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
            return [TiDOMNodeProxy makeNode:retVal context:context];
        }
        return [NSNull null];
    }
    
	return [NSNull null];
}

-(id)replaceChild:(id)args
{
    ENSURE_ARG_COUNT(args, 2);
    TiDOMNodeProxy* newChild;
    TiDOMNodeProxy* refChild;
    
    ENSURE_ARG_AT_INDEX(newChild, args, 0, TiDOMNodeProxy);
    ENSURE_ARG_AT_INDEX(refChild, args, 1, TiDOMNodeProxy);
    
    if(newChild == refChild)
		return;
	
    NSArray* children = [node children];
    GDataXMLNode* refChildNode = [refChild node];
    GDataXMLNode* actualRefChildNode = nil;
    
    for(GDataXMLNode* childNode in children)
    {
        if([childNode isEqual:refChildNode])
        {
            actualRefChildNode = childNode;
            break;
        }
    }
    if(actualRefChildNode != nil)
    {
        xmlNodePtr returnNode = xmlReplaceNode([actualRefChildNode XMLNode], [[newChild node]XMLNode]);
        if(returnNode != nil)
        {
            //No longer part of tree. Set to free node ptr on object dealloc
            [[refChild node]setShouldFreeXMLNode:YES];
            [[self node]releaseCachedValues];
            GDataXMLNode* retVal = [GDataXMLNode nodeConsumingXMLNode:returnNode];
            id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
            return [TiDOMNodeProxy makeNode:retVal context:context];
        }
        return [NSNull null];
    }
    return [NSNull null];
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
        if([childNode isEqual:refChildNode])
        {
            actualRefChildNode = childNode;
            break;
        }
    }
    if(actualRefChildNode != nil)
    {
        [element removeChild:actualRefChildNode];
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
    if(resultElement != nil)
    {
        //No longer part of tree set to free node since add child adds by creating copy
        [[newChild node]setShouldFreeXMLNode:YES];
        if(oldNodePtr != NULL)
        {
            [TiDOMNodeProxy removeNodeForXMLNode:oldNodePtr];
        }
        [newChild setNode:resultElement];
        [TiDOMNodeProxy setNode:newChild forXMLNode:[resultElement XMLNode]];
        return newChild;
    }
    else
    {
        return [NSNull null];
    }
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