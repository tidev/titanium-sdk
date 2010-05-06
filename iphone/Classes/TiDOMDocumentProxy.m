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
#import "TiUtils.h"

@implementation TiDOMDocumentProxy

#pragma mark internal

-(void)dealloc
{
	RELEASE_TO_NIL(document);
	[super dealloc];
}

-(void)setDocument:(GDataXMLDocument*)doc
{
	RELEASE_TO_NIL(document);
	document = [doc retain];
}

-(BOOL)equals:(id)value
{
	if ([value isKindOfClass:[TiDOMDocumentProxy class]])
	{
	}
}

-(void)parseString:(NSString*)xml
{
	RELEASE_TO_NIL(document);
	NSError *error = nil;
	document = [[GDataXMLDocument alloc] initWithXMLString:xml options:0 error:&error];
	[self setElement:[document rootElement]];
	if (error!=nil)
	{
		RELEASE_TO_NIL(document);
		[self throwException:[error description] subreason:nil location:CODELOCATION];
	}
}

#pragma mark Public APIs

-(id)documentElement:(id)args
{
	GDataXMLElement *root = [document rootElement];
	return [TiDOMNodeProxy makeNode:root context:[self pageContext]];
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
	if (error==nil && nodes!=nil && [nodes count]>0)
	{
		TiDOMNodeListProxy *proxy = [[[TiDOMNodeListProxy alloc] _initWithPageContext:[self pageContext]] autorelease];
		[proxy setNodes:nodes];
		return proxy;
	}
	if (error!=nil)
	{
		[self throwException:[error description] subreason:nil location:CODELOCATION];
	}
	return nil;
}

-(id)getElementById:(id)args
{
	ENSURE_SINGLE_ARG(args,NSString);
	NSError *error = nil;
	NSArray *nodes = [document nodesForXPath:[NSString stringWithFormat:@"//*[@id=%@]",args] error:&error];
	if (error==nil && nodes!=nil && [nodes count]>0)
	{
		TiDOMNodeListProxy *proxy = [[[TiDOMNodeListProxy alloc] _initWithPageContext:[self pageContext]] autorelease];
		[proxy setNodes:nodes];
		return proxy;
	}
	return nil;
}

-(id)evaluate:(id)args
{
	ENSURE_SINGLE_ARG(args,NSString);
	NSError *error = nil;
	NSArray *nodes = [document nodesForXPath:args error:&error];
	if (error==nil && nodes!=nil && [nodes count]>0)
	{
		TiDOMNodeListProxy *proxy = [[[TiDOMNodeListProxy alloc] _initWithPageContext:[self pageContext]] autorelease];
		[proxy setNodes:nodes];
		return proxy;
	}
	return nil;
}

@end

#endif