/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TemplateModule.h"

@interface TemplateProxy : TitaniumProxyObject
{
}

@end

@implementation TemplateProxy

- (id) init
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

@implementation TemplateModule

#pragma mark startModule

- (BOOL) startModule
{
	TitaniumInvocationGenerator * invocGen = [TitaniumInvocationGenerator generatorWithTarget:self];
	
//	[(TemplateModule *)invocGen foo];
//	NSInvocation * fooInvoc = [invocGen invocation];
	
	NSDictionary * moduleDict = [NSDictionary dictionaryWithObjectsAndKeys:
			@"",@"",
//			closeWinInvoc,@"_CLS",
//			[TitaniumJSCode codeWithString:systemButtonString],@"SystemButton",
			nil];
	[[[TitaniumHost sharedHost] titaniumObject] setObject:moduleDict forKey:@"Template"];
	
	return YES;
}

@end
