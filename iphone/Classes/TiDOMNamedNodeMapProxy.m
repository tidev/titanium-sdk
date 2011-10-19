/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TiDOMNamedNodeMapProxy.h"
#import "TiDOMNodeProxy.h"
#import "TiUtils.h"

@implementation TiDOMNamedNodeMapProxy
@synthesize document;

-(void)dealloc
{
	RELEASE_TO_NIL(element);
	RELEASE_TO_NIL(document);
	[super dealloc];
}

-(void)setElement:(GDataXMLElement*)element_
{
	RELEASE_TO_NIL(element);
	element = [element_ retain];
}

-(id)getNamedItem:(id)name
{
	ENSURE_SINGLE_ARG(name,NSString);
	GDataXMLNode *node = [element attributeForName:name];
	TiDOMNodeProxy *proxy = [[[TiDOMNodeProxy alloc] _initWithPageContext:[self pageContext]] autorelease];
	[proxy setNode:node];
	[proxy setDocument:[self document]];
	return proxy;
}

-(void)setNamedItem:(id)args
{
	//TODO:
}

-(void)removeNamedItem:(id)args
{
	//TODO:
}

-(id)item:(id)args
{
	ENSURE_SINGLE_ARG(args,NSObject);
	int index = [TiUtils intValue:args];
	GDataXMLNode *node = [[element attributes] objectAtIndex:index];
	TiDOMNodeProxy *proxy = [[[TiDOMNodeProxy alloc] _initWithPageContext:[self pageContext]] autorelease];
	[proxy setNode:node];
	[proxy setDocument:[self document]];
	return proxy;
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
	return NUMINT([[element attributes] count]);
}

@end

#endif