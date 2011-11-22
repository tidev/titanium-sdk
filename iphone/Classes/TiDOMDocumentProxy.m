/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TiDOMDocumentProxy.h"
#import "TiDOMNodeProxy.h"
#import "TiDOMNodeListProxy.h"
#import "TiDOMTextNodeProxy.h"
#import "TiDOMElementProxy.h"
#import "TiDOMAttrProxy.h"
#import "TiDOMCDATANodeProxy.h"
#import "TiDOMCommentProxy.h"
#import "TiDOMPIProxy.h"
#import "TiDOMDocFragProxy.h"
#import "TIDOMDOMImplementationProxy.h"
#import "TIDOMDocumentTypeProxy.h"
#import "TiDOMEntityRefProxy.h"
#import "TiUtils.h"

@implementation TiDOMDocumentProxy

#pragma mark internal

-(void)dealloc
{
	if ( [document docNode] != NULL )
	{
		//Ensure that docNode is removed from nodeRegistry
		[TiDOMNodeProxy removeNodeForXMLNode:(xmlNodePtr)[document docNode]];
	}
	[super dealloc];
}

-(BOOL)equals:(id)value
{
	if ([value isKindOfClass:[TiDOMDocumentProxy class]])
	{
		return [value isEqual:self];
	}
	return NO;
}

-(void)parseString:(NSString*)xml
{
	NSError *error = nil;
	GDataXMLDocument * ourDocument = [[GDataXMLDocument alloc] initWithXMLString:xml options:0 error:&error];
	if (!error) {
		[self setNode:[ourDocument rootElement]];
		[self setDocument:ourDocument];
		xmlDocPtr docPtr = [ourDocument docNode];
		[TiDOMNodeProxy setNode:self forXMLNode:(xmlNodePtr)docPtr];
		[ourDocument release];
	} else {
		[ourDocument release];
		[self throwException:[error description] subreason:nil location:CODELOCATION];
	}
}

#pragma mark Public APIs

-(id)nodeValue
{
	// DOM spec says nodeValue for document must return null
	return [NSNull null];
}

-(TiDOMAttrProxy *)createAttribute:(id)args
{
	ENSURE_ARG_COUNT(args, 1);
	NSString * tagName = nil;
	ENSURE_ARG_AT_INDEX(tagName, args, 0, NSString);
	id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];

	TiDOMAttrProxy *result = [[[TiDOMAttrProxy alloc] _initWithPageContext:context] autorelease];
	GDataXMLNode* resultNode = (GDataXMLNode*)[GDataXMLElement attributeWithName:tagName stringValue:@""];
	[result setDocument:[self document]];
	[result setNode:resultNode];
	[result setAttribute:tagName value:@"" owner:nil];
	[result setIsSpecified:NO];
	[TiDOMNodeProxy setNode:result forXMLNode:[resultNode XMLNode]];
	return result;
}

-(TiDOMAttrProxy *)createAttributeNS:(id)args
{
	ENSURE_ARG_COUNT(args, 2);
    NSObject* obj1 = nil;
    NSObject* obj2 = nil;
    NSString * theURI = nil;
	NSString * tagName = nil;
    
	ENSURE_ARG_AT_INDEX(obj1, args, 0, NSObject);
	ENSURE_ARG_AT_INDEX(obj2, args, 1, NSObject);
    
    theURI = [TiUtils stringValue:obj1];
    tagName = [TiUtils stringValue:obj2];
	
    if (tagName == nil)
    {
        [self throwException:@"could not create attribute with null qualified name" subreason:nil location:CODELOCATION];
        return nil;
    }
	id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
    
	TiDOMAttrProxy *result = [[[TiDOMAttrProxy alloc] _initWithPageContext:context] autorelease];
    //THIS WILL NOT WORK UNTIL ADD CHILD IS CALLED SO CREATE A NAMESPACE POINTER AND SET IT EXPLICITLY
    //GDataXMLNode* resultNode = (GDataXMLNode*)[GDataXMLElement attributeWithName:tagName URI:theURI stringValue:@""];
    NSString* prefix = [GDataXMLNode prefixForName:tagName];
    NSString* localName = [GDataXMLNode localNameForName:tagName];
	GDataXMLNode* resultNode = (GDataXMLNode*)[GDataXMLElement attributeWithName:localName stringValue:@""];
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
    [result setDocument:[self document]];
    [result setNode:resultNode];
    [result setAttribute:tagName value:@"" owner:nil];
    [result setIsSpecified:NO];
    [TiDOMNodeProxy setNode:result forXMLNode:[resultNode XMLNode]];
    return result;
}

-(TiDOMCDATANodeProxy *)createCDATASection:(id)args
{
    ENSURE_ARG_COUNT(args, 1);
	NSString * textData = nil;
	ENSURE_ARG_AT_INDEX(textData, args, 0, NSString);
	id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
	TiDOMCDATANodeProxy * result = [[[TiDOMCDATANodeProxy alloc] _initWithPageContext:context] autorelease];
	GDataXMLNode * resultElement = [GDataXMLNode textWithStringValue:textData];
	[resultElement XMLNode]->type = XML_CDATA_SECTION_NODE;
	[result setDocument:[self document]];
	[result setNode:resultElement];
	[TiDOMNodeProxy setNode:result forXMLNode:[resultElement XMLNode]];
	return result;
}
-(TiDOMCommentProxy *)createComment:(id)args
{
    ENSURE_ARG_COUNT(args, 1);
	NSString * textData = nil;
	ENSURE_ARG_AT_INDEX(textData, args, 0, NSString);
	id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
	TiDOMCommentProxy * result = [[[TiDOMCommentProxy alloc] _initWithPageContext:context] autorelease];
	GDataXMLNode* resultElement = [GDataXMLNode commentWithStringValue:textData];
	[result setDocument:[self document]];
	[result setNode:resultElement];
	[TiDOMNodeProxy setNode:result forXMLNode:[resultElement XMLNode]];
	return result;
}

-(TiDOMDocFragProxy *)createDocumentFragment:(id)args
{
	id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];

	TiDOMDocFragProxy *result = [[[TiDOMDocFragProxy alloc] _initWithPageContext:context] autorelease];
	GDataXMLNode* resultElement = [GDataXMLNode createNewDocFragment];
	[result setDocument:[self document]];
	[result setNode:resultElement];
	[TiDOMNodeProxy setNode:result forXMLNode:[resultElement XMLNode]];
	return result;
}

-(TiDOMElementProxy *)createElement:(id)args
{
	ENSURE_ARG_COUNT(args, 1);
	NSString * tagName = nil;
	ENSURE_ARG_AT_INDEX(tagName, args, 0, NSString);
    
	id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
	TiDOMElementProxy * result = [[[TiDOMElementProxy alloc] _initWithPageContext:context] autorelease];
	GDataXMLElement * resultElement = [GDataXMLElement elementWithName:tagName];
	[result setDocument:[self document]];
	[result setElement:resultElement];
	[TiDOMNodeProxy setNode:result forXMLNode:[resultElement XMLNode]];
	return result;
}

-(TiDOMElementProxy *)createElementNS:(id)args
{
	ENSURE_ARG_COUNT(args, 2);
    NSObject* obj1 = nil;
    NSObject* obj2 = nil;

	ENSURE_ARG_AT_INDEX(obj1, args, 0, NSObject);
	ENSURE_ARG_AT_INDEX(obj2, args, 1, NSObject);
    
    NSString* theURI = [TiUtils stringValue:obj1];
    NSString* tagName = [TiUtils stringValue:obj2];
    
    if (tagName == nil)
    {
        [self throwException:@"could not create element with null qualified name" subreason:nil location:CODELOCATION];
        return nil;
    }
    
	id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
	TiDOMElementProxy * result = [[[TiDOMElementProxy alloc] _initWithPageContext:context] autorelease];
    //THIS WILL NOT WORK UNTIL ADD CHILD IS CALLED SO CREATE A NAMESPACE POINTER AND SET IT EXPLICITLY
    //GDataXMLElement * resultElement = [GDataXMLElement elementWithName:tagName URI:theURI];
	NSString* prefix = [GDataXMLNode prefixForName:tagName];
	NSString* localName = [GDataXMLNode localNameForName:tagName];
	GDataXMLElement * resultElement = [GDataXMLElement elementWithName:localName];
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
	[resultElement XMLNode]->ns = theNewNs;
	[result setDocument:[self document]];
	[result setElement:resultElement];
	[TiDOMNodeProxy setNode:result forXMLNode:[resultElement XMLNode]];
	return result;
}

-(TiDOMEntityRefProxy*)createEntityReference:(id)args
{
    ENSURE_ARG_COUNT(args, 1);
	NSString * tagName = nil;
	ENSURE_ARG_AT_INDEX(tagName, args, 0, NSString);
    
	id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
	TiDOMEntityRefProxy * result = [[[TiDOMEntityRefProxy alloc] _initWithPageContext:context] autorelease];
	GDataXMLNode* resultElement = [[self document]entityRefForName:tagName];
	[result setNode:resultElement];
	[result setDocument:[self document]];
	[TiDOMNodeProxy setNode:result forXMLNode:[resultElement XMLNode]];
	return result;
}

-(TiDOMPIProxy *)createProcessingInstruction:(id)args
{
	ENSURE_ARG_COUNT(args, 2);
	NSString * theTarget = nil;
	NSString * theData = nil;
	ENSURE_ARG_AT_INDEX(theTarget, args, 0, NSString);
	ENSURE_ARG_AT_INDEX(theData, args, 1, NSString);
	id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
	TiDOMPIProxy * result = [[[TiDOMPIProxy alloc] _initWithPageContext:context] autorelease];
	GDataXMLNode* resultElement = [GDataXMLNode processingInstructionWithTarget:theTarget andData:theData];
	[result setDocument:[self document]];
	[result setNode:resultElement];
	[TiDOMNodeProxy setNode:result forXMLNode:[resultElement XMLNode]];
	return result;
}

-(TiDOMTextNodeProxy *)createTextNode:(id)args
{
	ENSURE_ARG_COUNT(args, 1);
	NSString * textData = nil;
	ENSURE_ARG_AT_INDEX(textData, args, 0, NSString);
	id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
	TiDOMTextNodeProxy * result = [[[TiDOMTextNodeProxy alloc] _initWithPageContext:context] autorelease];
	GDataXMLNode * resultElement = [GDataXMLNode textWithStringValue:textData];
	[result setDocument:[self document]];
	[result setNode:resultElement];
	[TiDOMNodeProxy setNode:result forXMLNode:[resultElement XMLNode]];
	return result;
}

-(id)documentElement
{
	GDataXMLElement *root = [[self document] rootElement];
	id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
	return [self makeNode:root context:context];
}

-(id)doctype
{
    xmlDtdPtr resultPtr = [[self document]intDTD];
    
    if(resultPtr != nil)
    {
        id result = [TiDOMNodeProxy nodeForXMLNode:(xmlNodePtr)resultPtr];
        if (result != nil) 
        {
            return result;
        }
        id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
        TIDOMDocumentTypeProxy * proxy = [[[TIDOMDocumentTypeProxy alloc] _initWithPageContext:context] autorelease];
        [proxy setDocument:[self document]];
        [proxy setNode:[GDataXMLNode nodeBorrowingXMLNode:(xmlNodePtr)resultPtr]];
        [TiDOMNodeProxy setNode:proxy forXMLNode:(xmlNodePtr)resultPtr];
        return proxy;
    }
    return [NSNull null];
}

-(id)implementation
{
	id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
	TIDOMDOMImplementation * result = [[[TIDOMDOMImplementation alloc] _initWithPageContext:context] autorelease];
	return result;
}

-(id)getElementById:(id)args
{
	ENSURE_SINGLE_ARG(args,NSString);
	NSError *error = nil;
	NSArray *nodes = [[self document] nodesForXPath:[NSString stringWithFormat:@"//*[@id='%@']",args] error:&error];
	if (error==nil && nodes!=nil && [nodes count]>0)
	{
		id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
		return [self makeNode: [nodes objectAtIndex: 0] context:context];
	}
	return [NSNull null];
}

-(id)getElementsByTagName:(id)args
{
    ENSURE_SINGLE_ARG(args,NSString);
	NSError *error = nil;
	NSString *xpath = [NSString stringWithFormat:@"//*[local-name()='%@']",args];
	// see if it's a namespace
	NSRange range = [args rangeOfString:@":"];
	if (range.location!=NSNotFound)
	{
		xpath = [NSString stringWithFormat:@"//*[name()='%@']",args];
	}
	NSArray *nodes = [document nodesForXPath:xpath error:&error];
    if(error == nil)
    {
        id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
        TiDOMNodeListProxy *proxy = [[[TiDOMNodeListProxy alloc] _initWithPageContext:context] autorelease];
		[proxy setDocument:[self document]];
		[proxy setNodes:nodes];
		return proxy;
	}
	if (error!=nil)
	{
		[self throwException:[error description] subreason:nil location:CODELOCATION];
	}
	return [NSNull null];
}

-(id)getElementsByTagNameNS:(id)args
{
    ENSURE_ARG_COUNT(args, 2);
    NSString * theURI = nil;
	NSString * localName = nil;
	ENSURE_ARG_AT_INDEX(theURI, args, 0, NSString);
	ENSURE_ARG_AT_INDEX(localName, args, 1, NSString);

	NSError *error = nil;
    //PARAMETER IS SPECIFIED AS LOCAL NAME
	NSString *xpath = [NSString stringWithFormat:@"//*[local-name()='%@' and namespace-uri()='%@']",localName, theURI];


    NSArray *nodes = [document nodesForXPath:xpath error:&error];
	if(error == nil)
    {
        id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
        TiDOMNodeListProxy *proxy = [[[TiDOMNodeListProxy alloc] _initWithPageContext:context] autorelease];
		[proxy setDocument:[self document]];
		[proxy setNodes:nodes];
        return proxy;
    }
    else
    {
        [self throwException:[error description] subreason:nil location:CODELOCATION];
        return nil;
    } 

}

-(id)importNode:(id)args
{
    ENSURE_ARG_COUNT(args, 2);
    TiDOMNodeProxy* theNodeToImport = nil;
    NSNumber* recursive = nil;
    ENSURE_ARG_AT_INDEX(theNodeToImport, args, 0, TiDOMNodeProxy);
    ENSURE_ARG_AT_INDEX(recursive, args, 1, NSNumber);
    
    BOOL deep = [TiUtils boolValue:recursive];
    
    if(theNodeToImport != nil)
    {
        xmlElementType type = [[theNodeToImport node ]XMLNode]->type;
        if( (type == XML_DOCUMENT_NODE) || (type == XML_DOCUMENT_TYPE_NODE) )
        {
            [self throwException:@"document/documenttype nodes can not be imported" subreason:nil location:CODELOCATION];
            return nil;
        }
        GDataXMLNode* resultElemet = [[self document]importNode:[theNodeToImport node] recursive:deep];
        id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
        return [self makeNode:resultElemet context:context];
    }
    return nil;
}

-(id)evaluate:(id)args
{
	ENSURE_SINGLE_ARG(args,NSString);
	NSError *error = nil;
	NSArray *nodes = [[self document] nodesForXPath:args error:&error];
	if (error==nil)
	{
		id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
		TiDOMNodeListProxy *proxy = [[[TiDOMNodeListProxy alloc] _initWithPageContext:context] autorelease];
		[proxy setDocument:[self document]];
		[proxy setNodes:nodes];
		return proxy;
	}
	return [NSNull null];
}

@end

#endif