/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TiDOMNodeProxy.h"
#import "TiDOMDocumentProxy.h"
#import "TiDOMElementProxy.h"
#import "TiDOMTextNodeProxy.h"
#import "TiDOMNamedNodeMapProxy.h"
#import "TiDOMNodeListProxy.h"
#import "TiDOMAttrProxy.h"
#import "TiDOMCDATANodeProxy.h"
#import "TiUtils.h"
#include <libkern/OSAtomic.h>

static CFMutableDictionaryRef nodeRegistry = NULL;
OSSpinLock nodeRegistryLock = OS_SPINLOCK_INIT;

@implementation TiDOMNodeProxy
@synthesize document, node;

#pragma mark Internal

-(void)dealloc
{
    if( (node != nil) && ([node XMLNode] != NULL) )
    {
        [TiDOMNodeProxy removeNodeForXMLNode:[node XMLNode]];
    }
	RELEASE_TO_NIL(node);
	RELEASE_TO_NIL(document);
	[super dealloc];
}

-(NSString *)XMLString
{
	return [node XMLString];
}

+(id)nodeForXMLNode:(xmlNodePtr) nodePtr
{
	id result = nil;
	OSSpinLockLock(&nodeRegistryLock);
	if (nodeRegistry != NULL) {
		result = CFDictionaryGetValue(nodeRegistry, nodePtr);
	}
	OSSpinLockUnlock(&nodeRegistryLock);
	return result;
}

Boolean		simpleEquals(const void *value1, const void *value2)
{
	return value1==value2;
}

CFHashCode	simpleHash(const void *value)
{
	return (CFHashCode)value;
}

+(void)setNode:(id)node forXMLNode:(xmlNodePtr) nodePtr
{
	if ((node == nil) || (nodePtr == NULL)) {
		return;
	}
	OSSpinLockLock(&nodeRegistryLock);
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
	CFDictionarySetValue(nodeRegistry, (void*)nodePtr, node);
	OSSpinLockUnlock(&nodeRegistryLock);

}

+(void)removeNodeForXMLNode:(xmlNodePtr)nodePtr
{
    OSSpinLockLock(&nodeRegistryLock);
    if (nodeRegistry == NULL)
        return;
    CFDictionaryRemoveValue(nodeRegistry, nodePtr);
    OSSpinLockUnlock(&nodeRegistryLock);
}


-(id)makeNode:(id)child context:(id<TiEvaluator>)context
{
	// if already a proxy, just return it.
	if ([child isKindOfClass:[TiDOMNodeProxy class]])
	{
		return child;
	}
	
	id result = [TiDOMNodeProxy makeNode:child context:context];
	[result setDocument:[self document]];
	return result;
}

+(id)makeNode:(id)child context:(id<TiEvaluator>)context
{
	// if already a proxy, just return it.
	if ([child isKindOfClass:[TiDOMNodeProxy class]])
	{
		return child;
	}
	
	xmlNodePtr childXmlNode = [child XMLNode];
	
	id result = [TiDOMNodeProxy nodeForXMLNode:childXmlNode];
	if (result != nil) {
		return result;
	}
	
	switch(childXmlNode->type)
	{
		case XML_ELEMENT_NODE:
		{
			TiDOMElementProxy *element = [[[TiDOMElementProxy alloc] _initWithPageContext:context] autorelease];
			[element setElement:(GDataXMLElement*)child];
			[TiDOMNodeProxy setNode:element forXMLNode:childXmlNode];
			return element;
		}
		case XML_ATTRIBUTE_NODE:
		{
			TiDOMAttrProxy *proxy = [[[TiDOMAttrProxy alloc] _initWithPageContext:context] autorelease];
            [proxy setAttribute:[child name] value:[child stringValue] owner:nil];
			[proxy setNode:child];
			[TiDOMNodeProxy setNode:proxy forXMLNode:childXmlNode];
			return proxy;
		}
		case XML_TEXT_NODE:
		{
			TiDOMTextNodeProxy *proxy = [[[TiDOMTextNodeProxy alloc] _initWithPageContext:context] autorelease];
			[proxy setNode:child];
			[TiDOMNodeProxy setNode:proxy forXMLNode:childXmlNode];
			return proxy;
		}
        case XML_CDATA_SECTION_NODE:
        {
            TiDOMCDATANodeProxy *proxy = [[[TiDOMCDATANodeProxy alloc] _initWithPageContext:context] autorelease];
            [proxy setNode:child];
			[TiDOMNodeProxy setNode:proxy forXMLNode:childXmlNode];
            return proxy;
        }
		default:
		{
			TiDOMNodeProxy *element = [[[TiDOMNodeProxy alloc] _initWithPageContext:context] autorelease];
			[element setNode:child];
			[TiDOMNodeProxy setNode:element forXMLNode:childXmlNode];
			return element;
		}
	}
}

#pragma mark Public APIs 

-(id)nodeName
{
    xmlNodePtr realNode = [node XMLNode];
	if (realNode == NULL) {
		return [NSNull null];
	}
	xmlElementType realNodeType = realNode->type;
    
    switch (realNodeType) 
    {
        case XML_TEXT_NODE:
            return @"text";
        case XML_COMMENT_NODE:
            return @"comment";
        case XML_CDATA_SECTION_NODE:
            return @"cdata-section";
        case XML_DOCUMENT_NODE:
            return @"document";
        case XML_DOCUMENT_FRAG_NODE:
            return @"document-fragment";
        default:
            return [node name];
    }
}

-(id)nodeValue
{
	return [node stringValue];
}

-(void)setNodeValue:(NSString *)data
{
	ENSURE_TYPE(data, NSString);
    [node setStringValue:data];
}

-(id)text
{
	return [node stringValue];
}

-(id)parentNode
{
	xmlNodePtr p = [node XMLNode]->parent;
    if (p == NULL)
        return [NSNull null];
    
    GDataXMLNode* sibling = [GDataXMLNode nodeBorrowingXMLNode:p];
	return [self makeNode:sibling context:[self executionContext]];
}

-(id)childNodes
{
    [node releaseCachedValues];
	NSMutableArray *children = [NSMutableArray array];
	for (GDataXMLNode* child in [node children])
	{
		[children addObject:[self makeNode:child context:[self executionContext]]];
	}
	TiDOMNodeListProxy *proxy = [[[TiDOMNodeListProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
	[proxy setDocument:[self document]];
	[proxy setNodes:children];
	return proxy;
}

-(id)firstChild
{
    [node releaseCachedValues];
	int count = [node childCount];
	if (count == 0) return [NSNull null];
	id child = [node childAtIndex:0];
	return [self makeNode:child context:[self executionContext]];
}

-(id)lastChild
{
    [node releaseCachedValues];
	int count = [node childCount];
	if (count == 0) return [NSNull null];
	id child = [node childAtIndex:count-1];
	return [self makeNode:child context:[self executionContext]];
}

-(id)previousSibling
{
	xmlNodePtr p = [node XMLNode]->prev;
	if (p==NULL) 
	{
		return [NSNull null];
	}
    GDataXMLNode* sibling = [GDataXMLNode nodeBorrowingXMLNode:p];
    return [self makeNode:sibling context:[self executionContext]];
}

-(id)nextSibling
{
	xmlNodePtr p = [node XMLNode]->next;
	if (p==NULL) 
	{
		return [NSNull null];
	}
    GDataXMLNode* sibling = [GDataXMLNode nodeBorrowingXMLNode:p];
    return [self makeNode:sibling context:[self executionContext]];
	
}

-(id)attributes
{
    xmlElementType realType = [node XMLNode]->type;
    if (realType == XML_ELEMENT_NODE)
    {
        TiDOMNamedNodeMapProxy *proxy = [[[TiDOMNamedNodeMapProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
        [proxy setDocument:[self document]];
        [proxy setElement:(GDataXMLElement*)node];
        return proxy;
    }
    return [NSNull null];
}

-(id)ownerDocument
{
	xmlDocPtr p = [node XMLNode]->doc;
	if (p==NULL) 
	{
		return [NSNull null];
	}
    TiDOMDocumentProxy *proxy = [TiDOMNodeProxy nodeForXMLNode:(xmlNodePtr)p];
    if (proxy == nil)
    {
        proxy = [[[TiDOMDocumentProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
        [proxy setDocument:[self document]];
        [proxy setNode:[[self document]rootElement]];
        [TiDOMNodeProxy setNode:proxy forXMLNode:(xmlNodePtr)p];
    }
	return proxy;
}

-(id)insertBefore:(id)args
{
	[self throwException:@"mutation not supported" subreason:nil location:CODELOCATION];
}

-(id)replaceChild:(id)args
{
	[self throwException:@"mutation not supported" subreason:nil location:CODELOCATION];
}

-(id)removeChild:(id)args
{
	[self throwException:@"mutation not supported" subreason:nil location:CODELOCATION];
}

-(id)appendChild:(id)args
{
	[self throwException:@"mutation not supported" subreason:nil location:CODELOCATION];
}

-(id)hasChildNodes:(id)args
{
    return NUMBOOL([node childCount] > 0);
}

-(void)normalize:(id)args
{
    //TODO
}

-(id)isSupported:(id)args
{
	ENSURE_ARG_COUNT(args, 2);
    
	NSString *feature = [args objectAtIndex:0];
	ENSURE_STRING_OR_NIL(feature);
    
	NSString *version = [args objectAtIndex:1];
	ENSURE_STRING_OR_NIL(version);
    
    if (feature != nil)
    {
        if ( (version == nil) || ([[version lowercaseString] compare:@"1.0"] == 0) || ([[version lowercaseString] compare:@"2.0"] == 0) )
        {
            if ([[feature lowercaseString] compare:@"core"] == 0)
                return NUMBOOL(YES);
            else if([[feature lowercaseString] compare:@"xml"] == 0)
                return NUMBOOL(YES);
            else 
                return NUMBOOL(NO);
        }
    }
    
    return NUMBOOL(NO);
}

-(id)namespaceURI
{
	NSString* result = [node URI];
    if (result == nil)
        return [NSNull null];
    return result;
}

-(id)prefix
{
	NSString* result = [node prefix];
    if ([result length]==0)
        return [NSNull null];
    return result;
}

-(id)localName
{
    if(node != nil)
    {
        xmlNodePtr theRealNode = [node XMLNode];
        if (theRealNode != nil)
        {
            xmlElementType nodeType = theRealNode->type;
            if (nodeType == XML_ELEMENT_NODE || nodeType == XML_ATTRIBUTE_NODE)
            {
                if(theRealNode->ns != nil)
                {
                    return [GDataXMLNode localNameForName:[node name]];
                }
            }
        }
        
    }
	return [NSNull null];
}

-(id)hasAttributes:(id)args
{
	if ([node kind] == GDataXMLElementKind)
	{
		GDataXMLElement *element = (GDataXMLElement*)node;
		if ([element attributes]!=nil)
		{
			return NUMBOOL([[element attributes] count] > 0);
		}
	}
	return NUMBOOL(NO);
}

-(id)nodeType
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

-(id)cloneNode:(id)args
{
    int recursive;
    ENSURE_SINGLE_ARG(args,NSNumber);
    
    BOOL deep = [TiUtils boolValue:args];
    
    if(deep)
        recursive = 1;
    else
        recursive = 2;
    
    xmlNodePtr ourRealNode = [node XMLNode];
    xmlNodePtr ret = xmlCopyNode(ourRealNode, recursive);
    
    if (ret == nil)
        return [NSNull null];
    else
    {
        GDataXMLNode *resultElement = [GDataXMLNode nodeBorrowingXMLNode:ret];
        return [self makeNode:resultElement context:[self executionContext]];
    }
}


MAKE_SYSTEM_PROP(ELEMENT_NODE,XML_ELEMENT_NODE);
MAKE_SYSTEM_PROP(ATTRIBUTE_NODE,XML_ATTRIBUTE_NODE);
MAKE_SYSTEM_PROP(TEXT_NODE,XML_TEXT_NODE);
MAKE_SYSTEM_PROP(CDATA_SECTION_NODE,XML_CDATA_SECTION_NODE);
MAKE_SYSTEM_PROP(ENTITY_REFERENCE_NODE,XML_ENTITY_REF_NODE);
MAKE_SYSTEM_PROP(ENTITY_NODE,XML_ENTITY_NODE);
MAKE_SYSTEM_PROP(PROCESSING_INSTRUCTION_NODE,XML_PI_NODE);
MAKE_SYSTEM_PROP(COMMENT_NODE,XML_COMMENT_NODE);
MAKE_SYSTEM_PROP(DOCUMENT_NODE,XML_DOCUMENT_NODE);
MAKE_SYSTEM_PROP(DOCUMENT_TYPE_NODE,XML_DOCUMENT_TYPE_NODE);
MAKE_SYSTEM_PROP(DOCUMENT_FRAGMENT_NODE,XML_DOCUMENT_FRAG_NODE);
MAKE_SYSTEM_PROP(NOTATION_NODE,XML_NOTATION_NODE);


@end

#endif