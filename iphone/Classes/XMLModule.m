/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_XML

#import "XMLModule.h"
#import "TiDOMDocumentProxy.h"
#import "TiDOMNodeProxy.h"

@implementation XMLModule

-(id)parseString:(id)arg
{
	ENSURE_SINGLE_ARG(arg,NSString);
	
	TiDOMDocumentProxy *proxy = [[[TiDOMDocumentProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
	[proxy parseString:arg];
	return proxy;
}

-(id)serializeToString:(id)arg
{
	ENSURE_SINGLE_ARG(arg,TiDOMNodeProxy);
	
	TiDOMNodeProxy *proxy = (TiDOMNodeProxy *)arg;
	return [proxy XMLString];
}

@end

#endif