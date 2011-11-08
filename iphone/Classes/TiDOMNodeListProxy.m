/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_XML) || defined(USE_TI_NETWORK)

#import "TiDOMNodeListProxy.h"
#import "TiDOMNodeProxy.h"
#import "TiUtils.h"

@implementation TiDOMNodeListProxy
@synthesize document;

-(void)dealloc
{
	RELEASE_TO_NIL(nodes);
	RELEASE_TO_NIL(document);
	[super dealloc];
}

-(void)setNodes:(NSArray*)nodes_
{
	RELEASE_TO_NIL(nodes);
	nodes = [nodes_ retain];
}

-(id)item:(id)args
{
	ENSURE_SINGLE_ARG(args,NSObject);
	int index = [TiUtils intValue:args];
    
	if ((nodes != nil) && (index < [nodes count]))
	{
		id result = [TiDOMNodeProxy makeNode:[nodes objectAtIndex:index] context:[self executionContext]];
		[result setDocument:[self document]];
		return result;
	}
	return [NSNull null];
}

-(NSNumber*)length
{
    if(nodes != nil)
        return NUMINT([nodes count]);
    else
        return NUMINT(0);
}

@end

#endif