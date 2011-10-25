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

@implementation TiDOMNodeProxy
@synthesize document, node;

#pragma mark Internal

-(void)dealloc
{
	RELEASE_TO_NIL(node);
	RELEASE_TO_NIL(document);
	[super dealloc];
}

-(NSString *)XMLString
{
	return [node XMLString];
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
	
	switch([child kind])
	{
		case GDataXMLElementKind:
		{
			TiDOMElementProxy *element = [[[TiDOMElementProxy alloc] _initWithPageContext:context] autorelease];
			[element setElement:(GDataXMLElement*)child];
			return element;
		}
		case GDataXMLAttributeKind:
		{
			//FIXME:
			TiDOMAttrProxy *proxy = [[[TiDOMAttrProxy alloc] _initWithPageContext:context] autorelease];
			return proxy;
		}
		case GDataXMLTextKind:
		{
			TiDOMTextNodeProxy *proxy = [[[TiDOMTextNodeProxy alloc] _initWithPageContext:context] autorelease];
			[proxy setNode:child];
			return proxy;
		}
		default:
		{
			TiDOMNodeProxy *element = [[[TiDOMNodeProxy alloc] _initWithPageContext:context] autorelease];
			[element setNode:child];
			return element;
		}
	}
}

#pragma mark Public APIs 

-(id)nodeName
{
	return [node name];
}

-(id)nodeValue
{
	return [node stringValue];
}

-(id)text
{
	return [node stringValue];
}

-(id)parentNode
{
	xmlNodePtr p = [node XMLNode]->parent;
	GDataXMLNode* sibling = [GDataXMLNode nodeBorrowingXMLNode:p];
	return [self makeNode:sibling context:[self executionContext]];
}

-(id)childNodes
{
	NSMutableArray *children = [NSMutableArray array];
	for (GDataXMLNode* child in [node children])
	{
		[children addObject:[self makeNode:child context:[self pageContext]]];
	}
	TiDOMNodeListProxy *proxy = [[[TiDOMNodeListProxy alloc] _initWithPageContext:[self pageContext]] autorelease];
	[proxy setDocument:[self document]];
	[proxy setNodes:children];
	return proxy;
}

-(id)firstChild
{
	int count = [node childCount];
	if (count == 0) return nil;
	id child = [node childAtIndex:0];
	return [self makeNode:child context:[self pageContext]];
}

-(id)lastChild
{
	int count = [node childCount];
	if (count == 0) return nil;
	id child = [node childAtIndex:count-1];
	return [self makeNode:child context:[self pageContext]];
}

-(id)previousSibling
{
	xmlNodePtr p = [node XMLNode]->prev;
	if (p==NULL) 
	{
		return nil;
	}
	GDataXMLNode* sibling = [GDataXMLNode nodeBorrowingXMLNode:p];
	return [self makeNode:sibling context:[self executionContext]];
}

-(id)nextSibling
{
	xmlNodePtr p = [node XMLNode]->next;
	if (p==NULL) 
	{
		return nil;
	}
	GDataXMLNode* sibling = [GDataXMLNode nodeBorrowingXMLNode:p];
	return [self makeNode:sibling context:[self executionContext]];
}

-(id)attributes
{
	TiDOMNamedNodeMapProxy *proxy = [[[TiDOMNamedNodeMapProxy alloc] _initWithPageContext:[self pageContext]] autorelease];
	[proxy setDocument:[self document]];
	[proxy setElement:(GDataXMLElement*)node];
	return proxy;
}

-(id)ownerDocument
{
	xmlDocPtr p = [node XMLNode]->doc;
	if (p==nil) 
	{
		return nil;
	}
	GDataXMLDocument *doc = [[[GDataXMLDocument alloc] initWithDocument:xmlCopyDoc(p, 1)] autorelease];
	TiDOMDocumentProxy *proxy = [[[TiDOMDocumentProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
	[proxy setDocument:doc];
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
}

-(id)isSupported:(id)args
{
	return NUMBOOL(NO);
}

-(id)namespaceURI
{
	return [node URI];
}

-(id)prefix
{
	return [node prefix];
}

-(id)localName
{
	return [node localName];
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
	return NUMINT(realNodeType);
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