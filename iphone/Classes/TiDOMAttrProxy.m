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
    NSString* ret = [node name];
    if(ret == nil)
    {
        //probably got removed from tree
        if(name != nil)
            return [node name];
        else
            return [NSNull null];
    }
    else
    {
        if(name == nil)
            name = [ret retain];
        else if([ret compare:name] != 0)
        {
            RELEASE_TO_NIL(name);
            name = [ret retain];
        }
        return ret;
    }
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
	ENSURE_TYPE(data, NSString);
    RELEASE_TO_NIL(value);
    value = data;
    [node setStringValue:data];
    isSpecified = YES;
}

-(id)ownerElement
{
    if([node XMLNode]->parent == nil)
        return [NSNull null];
	TiDOMElementProxy *proxy = [[[TiDOMElementProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
	[proxy setDocument:[self document]];
    [proxy setElement:[GDataXMLNode nodeConsumingXMLNode:[node XMLNode]->parent]];
	return proxy;
}

-(id)specified
{
    //TODO FIX THIS
    if([node XMLNode]->parent == nil)
        return NUMBOOL(YES);
   
    return NUMBOOL(isSpecified);
}


@end

#endif