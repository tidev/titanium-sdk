/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TIDOMDOMImplementationProxy.h"
#import "TIDOMDocumentTypeProxy.h"
#import "TiDOMDocumentProxy.h"
#import "TiUtils.h"


@implementation TIDOMDOMImplementation

-(id)hasFeature:(id)args
{
	ENSURE_ARG_COUNT(args, 2);
    
	NSString *feature = [args objectAtIndex:0];
	ENSURE_STRING_OR_NIL(feature);
    
	NSString *version = [args objectAtIndex:1];
	ENSURE_STRING_OR_NIL(version);
    
    if(feature != nil)
    {
        if( (version == nil) || ([[version lowercaseString] compare:@"1.0"] == 0) || ([[version lowercaseString] compare:@"2.0"] == 0) )
        {
            if([[feature lowercaseString] compare:@"core"] == 0)
                return NUMBOOL(YES);
            else if([[feature lowercaseString] compare:@"xml"] == 0)
                return NUMBOOL(YES);
            else 
                return NUMBOOL(NO);
        }
    }
    
    return NUMBOOL(NO);
}

-(id)createDocumentType:(id)args
{
	ENSURE_ARG_COUNT(args, 3);
    NSString* qualifiedName = nil;
    NSString* publicId = nil;
    NSString* systemId = nil;
    
    ENSURE_ARG_OR_NIL_AT_INDEX(qualifiedName,args,0,NSString);
    ENSURE_ARG_OR_NIL_AT_INDEX(publicId,args,1,NSString);
    ENSURE_ARG_OR_NIL_AT_INDEX(systemId,args,2,NSString);
    
    GDataXMLNode* resultElement = [GDataXMLNode dtdWithQualifiedName:qualifiedName publicId:publicId sysId:systemId];
    
    id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
    TIDOMDocumentTypeProxy * result = [[[TIDOMDocumentTypeProxy alloc] _initWithPageContext:context] autorelease];
    [result setNode:resultElement];
    [result setDocument:nil];
    [TiDOMNodeProxy setNode:result forXMLNode:[resultElement XMLNode]];
    return result;
}

-(id)createDocument:(id)args
{
	ENSURE_ARG_COUNT(args, 3);
    NSObject* obj1 = nil;
    NSObject* obj2 = nil;
    NSObject* obj3 = nil;
    NSString* theNsURI = nil;
    NSString* qualifiedName = nil;
    TIDOMDocumentTypeProxy* docType = nil;
    
    ENSURE_ARG_OR_NIL_AT_INDEX(obj1,args,0,NSObject);
    ENSURE_ARG_OR_NIL_AT_INDEX(obj2,args,1,NSObject);
    ENSURE_ARG_OR_NIL_AT_INDEX(obj3,args,2,NSObject);
	
	theNsURI = [TiUtils stringValue:obj1];
	qualifiedName = [TiUtils stringValue:obj2];
	
	if (qualifiedName == nil)
	{
		[self throwException:@"Could not create root element with null qualified name" subreason:nil location:CODELOCATION];
		return [NSNull null];
	}
    
    
    if ([obj3 isKindOfClass:[NSNull class]])
    {
        docType = nil;
    }
    else if ( [obj3 isKindOfClass:[TIDOMDocumentTypeProxy class]] )
    {
        docType = (TIDOMDocumentTypeProxy*)obj3;
    }
	else
	{
		[self throwException:@"Invalid argument passed for docType" subreason:nil location:CODELOCATION];
		return [NSNull null];
	}
    
	xmlChar *pre = NULL;
	xmlChar *href = NULL;
	if(theNsURI != nil)
		href = (xmlChar*)[theNsURI UTF8String];
	NSString* prefix = [GDataXMLNode prefixForName:qualifiedName];
	NSString* localName = [GDataXMLNode localNameForName:qualifiedName];
    
	if ([prefix length] > 0)
	{
		pre = (xmlChar*)[prefix UTF8String];
	}
	xmlNsPtr theNewNs = xmlNewNs(NULL, // parent node
                                 href, pre);
    xmlNodePtr rootPtr = xmlNewNode(theNewNs, (xmlChar*)[localName UTF8String]);
	xmlDocPtr doc = xmlNewDoc(NULL);
	xmlDocSetRootElement(doc, rootPtr);
	GDataXMLDocument * theDocument = [[[GDataXMLDocument alloc]initWithDocument:doc]autorelease];
    
	if (docType != nil)
	{
		GDataXMLNode *docTypeNode = [docType node];
		xmlNodePtr ret = xmlAddChild((xmlNodePtr)doc, [docTypeNode XMLNode]);
		if (ret != NULL)
		{
			//Now it is part of the tree so switch flag to ensur it gets freed when doc is released
			[docTypeNode setShouldFreeXMLNode:NO];
		}
	}
	id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
	TiDOMDocumentProxy * result = [[[TiDOMDocumentProxy alloc] _initWithPageContext:context] autorelease];
	[result setNode:[theDocument rootElement]];
	[result setDocument:theDocument];
	[TiDOMNodeProxy setNode:result forXMLNode:(xmlNodePtr)doc];
	return result;
    
}

@end

#endif
