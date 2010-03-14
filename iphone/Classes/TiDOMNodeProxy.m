/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiDOMNodeProxy.h"
#import "TiDOMElementProxy.h"
#import "TiDOMNamedNodeMapProxy.h"
#import "TiDOMNodeListProxy.h"
#import "TiDOMAttrProxy.h"

@implementation TiDOMNodeProxy

#pragma mark Internal

-(void)dealloc
{
	RELEASE_TO_NIL(node);
	[super dealloc];
}

-(void)setNode:(GDataXMLNode*)node_
{
	RELEASE_TO_NIL(node);
	node = [node_ retain];
}

+(id)makeNode:(id)child context:(id<TiEvaluator>)context
{
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
			//[proxy setAttribute:name value:value owner:element];
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
	//TODO:
	return nil;
}

-(id)childNodes
{
	NSMutableArray *children = [NSMutableArray array];
	for (GDataXMLNode* child in [node children])
	{
		[children addObject:[TiDOMNodeProxy makeNode:child context:[self pageContext]]];
	}
	TiDOMNodeListProxy *proxy = [[[TiDOMNodeListProxy alloc] _initWithPageContext:[self pageContext]] autorelease];
	[proxy setNodes:children];
	return proxy;
}

-(id)firstChild
{
	int count = [node childCount];
	if (count == 0) return nil;
	id child = [node childAtIndex:0];
	return [TiDOMNodeProxy makeNode:child context:[self pageContext]];
}

-(id)lastChild
{
	int count = [node childCount];
	if (count == 0) return nil;
	id child = [node childAtIndex:count-1];
	return [TiDOMNodeProxy makeNode:child context:[self pageContext]];
}

-(id)previousSibling
{
	//TODO:
	return nil;
}

-(id)nextSibling
{
	//TODO:
	return nil;
}

-(id)attributes
{
	TiDOMNamedNodeMapProxy *proxy = [[[TiDOMNamedNodeMapProxy alloc] _initWithPageContext:[self pageContext]] autorelease];
	[proxy setElement:(GDataXMLElement*)node];
	return proxy;
}

-(id)ownerDocument
{
	//TODO:
	return nil;
}

-(id)insertBefore:(id)args
{
	//TODO:
	return nil;
}

-(id)replaceChild:(id)args
{
	//TODO:
	return nil;
}

-(id)removeChild:(id)args
{
	//TODO:
	return nil;
}

-(id)appendChild:(id)args
{
	//TODO:
	return nil;
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
	switch ([node kind])
	{
		case GDataXMLDocumentKind:
		{
			return NUMINT(9);
		}
		case GDataXMLElementKind:
		{
			return NUMINT(1);
		}
		case GDataXMLAttributeKind:
		{
			return NUMINT(2);
		}
		case GDataXMLNamespaceKind:
		{
			return NUMINT(7);
		}
		case GDataXMLProcessingInstructionKind:
		{
			return NUMINT(6);
		}
		case GDataXMLCommentKind:
		{
			return NUMINT(8);
		}
		case GDataXMLTextKind:
		{
			return NUMINT(3);
		}
		case GDataXMLDTDKind:
		{
			return NUMINT(10);
		}
		case GDataXMLEntityDeclarationKind:
		{
			return NUMINT(6);
		}
		case GDataXMLAttributeDeclarationKind:
		{
			return NUMINT(2);
		}
		case GDataXMLElementDeclarationKind:
		{
			return NUMINT(1);
		}
		case GDataXMLNotationDeclarationKind:
		{
			return NUMINT(12);
		}
	}
	return NUMINT(0);
}

MAKE_SYSTEM_PROP(ELEMENT_NODE,1);
MAKE_SYSTEM_PROP(ATTRIBUTE_NODE,2);
MAKE_SYSTEM_PROP(TEXT_NODE,3);
MAKE_SYSTEM_PROP(CDATA_SECTION_NODE,4);
MAKE_SYSTEM_PROP(ENTITY_REFERENCE_NODE,5);
MAKE_SYSTEM_PROP(ENTITY_NODE,6);
MAKE_SYSTEM_PROP(PROCESSING_INSTRUCTION_NODE,7);
MAKE_SYSTEM_PROP(COMMENT_NODE,8);
MAKE_SYSTEM_PROP(DOCUMENT_NODE,9);
MAKE_SYSTEM_PROP(DOCUMENT_TYPE_NODE,10);
MAKE_SYSTEM_PROP(DOCUMENT_FRAGMENT_NODE,11);
MAKE_SYSTEM_PROP(NOTATION_NODE,12);


@end
