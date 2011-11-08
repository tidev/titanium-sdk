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
	if (error!=nil)
	{
		[ourDocument release];
		[self throwException:[error description] subreason:nil location:CODELOCATION];
	}
    [self setNode:[ourDocument rootElement]];
    //[self setElement:[ourDocument rootElement]];
	[self setDocument:ourDocument];
	[ourDocument release];
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
	NSString * tagName;
	ENSURE_ARG_AT_INDEX(tagName, args, 0, NSString);
    
    TiDOMAttrProxy *result = [[[TiDOMAttrProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
    GDataXMLNode* resultNode = (GDataXMLNode*)[GDataXMLElement attributeWithName:tagName stringValue:@""];
    [result setDocument:[self document]];
    [result setNode:resultNode];
    [result setAttribute:tagName value:@"" owner:nil];
    [result setIsSpecified:NO];
    return result;
}

-(TiDOMAttrProxy *)createAttributeNS:(id)args
{
	ENSURE_ARG_COUNT(args, 2);
    NSObject* obj1;
    NSObject* obj2;
    NSString * theURI;
	NSString * tagName;
    
	ENSURE_ARG_AT_INDEX(obj1, args, 0, NSObject);
	ENSURE_ARG_AT_INDEX(obj2, args, 1, NSObject);
    
    if([obj1 isKindOfClass:[NSNull class]])
        theURI = nil;
    else
        theURI = (NSString*)obj1;
    
    if([obj2 isKindOfClass:[NSNull class]])
    {
        [self throwException:@"could not create attribute with null qualified name" subreason:nil location:CODELOCATION];
        return nil;
    }
    else
        tagName = (NSString*)obj2;
    
    
	TiDOMAttrProxy *result = [[[TiDOMAttrProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
    //THIS WILL NOT WORK UNTIL ADD CHILD IS CALLED SO CREATE A NAMESPACE POINTER AND SET IT EXPLICITLY
    //GDataXMLNode* resultNode = (GDataXMLNode*)[GDataXMLElement attributeWithName:tagName URI:theURI stringValue:@""];
    NSString* prefix = [GDataXMLNode prefixForName:tagName];
    NSString* localName = [GDataXMLNode localNameForName:tagName];
	GDataXMLNode* resultNode = (GDataXMLNode*)[GDataXMLElement attributeWithName:localName stringValue:@""];
    xmlChar *href;
	xmlChar *pre;
    
    if(theURI != nil)
        href = (xmlChar*)[theURI UTF8String];
    else
        href = NULL;
	
	if (prefix != nil && ([prefix length] > 0)) {
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
    return result;
}

-(TiDOMCDATANodeProxy *)createCDATASection:(id)args
{
    ENSURE_ARG_COUNT(args, 1);
	NSString * textData;
	ENSURE_ARG_AT_INDEX(textData, args, 0, NSString);
    TiDOMCDATANodeProxy * result = [[[TiDOMCDATANodeProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
    GDataXMLNode * resultElement = [GDataXMLNode textWithStringValue:textData];
    [resultElement XMLNode]->type = XML_CDATA_SECTION_NODE;
    [result setDocument:[self document]];
	[result setNode:resultElement];
	return result;
}
-(TiDOMCommentProxy *)createComment:(id)args
{
    ENSURE_ARG_COUNT(args, 1);
	NSString * textData;
	ENSURE_ARG_AT_INDEX(textData, args, 0, NSString);
    TiDOMCommentProxy * result = [[[TiDOMCommentProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
    GDataXMLNode* resultElement = [GDataXMLNode commentWithStringValue:textData];
    [result setDocument:[self document]];
	[result setNode:resultElement];
	return result;
}

-(TiDOMDocFragProxy *)createDocumentFragment:(id)args
{
    TiDOMDocFragProxy *result = [[[TiDOMDocFragProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
    GDataXMLNode* resultElement = [GDataXMLNode createNewDocFragment];
    [result setDocument:nil];
	[result setNode:resultElement];
	return result;
}

-(TiDOMElementProxy *)createElement:(id)args
{
	ENSURE_ARG_COUNT(args, 1);
	NSString * tagName;
	ENSURE_ARG_AT_INDEX(tagName, args, 0, NSString);
    
	TiDOMElementProxy * result = [[[TiDOMElementProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
	GDataXMLElement * resultElement = [GDataXMLElement elementWithName:tagName];
	[result setDocument:[self document]];
	[result setElement:resultElement];
	return result;
}

-(TiDOMElementProxy *)createElementNS:(id)args
{
	ENSURE_ARG_COUNT(args, 2);
    NSObject* obj1;
    NSObject* obj2;
    NSString * theURI;
	NSString * tagName;

	ENSURE_ARG_AT_INDEX(obj1, args, 0, NSObject);
	ENSURE_ARG_AT_INDEX(obj2, args, 1, NSObject);
    
    if([obj1 isKindOfClass:[NSNull class]])
        theURI = nil;
    else
        theURI = (NSString*)obj1;
    
    if([obj2 isKindOfClass:[NSNull class]])
    {
        [self throwException:@"could not create element with null qualified name" subreason:nil location:CODELOCATION];
        return nil;
    }
    else
        tagName = (NSString*)obj2;
    
    TiDOMElementProxy * result = [[[TiDOMElementProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
    //THIS WILL NOT WORK UNTIL ADD CHILD IS CALLED SO CREATE A NAMESPACE POINTER AND SET IT EXPLICITLY
    //GDataXMLElement * resultElement = [GDataXMLElement elementWithName:tagName URI:theURI];
    NSString* prefix = [GDataXMLNode prefixForName:tagName];
    NSString* localName = [GDataXMLNode localNameForName:tagName];
	GDataXMLElement * resultElement = [GDataXMLElement elementWithName:localName];
    xmlChar *href;
	xmlChar *pre;
    
    if(theURI != nil)
        href = (xmlChar*)[theURI UTF8String];
    else
        href = NULL;
	
	if (prefix != nil && ([prefix length] > 0)) {
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
	return result;
}

-(TiDOMEntityRefProxy*)createEntityReference:(id)args
{
    ENSURE_ARG_COUNT(args, 1);
	NSString * tagName;
	ENSURE_ARG_AT_INDEX(tagName, args, 0, NSString);
    
    TiDOMEntityRefProxy * result = [[[TiDOMEntityRefProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
    GDataXMLNode* resultElement = [[self document]entityRefForName:tagName];
    [result setNode:resultElement];
    [result setDocument:[self document]];
    return result;
}

-(TiDOMPIProxy *)createProcessingInstruction:(id)args
{
    ENSURE_ARG_COUNT(args, 2);
    NSString * theTarget;
	NSString * theData;
	ENSURE_ARG_AT_INDEX(theTarget, args, 0, NSString);
	ENSURE_ARG_AT_INDEX(theData, args, 1, NSString);
    TiDOMPIProxy * result = [[[TiDOMPIProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
    GDataXMLNode* resultElement = [GDataXMLNode processingInstructionWithTarget:theTarget andData:theData];
    [result setDocument:[self document]];
	[result setNode:resultElement];
	return result;
}

-(TiDOMTextNodeProxy *)createTextNode:(id)args
{
	ENSURE_ARG_COUNT(args, 1);
	NSString * textData;
	ENSURE_ARG_AT_INDEX(textData, args, 0, NSString);
	TiDOMTextNodeProxy * result = [[[TiDOMTextNodeProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
	GDataXMLNode * resultElement = [GDataXMLNode textWithStringValue:textData];
    [result setDocument:[self document]];
	[result setNode:resultElement];
	return result;
}

-(id)documentElement
{
	GDataXMLElement *root = [[self document] rootElement];
	return [self makeNode:root context:[self executionContext]];
}

-(id)doctype
{
    xmlDtdPtr resultPtr = [[self document]getIntDTD];
    
    if(resultPtr != nil)
    {
        TIDOMDocumentTypeProxy * result = [[[TIDOMDocumentTypeProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
        [result setDocument:[self document]];
        [result setNode:[GDataXMLNode nodeConsumingXMLNode:(xmlNodePtr)resultPtr]];
        return result;
    }
    return [NSNull null];
}

-(id)implementation
{
	TIDOMDOMImplementation * result = [[[TIDOMDOMImplementation alloc] _initWithPageContext:[self executionContext]] autorelease];
    return result;
}

-(id)getElementById:(id)args
{
	ENSURE_SINGLE_ARG(args,NSString);
	NSError *error = nil;
	NSArray *nodes = [[self document] nodesForXPath:[NSString stringWithFormat:@"//*[@id='%@']",args] error:&error];
	if (error==nil && nodes!=nil && [nodes count]>0)
	{
		return [self makeNode: [nodes objectAtIndex: 0] context:[self executionContext]];
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
        TiDOMNodeListProxy *proxy = [[[TiDOMNodeListProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
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

-(id)getElementsByTagNameNS:(id)args
{
    ENSURE_ARG_COUNT(args, 2);
    NSString * theURI;
	NSString * localName;
	ENSURE_ARG_AT_INDEX(theURI, args, 0, NSString);
	ENSURE_ARG_AT_INDEX(localName, args, 1, NSString);

	NSError *error = nil;
    //PARAMETER IS SPECIFIED AS LOCAL NAME
	NSString *xpath = [NSString stringWithFormat:@"//*[local-name()='%@' and namespace-uri()='%@']",localName, theURI];


    NSArray *nodes = [document nodesForXPath:xpath error:&error];
	if(error == nil)
    {
        TiDOMNodeListProxy *proxy = [[[TiDOMNodeListProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
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
    TiDOMNodeProxy* theNodeToImport;
    NSNumber* recursive;
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
        return [self makeNode:resultElemet context:[self executionContext]];
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
		TiDOMNodeListProxy *proxy = [[[TiDOMNodeListProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
		[proxy setDocument:[self document]];
		[proxy setNodes:nodes];
		return proxy;
	}
	return [NSNull null];
}

//Override isEqual and hash Methods
/*
- (BOOL)isEqual:(id)anObject
{
    if( [anObject isKindOfClass:[TiDOMDocumentProxy class]] )
    {
        return [document isEqual:[anObject document]];
    }
    else
        return NO;
}

- (NSUInteger)hash
{
    if(document == nil)
        return [super hash];
    else
        return [document hash];
}
*/

@end

#endif