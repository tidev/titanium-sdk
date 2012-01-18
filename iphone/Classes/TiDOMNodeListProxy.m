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

-(void)dealloc
{
	[nodes release];
	[super dealloc];
}

-(void)setNodes:(NSArray*)nodes_
{
    if (nodes == nodes_) {
        return;
    }
    if (nodes != nil) {
        for (TiDOMNodeProxy *node in nodes) {
            if (![nodes_ containsObject:node]) {
                [self forgetProxy:node];
            }
        }
    }
	RELEASE_TO_NIL(nodes);
    if (nodes_ == nil) {
        return;
    }
	nodes = [nodes_ retain];
    for (TiDOMNodeProxy *node in nodes) {
        [[self pageContext] registerProxy:node];
        [self rememberProxy:node];
    }
}

-(id)item:(id)args
{
	ENSURE_SINGLE_ARG(args,NSObject);
	int index = [TiUtils intValue:args];
    
	if ( (index < [nodes count]) && (index >=0) )
	{
		return [nodes objectAtIndex:index];
	}
	return [NSNull null];
}

-(NSNumber*)length
{
    return NUMINT([nodes count]);
}



@end

#endif