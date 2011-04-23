/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiFilesystemFileStreamProxy.h"
#import "TiFilesystemFileProxy.h"

@implementation TiFilesystemFileStreamProxy

#pragma mark Internal

-(id) _initWithPageContext:(id <TiEvaluator>)context args:(NSArray *)args {
	if(self = [super _initWithPageContext:context args:args]) {
		if([args count] > 0) {
			fileProxy = [(TiFilesystemFileProxy *) [args objectAtIndex:0] retain];
		}
	}
	return self;
}


-(void) dealloc {
	RELEASE_TO_NIL(fileProxy);
	[super dealloc];
}

#pragma mark Public API

-(NSNumber*)isReadable:(id)_void {
	return NUMINT(-1);	
}

-(NSNumber*)isWritable:(id)_void {
	return NUMINT(-1);
}

@end
