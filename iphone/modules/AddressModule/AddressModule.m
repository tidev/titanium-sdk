/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "AddressModule.h"

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

@implementation AddressModule

- (id) helloWorld: (NSArray *)args;
{
	NSLog(@"Hello, world! %@",args);
	return nil;
}

#pragma mark startModule

- (BOOL) startModule
{
//	TitaniumInvocationGenerator * invocGen = [TitaniumInvocationGenerator generatorWithTarget:self];
	
//	[(TemplateModule *)invocGen foo];
//	NSInvocation * fooInvoc = [invocGen invocation];
	
	NSDictionary * moduleDict = [NSDictionary dictionaryWithObjectsAndKeys:
//			@"",@"",
//			closeWinInvoc,@"_CLS",
			[TitaniumJSCode codeWithString:@"function(foo,bar){return Ti._TIDO('address','helloWorld',[foo,bar]);}"],@"addressBookThingy",
			nil];
	[[TitaniumHost sharedHost] bindObject:moduleDict toKeyPath:@"UI"];
	
	return YES;
}

@end
