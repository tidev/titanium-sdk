/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "ContactsModule.h"

#import <AddressBook/AddressBook.h>
#import <AddressBookUI/AddressBookUI.h>

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

@implementation ContactsModule

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

// Object is hash array. 


//			,@"FIRST_NAME"
//			,@"LAST_NAME"
//			,@"MIDDLE_NAME",
//			,@"PREFIX",
//			,@"SUFFIX",
//			,@"NICKNAME",
//			,@"FIRST_NAME_PHONETIC",
//			,@"LAST_NAME_PHONETIC",
//			,@"MIDDLE_NAME_PHONETIC",
//			,@"ORGANIZATION",
//			,@"JOB_TITLE",
//			,@"DEPARTMENT",
//			,@"EMAIL",
//			,@"BIRTHDAY",
//			,@"NOTE",
//			,@"CREATION_DATE",
//			@"modificationDate",@"MODIFICATION_DATE",
			[TitaniumJSCode codeWithString:@"function(foo,bar){return Ti._TIDO('contacts','helloWorld',[foo,bar]);}"],@"addressBookThingy",
			nil];
	[[TitaniumHost sharedHost] bindObject:moduleDict toKeyPath:@"Contacts"];
	
	return YES;
}

@end
