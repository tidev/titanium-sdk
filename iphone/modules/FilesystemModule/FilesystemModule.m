/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_FILESYSTEM

#import "FilesystemModule.h"

@interface FileProxy : TitaniumProxyObject
{
}

@end

@implementation FileProxy

- (id) init;
{
	if ((self = [super init])){
	}
	return self;
}

- (void) dealloc
{
	[super dealloc];
}

@end

@implementation FilesystemModule

#pragma mark startModule

- (BOOL) startModule;
{
//	TitaniumInvocationGenerator * invocGen = [TitaniumInvocationGenerator generatorWithTarget:self];
	
//	[(TemplateModule *)invocGen foo];
//	NSInvocation * fooInvoc = [invocGen invocation];
	
//	NSDictionary * moduleDict = [NSDictionary dictionaryWithObjectsAndKeys:
//			@"",@"",
////			closeWinInvoc,@"_CLS",
////			[TitaniumJSCode codeWithString:systemButtonString],@"SystemButton",
//			nil];

	NSDictionary * moduleDict = [[[NSDictionary alloc] init] autorelease];
	[[[TitaniumHost sharedHost] titaniumObject] setObject:moduleDict forKey:@"Filesystem"];
	
	return YES;
}

@end

#endif