/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TiDOMNamedNodeMapProxy.h"
#import "TiDOMAttrProxy.h"
#import "TiDOMNodeListProxy.h"
#import "TiUtils.h"

@implementation TiDOMNamedNodeMapProxy

-(void)dealloc
{
	RELEASE_TO_NIL(element);
	[super dealloc];
}

-(void)setElement:(TiDOMElementProxy*)element_
{
	RELEASE_TO_NIL(element);
	element = [element_ retain];
}

-(id)getNamedItem:(id)name
{
	if (element != nil) {
		return [element getAttributeNode:name];
	}
	
    return [NSNull null];
}

-(id)getNamedItemNS:(id)args
{
	if (element != nil) {
		return [element getAttributeNodeNS:args];
	}
	
    return [NSNull null];
}

-(id)setNamedItem:(id)args
{
	if (element != nil) {
		return [element setAttributeNode:args];
	}
	
    return [NSNull null];
}

-(id)setNamedItemNS:(id)args
{
	if (element != nil) {
		return [element setAttributeNodeNS:args];
	}

    return [NSNull null];
}

-(id)removeNamedItem:(id)args
{
	if (element != nil) {
		id proxy = [element getAttributeNode:args];
		if (proxy != (id)[NSNull null]) {
			return [element removeAttributeNode:proxy];
		}
		else {
			[self throwException:@"could not find item to remove" subreason:@"" location:CODELOCATION];
		}
	}
	else {
		[self throwException:@"could not find item to remove" subreason:@"" location:CODELOCATION];
	}
	return [NSNull null];
}

-(id)removeNamedItemNS:(id)args
{
	if (element != nil) {
		id proxy = [element getAttributeNodeNS:args];
		if (proxy != (id)[NSNull null]) {
			return [element removeAttributeNode:proxy];
		}
		else {
			[self throwException:@"could not find item to remove" subreason:@"" location:CODELOCATION];
		}
	}
	else {
		[self throwException:@"could not find item to remove" subreason:@"" location:CODELOCATION];
	}
	return [NSNull null];
}

-(id)item:(id)args
{
	ENSURE_SINGLE_ARG(args,NSObject);
	int index = [TiUtils intValue:args];

    if( ([[(GDataXMLElement*)[element node] attributes] count] > index) && (index >= 0) )
    {
        GDataXMLNode *node = [[(GDataXMLElement*)[element node] attributes] objectAtIndex:index];
        TiDOMAttrProxy *proxy = [TiDOMNodeProxy nodeForXMLNode:[node XMLNode]];
        if(proxy == nil)
        {
            proxy = [[[TiDOMAttrProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
            [proxy setAttribute:[node name] value:[node stringValue] owner:(GDataXMLElement*)[element node]];
            [proxy setNode:node];
            [proxy setDocument:[element document]];
            [TiDOMNodeProxy setNode:proxy forXMLNode:[node XMLNode]];
        }
        return proxy;
    }
    return [NSNull null];
}

/*
Because of parity, we cannot enable this just yet, but this code will allow for treating index
properties the same as foo.item(index).
 
-(id)valueForUndefinedKey:(NSString *)key
{
	if ([[key stringByTrimmingCharactersInSet:[NSCharacterSet decimalDigitCharacterSet]] length]==0)
	{
		return [self item:key];
	}
	return [super valueForUndefinedKey:key];
}
*/

-(NSNumber*)length
{
	return NUMINT([[(GDataXMLElement*)[element node] attributes] count]);
}

@end

#endif