/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TiDOMNamedNodeMapProxy.h"
#import "TiDOMAttrProxy.h"
#import "TiUtils.h"

@implementation TiDOMNamedNodeMapProxy
@synthesize document;

-(void)dealloc
{
	RELEASE_TO_NIL(element);
	RELEASE_TO_NIL(document);
	[super dealloc];
}

-(void)setElement:(GDataXMLElement*)element_
{
	RELEASE_TO_NIL(element);
	element = [element_ retain];
}

-(id)getNamedItem:(id)name
{
	ENSURE_SINGLE_ARG(name,NSString);
	GDataXMLNode *node = [element attributeForName:name];
    if(node != nil)
    {
        xmlNodePtr resultPtr = [node XMLNode];
        id resultNode = [TiDOMNodeProxy nodeForXMLNode:resultPtr];
        if(resultNode != nil)
            return resultNode;

        id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
        TiDOMAttrProxy *proxy = [[[TiDOMAttrProxy alloc] _initWithPageContext:context] autorelease];
        [proxy setAttribute:[node name] value:[node stringValue] owner:element];
        [proxy setNode:node];
        [proxy setDocument:[self document]];
        [TiDOMNodeProxy setNode:proxy forXMLNode:resultPtr];
        return proxy;
    }
    return [NSNull null];
}

-(id)getNamedItemNS:(id)args
{
    ENSURE_ARG_COUNT(args, 2);
    
    NSString* name;
    NSObject* theURI;
    ENSURE_ARG_AT_INDEX(theURI, args, 0, NSObject);
    ENSURE_ARG_AT_INDEX(name, args, 1, NSString);
	
    GDataXMLNode *node = nil;
    if([theURI isKindOfClass:[NSNull class]])
    {
        node = [element attributeForName:name];
    }
    else
    {
        node = [element attributeForLocalName:name URI:(NSString*)theURI]; 
    }

    if(node != nil)
    {
        xmlNodePtr resultPtr = [node XMLNode];
        id resultNode = [TiDOMNodeProxy nodeForXMLNode:resultPtr];
        if(resultNode != nil)
            return resultNode;
        id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];

        TiDOMAttrProxy *proxy = [[[TiDOMAttrProxy alloc] _initWithPageContext:context] autorelease];
        [proxy setAttribute:[node name] value:[node stringValue] owner:element];
        [proxy setNode:node];
        [proxy setDocument:[self document]];
        [TiDOMNodeProxy setNode:proxy forXMLNode:resultPtr];
        return proxy;
    }
    return [NSNull null];
}

-(id)setNamedItem:(id)args
{
	ENSURE_SINGLE_ARG(args, TiDOMAttrProxy);
    if(args != nil)
    {
        TiDOMAttrProxy* result = nil;
        TiDOMAttrProxy* attProxy = (TiDOMAttrProxy*)args;
        GDataXMLNode* realNode = [attProxy node];
        NSObject* ownerObj = [attProxy ownerElement];
        if(![ownerObj isKindOfClass:[NSNull class]])
        {
            GDataXMLElement *owner = [attProxy ownerElement];
            if( (owner != nil)&&([element isEqual:owner] == NO) )
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
        NSString* localName = [realNode localName];
        GDataXMLNode * attributeNode = [element attributeForName:localName];
        if (attributeNode != nil) 
        {
            //Switch the flag here so that the node is freed only when the object is freed
            [attributeNode setShouldFreeXMLNode:YES];
            xmlNodePtr oldNodePtr = [attributeNode XMLNode];
            result = [TiDOMNodeProxy nodeForXMLNode:oldNodePtr];
            if(result == nil)
            {
                //Need to return the old attribute node
                id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
                result = [[[TiDOMAttrProxy alloc] _initWithPageContext:context] autorelease];
                [result setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
                [result setNode:attributeNode];
                [result setDocument:[self document]];
                [TiDOMNodeProxy setNode:result forXMLNode:[attributeNode XMLNode]];
            }
            else
            {
                [TiDOMNodeProxy removeNodeForXMLNode:oldNodePtr];
                [TiDOMNodeProxy setNode:result forXMLNode:[attributeNode XMLNode]];
                [result setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
                [result setNode:attributeNode];
                [result setDocument:[self document]];
            }
            [element removeChild:attributeNode];
        }
        xmlNodePtr oldNodePtr = [[attProxy node]XMLNode];
        if(oldNodePtr != NULL)
        {
            [TiDOMNodeProxy removeNodeForXMLNode:oldNodePtr];
        }
        [element addAttribute:realNode];
        attributeNode = [element attributeForName:localName];
        [attProxy setNode:attributeNode];
        [attProxy setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
        [TiDOMNodeProxy setNode:attProxy forXMLNode:[attributeNode XMLNode]];
        if(result != nil)
            return result;
        else
            return [NSNull null];
    }
    return [NSNull null];
}

-(id)setNamedItemNS:(id)args
{
    ENSURE_SINGLE_ARG(args, TiDOMAttrProxy);
    if(args != nil)
    {
        TiDOMAttrProxy* result = nil;
        TiDOMAttrProxy* attProxy = (TiDOMAttrProxy*)args;
        GDataXMLNode* realNode = [attProxy node];
        NSObject* ownerObj = [attProxy ownerElement];
        if(![ownerObj isKindOfClass:[NSNull class]])
        {
            GDataXMLElement *owner = [attProxy ownerElement];
            if( (owner != nil)&&([element isEqual:owner] == NO) )
            {
                [self throwException:@"mismatched owner elements" subreason:nil location:CODELOCATION];
                return [NSNull null];
            }
        }
        if ([args document] != [self document])
        {
            [self throwException:@"mismatched documents" subreason:nil location:CODELOCATION];
            return [NSNull null];
        }
        NSString* localName = [realNode localName];
        GDataXMLNode * attributeNode = [element attributeForLocalName:localName URI:[realNode URI]];
        if (attributeNode != nil) 
        {
            //Switch the flag here so that the node is freed only when the object is freed
            [attributeNode setShouldFreeXMLNode:YES];
            xmlNodePtr oldNodePtr = [attributeNode XMLNode];
            result = [TiDOMNodeProxy nodeForXMLNode:oldNodePtr];
            if(result == nil)
            {
                //Need to return the old attribute node
                id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
                result = [[[TiDOMAttrProxy alloc] _initWithPageContext:context] autorelease];
                [result setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
                [result setNode:attributeNode];
                [result setDocument:[self document]];
                [TiDOMNodeProxy setNode:result forXMLNode:[attributeNode XMLNode]];
            }
            else
            {
                [TiDOMNodeProxy removeNodeForXMLNode:oldNodePtr];
                [TiDOMNodeProxy setNode:result forXMLNode:[attributeNode XMLNode]];
                [result setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
                [result setNode:attributeNode];
                [result setDocument:[self document]];
            }
            [element removeChild:attributeNode];
        }
        xmlNodePtr oldNodePtr = [[attProxy node]XMLNode];
        if(oldNodePtr != NULL)
        {
            [TiDOMNodeProxy removeNodeForXMLNode:oldNodePtr];
        }
        [element addAttribute:realNode];
        attributeNode = [element attributeForLocalName:localName URI:[realNode URI]];
        [attProxy setNode:attributeNode];
        [attProxy setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
        [TiDOMNodeProxy setNode:attProxy forXMLNode:[attributeNode XMLNode]];
        if(result != nil)
            return result;
        else
            return [NSNull null];
    }
    return [NSNull null];
}

-(id)removeNamedItem:(id)args
{
	ENSURE_SINGLE_ARG(args, NSString);
	TiDOMAttrProxy* result = nil;
	GDataXMLNode * attributeNode = [element attributeForName:args];
    if(attributeNode != nil)
    {
        //Switch the flag here so that the node is freed only when the object is freed
        [attributeNode setShouldFreeXMLNode:YES];
        result = [TiDOMNodeProxy nodeForXMLNode:[attributeNode XMLNode]];
        if(result == nil)
        {
            id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
            result = [[[TiDOMAttrProxy alloc] _initWithPageContext:context] autorelease];
            [result setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
            [result setNode:attributeNode];
            [result setDocument:[self document]];
            [TiDOMNodeProxy setNode:result forXMLNode:[attributeNode XMLNode]];
        }
        else
        {
            [result setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
            [result setNode:attributeNode];
            [result setDocument:[self document]];
        }
        [element removeChild:attributeNode];
        return result;
    }
    else
    {
        [self throwException:@"could not find item to remove" subreason:@"" location:CODELOCATION];
    }
}

-(id)removeNamedItemNS:(id)args
{
	ENSURE_ARG_COUNT(args, 2);
    NSString* name;
    NSString* theURI;
    ENSURE_ARG_AT_INDEX(theURI, args, 0, NSString);
    ENSURE_ARG_AT_INDEX(name, args, 1, NSString);
    TiDOMAttrProxy* result = nil;
	
	GDataXMLNode *attributeNode = [element attributeForLocalName:name URI:theURI];
    if(attributeNode != nil)
    {
        //Switch the flag here so that the node is freed only when the object is freed
        [attributeNode setShouldFreeXMLNode:YES];
        result = [TiDOMNodeProxy nodeForXMLNode:[attributeNode XMLNode]];
        if(result == nil)
        {
            id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
            result = [[[TiDOMAttrProxy alloc] _initWithPageContext:context] autorelease];
            [result setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
            [result setNode:attributeNode];
            [result setDocument:[self document]];
            [TiDOMNodeProxy setNode:result forXMLNode:[attributeNode XMLNode]];
        }
        else
        {
            [result setAttribute:[attributeNode name] value:[attributeNode stringValue] owner:element];
            [result setNode:attributeNode];
            [result setDocument:[self document]];
        }
        [element removeChild:attributeNode];
        return result;
    }
    else
    {
        [self throwException:@"could not find item to remove" subreason:@"" location:CODELOCATION];
    }
}

-(id)item:(id)args
{
	ENSURE_SINGLE_ARG(args,NSObject);
	int index = [TiUtils intValue:args];
    if( ([[element attributes] count] > index) && (index >= 0) )
    {
        GDataXMLNode *node = [[element attributes] objectAtIndex:index];
        TiDOMAttrProxy *proxy = [TiDOMNodeProxy nodeForXMLNode:[node XMLNode]];
        if(proxy == nil)
        {
            proxy = [[[TiDOMAttrProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
            [proxy setAttribute:[node name] value:[node stringValue] owner:element];
            [proxy setNode:node];
            [proxy setDocument:[self document]];
            [TiDOMNodeProxy setNode:proxy forXMLNode:[node XMLNode]];
        }
        return proxy;
    }
    return [NSNull null];
}

/*
Because of parity, we cannot enable this just yet, but this code will allow for treating index
properties the same as foo.item(index).
 
-(id)valueForUndefinedKey:(NSString *)key
{
	if ([[key stringByTrimmingCharactersInSet:[NSCharacterSet decimalDigitCharacterSet]] length]==0)
	{
		return [self item:key];
	}
	return [super valueForUndefinedKey:key];
}
*/

-(NSNumber*)length
{
	return NUMINT([[element attributes] count]);
}

@end

#endif