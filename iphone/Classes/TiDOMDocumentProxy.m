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
#import "TiDOMValidator.h"

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
	if (error!=nil)
	{
		[ourDocument release];
		[self throwException:[error description] subreason:nil location:CODELOCATION];
	}
    [self setNode:[ourDocument rootElement]];
	[self setDocument:ourDocument];
    xmlDocPtr docPtr = [ourDocument docNode];
    [TiDOMNodeProxy setNode:self forXMLNode:(xmlNodePtr)docPtr];
	[ourDocument release];
}

#pragma mark Public APIs

-(id)nodeValue
{
	// DOM spec says nodeValue for document must return null
	return [NSNull null];
}

-(id)createAttribute:(id)args
{
	ENSURE_ARG_COUNT(args, 1);
	NSString * tagName;
	ENSURE_ARG_AT_INDEX(tagName, args, 0, NSString);
	//Check name validity
	if (![TiDOMValidator checkAttributeName:tagName]) {
		[self throwException:@"Invalid attribute name" subreason:[NSString stringWithFormat:@"Offending tagName %@",tagName] location:CODELOCATION];
		return [NSNull null];
	}
	
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

-(id)createAttributeNS:(id)args
{
	ENSURE_ARG_COUNT(args, 2);

	NSString * theURI;
	NSString * tagName;
    
	ENSURE_ARG_OR_NIL_AT_INDEX(theURI, args, 0, NSString);
	ENSURE_ARG_AT_INDEX(tagName, args, 1, NSString);
    
	//THIS WILL NOT WORK UNTIL ADD CHILD IS CALLED SO CREATE A NAMESPACE POINTER AND SET IT EXPLICITLY
	//GDataXMLNode* resultNode = (GDataXMLNode*)[GDataXMLElement attributeWithName:tagName URI:theURI stringValue:@""];
	NSString* prefix = [GDataXMLNode prefixForName:tagName];
	NSString* localName = [GDataXMLNode localNameForName:tagName];
	
	if (![[tagName lowercaseString] isEqualToString:@"xmlns"]) {
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
			[self throwException:@"Invalid URI for qualified name xmlns" subreason:[NSString stringWithFormat:@"%@:%@",tagName,theURI] location:CODELOCATION];
			return [NSNull null];
		}
	}
	

	id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
    
	TiDOMAttrProxy *result = [[[TiDOMAttrProxy alloc] _initWithPageContext:context] autorelease];
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
	NSString * textData;
	ENSURE_ARG_AT_INDEX(textData, args, 0, NSString);
	id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
	TiDOMCDATANodeProxy * result = [[[TiDOMCDATANodeProxy alloc] _initWithPageContext:context] autorelease];
	GDataXMLNode * resultElement = [GDataXMLNode cDataSectionWithStringValue:textData];
	[result setDocument:[self document]];
	[result setNode:resultElement];
	[TiDOMNodeProxy setNode:result forXMLNode:[resultElement XMLNode]];
	return result;
}
-(TiDOMCommentProxy *)createComment:(id)args
{
    ENSURE_ARG_COUNT(args, 1);
	NSString * textData;
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

-(id)createElement:(id)args
{
	ENSURE_ARG_COUNT(args, 1);
	NSString * tagName;
	ENSURE_ARG_AT_INDEX(tagName, args, 0, NSString);
    
	if (![TiDOMValidator checkElementName:tagName]) {
		[self throwException:@"Invalid element name" subreason:[NSString stringWithFormat:@"Offending tagName %@",tagName] location:CODELOCATION];
		return [NSNull null];
	}
	id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
	TiDOMElementProxy * result = [[[TiDOMElementProxy alloc] _initWithPageContext:context] autorelease];
	GDataXMLElement * resultElement = [GDataXMLElement elementWithName:tagName];
	[result setDocument:[self document]];
	[result setElement:resultElement];
	[TiDOMNodeProxy setNode:result forXMLNode:[resultElement XMLNode]];
	return result;
}

-(id)createElementNS:(id)args
{
	ENSURE_ARG_COUNT(args, 2);

	NSString * theURI;
	NSString * tagName;

	ENSURE_ARG_OR_NIL_AT_INDEX(theURI, args, 0, NSString);
	ENSURE_ARG_AT_INDEX(tagName, args, 1, NSString);
    
	//THIS WILL NOT WORK UNTIL ADD CHILD IS CALLED SO CREATE A NAMESPACE POINTER AND SET IT EXPLICITLY
	//GDataXMLElement * resultElement = [GDataXMLElement elementWithName:tagName URI:theURI];
	NSString* prefix = [GDataXMLNode prefixForName:tagName];
	NSString* localName = [GDataXMLNode localNameForName:tagName];

	//Check name validity
	if (![TiDOMValidator checkAttributeName:localName]) {
		[self throwException:@"Invalid element name" subreason:[NSString stringWithFormat:@"Offending localName %@",localName] location:CODELOCATION];
		return [NSNull null];
	}
		
	if (prefix != nil && ([theURI length]==0) ) {
		[self throwException:@"Can not have a prefix with a nil or empty URI" subreason:[NSString stringWithFormat:@"%@:%@",prefix,theURI] location:CODELOCATION];
		return [NSNull null];
	}
		
	if ( [prefix isEqualToString:@"xml"] ) {
		if (![theURI isEqualToString:@"http://www.w3.org/XML/1998/namespace"]) {
			[self throwException:@"Invalid URI for prefix xml" subreason:[NSString stringWithFormat:@"%@:%@",prefix,theURI] location:CODELOCATION];
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
		
	
	id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
	TiDOMElementProxy * result = [[[TiDOMElementProxy alloc] _initWithPageContext:context] autorelease];
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
	NSString * tagName;
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
	NSString * theTarget;
	NSString * theData;
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
	NSString * textData;
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
        return [TiDOMNodeListProxy makeNodeListProxyFromArray:nodes document:[self document] context:context];
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
        id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
        return [TiDOMNodeListProxy makeNodeListProxyFromArray:nodes document:[self document] context:context];
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
		return [TiDOMNodeListProxy makeNodeListProxyFromArray:nodes document:[self document] context:context];
	}
	return [NSNull null];
}

@end

#endif