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
}

-(id)name
{
	return name;
}

-(id)value
{
	return value;
}

-(id)ownerElement
{
	TiDOMElementProxy *proxy = [[[TiDOMElementProxy alloc] _initWithPageContext:[self pageContext]] autorelease];
	[proxy setElement:owner];
	return proxy;
}


@end

#endif