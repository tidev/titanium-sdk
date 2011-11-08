/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TiProxy.h"
#import "GDataXMLNode.h"

@interface TiDOMNodeProxy : TiProxy {
@protected
	GDataXMLNode *node;
	GDataXMLDocument *document;
}

@property(nonatomic,retain) GDataXMLNode *node;
@property(nonatomic,retain)	GDataXMLDocument *document;

-(NSString *)XMLString;
-(id)makeNode:(id)child context:(id<TiEvaluator>)context;
+(id)makeNode:(id)child context:(id<TiEvaluator>)context;

@property(nonatomic,readonly) id nodeName;
@property(nonatomic,copy,readwrite) id nodeValue;
@property(nonatomic,readonly) id nodeType;

@property(nonatomic,readonly) id text;

@property(nonatomic,readonly) id parentNode;
@property(nonatomic,readonly) id childNodes;
@property(nonatomic,readonly) id firstChild;
@property(nonatomic,readonly) id lastChild;
@property(nonatomic,readonly) id previousSibling;
@property(nonatomic,readonly) id nextSibling;
@property(nonatomic,readonly) id attributes;
@property(nonatomic,readonly) id ownerDocument;

@property(nonatomic,readonly) id namespaceURI;
@property(nonatomic,readonly) id prefix;
@property(nonatomic,readonly) id localName;

@property(nonatomic,readonly) NSNumber *ELEMENT_NODE;
@property(nonatomic,readonly) NSNumber *ATTRIBUTE_NODE;
@property(nonatomic,readonly) NSNumber *TEXT_NODE;
@property(nonatomic,readonly) NSNumber *CDATA_SECTION_NODE;
@property(nonatomic,readonly) NSNumber *ENTITY_REFERENCE_NODE;
@property(nonatomic,readonly) NSNumber *ENTITY_NODE;
@property(nonatomic,readonly) NSNumber *PROCESSING_INSTRUCTION_NODE;
@property(nonatomic,readonly) NSNumber *COMMENT_NODE;
@property(nonatomic,readonly) NSNumber *DOCUMENT_NODE;
@property(nonatomic,readonly) NSNumber *DOCUMENT_TYPE_NODE;
@property(nonatomic,readonly) NSNumber *DOCUMENT_FRAGMENT_NODE;
@property(nonatomic,readonly) NSNumber *NOTATION_NODE;

@end

#endif