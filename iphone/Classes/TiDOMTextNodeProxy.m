/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TiDOMTextNodeProxy.h"
#import "TiUtils.h"

@implementation TiDOMTextNodeProxy


-(TiDOMTextNodeProxy *) splitText:(id)args
{
    
    ENSURE_ARG_COUNT(args, 1);
	int offsetArg;
	ENSURE_INT_AT_INDEX(offsetArg, args, 0);  
    
    NSString * ourData = [self data];
	int dataLength = [ourData length];
	ENSURE_VALUE_RANGE(offsetArg, 0, dataLength);    
    
    NSString *newNodeData = [ourData substringFromIndex:offsetArg];
    NSString *ourNewData = [ourData substringToIndex:offsetArg];
    
    //Update out Text
    [node setStringValue:ourNewData];
   
    //Create new node with data from offset
    TiDOMTextNodeProxy * result = [[[TiDOMTextNodeProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
	GDataXMLNode * resultElement = [GDataXMLNode textWithStringValue:newNodeData];
    [result setDocument:[self document]];
	[result setNode:resultElement];
    
    xmlNodePtr ourRealNode = [node XMLNode];
    xmlNodePtr resultRealNode = [resultElement XMLNode];
    
    xmlNodePtr ourParent = ourRealNode->parent;
    
    //Set Parent and Doc
    resultRealNode->parent = ourParent;
    resultRealNode->doc = ourRealNode->doc;
    
    //Set up next and prev pointers
    if(ourRealNode->next != nil)
    {
        ourRealNode->next->prev = resultRealNode;
        resultRealNode->next = ourRealNode->next;
    }
    ourRealNode->next = resultRealNode;
    resultRealNode->prev = ourRealNode;
    if(ourParent != nil)
    {
        if(ourParent->last == ourRealNode)
            ourParent->last = resultRealNode;
    }
    [TiDOMNodeProxy setNode:result forXMLNode:resultRealNode];
    return result;
    //THIS DOES NOT WORK SINCE LIBXML MERGES ADJACENT TEXT NODES WHEN ADDING SIBLINGS,CHILDREN
    //xmlAddNextSibling([node XMLNode], [resultElement XMLNode]);
    
}

@end

#endif