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
    NSString* qualifiedName;
    NSString* publicId;
    NSString* systemId;
    
    ENSURE_ARG_OR_NIL_AT_INDEX(qualifiedName,args,0,NSString);
    ENSURE_ARG_OR_NIL_AT_INDEX(publicId,args,1,NSString);
    ENSURE_ARG_OR_NIL_AT_INDEX(systemId,args,2,NSString);
    
    GDataXMLNode* resultElement = [GDataXMLNode dtdWithQualifiedName:qualifiedName publicId:publicId sysId:systemId];
    
    TIDOMDocumentTypeProxy * result = [[[TIDOMDocumentTypeProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
    [result setNode:resultElement];
    [result setDocument:nil];
    
    return result;
}

-(id)createDocument:(id)args
{
	ENSURE_ARG_COUNT(args, 3);
    NSObject* obj1;
    NSObject* obj2;
    NSObject* obj3;
    NSString* theNsURI;
    NSString* qualifiedName;
    TIDOMDocumentTypeProxy* docType;
    
    ENSURE_ARG_OR_NIL_AT_INDEX(obj1,args,0,NSObject);
    ENSURE_ARG_OR_NIL_AT_INDEX(obj2,args,1,NSObject);
    ENSURE_ARG_OR_NIL_AT_INDEX(obj3,args,2,NSObject);
    
    if([obj1 isKindOfClass:[NSNull class]])
    {
        theNsURI = nil;
    }
    else
    {
        theNsURI = (NSString*)obj1;
    }
    
    if([obj2 isKindOfClass:[NSNull class]])
    {
        [self throwException:@"could not create root element with null localname" subreason:nil location:CODELOCATION];
        return [NSNull null];
    }
    else
    {
        qualifiedName = (NSString*)obj2;
    }
    
    if([obj3 isKindOfClass:[NSNull class]])
    {
        docType = nil;
    }
    else
    {
        docType = (TIDOMDocumentTypeProxy*)obj3;
    }
    
    xmlChar *pre = NULL;
    xmlChar *href = NULL;
    if(theNsURI != nil)
        href = (xmlChar*)[theNsURI UTF8String];
    NSString* prefix = [GDataXMLNode prefixForName:qualifiedName];
    NSString* localName = [GDataXMLNode localNameForName:qualifiedName];
    
    if (prefix != nil && ([prefix length] > 0)) 
    {
        pre = (xmlChar*)[prefix UTF8String];
    } 
    
    xmlNsPtr theNewNs = xmlNewNs(NULL, // parent node
                                 href, pre);
    
    xmlNodePtr rootPtr = xmlNewNode(theNewNs, (xmlChar*)[localName UTF8String]);
    xmlDocPtr doc = xmlNewDoc(NULL);
    xmlDocSetRootElement(doc, rootPtr);
    GDataXMLDocument * theDocument = [[GDataXMLDocument alloc]initWithDocument:doc];
    
    if(docType != nil)
    {
        GDataXMLNode *docTypeNode = [docType node];
        xmlAddChild((xmlNodePtr)doc, [docTypeNode XMLNode]);
        /*
        xmlNodePtr theRealNode = [docTypeNode XMLNode];
        if(theRealNode != nil)
        {
            xmlDtdPtr theNewDTDNode = xmlCopyDtd((xmlDtdPtr) theRealNode);
            doc->intSubset = theNewDTDNode;
        }
         */
    }

    TiDOMDocumentProxy * result = [[[TiDOMDocumentProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
    [result setNode:[theDocument rootElement]];
    [result setDocument:theDocument];
    return result;
    
}

@end

#endif
