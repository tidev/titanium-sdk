/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TiDOMAttrProxy.h"
#import "TiDOMElementProxy.h"
#import "TiUtils.h"

@implementation TiDOMAttrProxy

-(void)dealloc
{
	RELEASE_TO_NIL(name);
	RELEASE_TO_NIL(value);
	RELEASE_TO_NIL(owner);
	[super dealloc];
}

-(void)setAttribute:(NSString*)name_ value:(NSString*)value_ owner:(GDataXMLElement*)owner_
{
	RELEASE_TO_NIL(name);
	RELEASE_TO_NIL(value);
	RELEASE_TO_NIL(owner);
	name = [name_ retain];
	value = [value_ retain];
	owner = [owner_ retain];
    if(value != nil)
        isSpecified = YES;
    else
        isSpecified = NO;
}

-(id)name
{
	if (name != nil)
		return name;
	else
		return [NSNull null];
}

-(id)value
{
    if(value != nil)
        return value;
    else
        return [NSNull null];
}

-(void)setValue:(NSString *)data
{
    ENSURE_TYPE(data, NSString);
    RELEASE_TO_NIL(value);
    value = data;
	[node setStringValue:data];
    isSpecified = YES;
}

-(void)setIsSpecified:(BOOL)isSpecified_
{
    isSpecified = isSpecified_;
}

-(void)setNodeValue:(NSString *)data
{
	[self setValue:data];
}

-(id)ownerElement
{
    xmlNodePtr parentNode = [node XMLNode]->parent;
    if (parentNode == NULL)
        return [NSNull null];
	
	id result = [TiDOMNodeProxy nodeForXMLNode:parentNode];
	if (result != nil) 
	{
		return result;
	}
	id context = ([self executionContext]==nil)?[self pageContext]:[self executionContext];
	TiDOMElementProxy *proxy = [[[TiDOMElementProxy alloc] _initWithPageContext:context] autorelease];
	[proxy setDocument:[self document]];
	[proxy setElement:[GDataXMLNode nodeBorrowingXMLNode:parentNode]];
	[TiDOMNodeProxy setNode:proxy forXMLNode:parentNode];
	return proxy;
}

-(id)specified
{
    //TODO - Support for default values specified in the DTD.
    if([node XMLNode]->parent == nil)
        return NUMBOOL(YES);
   
    return NUMBOOL(isSpecified);
}


@end

#endif