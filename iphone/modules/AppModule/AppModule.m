/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_APP

#import "AppModule.h"
#import "TitaniumJSCode.h"

@implementation AppModule

- (NSString *) appURLToPath: (NSString *) urlString;
{
	if (![urlString isKindOfClass:[NSString class]]) return nil;
	TitaniumHost * theHost = [TitaniumHost sharedHost];

	return [theHost filePathFromURL:[theHost resolveUrlFromString:urlString useFilePath:NO]];
}

- (BOOL) propertyExists: (NSString *) key;
{
	if (![key isKindOfClass:[NSString class]]) return NO;
	return ([defaultsObject objectForKey:key] != nil);
}

- (NSNumber *) getBool: (NSString *) key defaultValue: (id) defaultValue;
{
	if (![self propertyExists:key]) return defaultValue;
	return [NSNumber numberWithBool:[defaultsObject boolForKey:key]];
}

- (NSNumber *) getDouble: (NSString *) key defaultValue: (id) defaultValue;
{
	if (![self propertyExists:key]) return defaultValue;
	return [NSNumber numberWithDouble:[defaultsObject doubleForKey:key]];
}

- (NSNumber *) getInt: (NSString *) key defaultValue: (id) defaultValue;
{
	if (![self propertyExists:key]) return defaultValue;
	return [NSNumber numberWithInt:[defaultsObject integerForKey:key]];
}

- (NSString *) getString: (NSString *) key defaultValue: (id) defaultValue;
{
	if (![self propertyExists:key]) return defaultValue;
	return [defaultsObject stringForKey:key];
}

- (NSArray *) getList: (NSString *) key defaultValue: (id) defaultValue;
{
	if (![self propertyExists:key]) return defaultValue;
	return [defaultsObject arrayForKey:key];
}

- (void) setObject: (NSString *) key value: (NSObject *) newValue;
{
	if (![key isKindOfClass:[NSString class]]) return;
	if((newValue==nil) || (newValue==[NSNull null])){
		[defaultsObject removeObjectForKey:key];
	} else {
		[defaultsObject setObject:newValue forKey:key];
	}
}

- (NSNumber *) hasProperty: (NSString *) key;
{
	return [NSNumber numberWithBool:[self propertyExists:key]];
}

- (NSArray *) listProperties;
{
	return [[defaultsObject dictionaryRepresentation] allKeys];
}

- (NSDictionary*) launchOptions;
{
	return [[TitaniumAppDelegate sharedDelegate] launchOptions];
}

- (BOOL) startModule;
{
	defaultsObject = [[NSUserDefaults standardUserDefaults] retain];
	
	NSDictionary * appPropertiesDict = [[TitaniumHost sharedHost] appProperties];
		
	TitaniumInvocationGenerator * invocGen = [TitaniumInvocationGenerator generatorWithTarget:self];
	[(AppModule *)invocGen appURLToPath: nil];
	NSInvocation * appUrlInvoc = [invocGen invocation];
	
	[(AppModule *)invocGen launchOptions];
	NSInvocation * launchOptionsInvoc = [invocGen invocation];
	
	[(AppModule *)invocGen getBool:nil defaultValue:nil];
	NSInvocation * boolInvoc = [invocGen invocation];
	
	[(AppModule *)invocGen getDouble:nil defaultValue:nil];
	NSInvocation * doubleInvoc = [invocGen invocation];
	
	[(AppModule *)invocGen getInt:nil defaultValue:nil];
	NSInvocation * intInvoc = [invocGen invocation];
	
	[(AppModule *)invocGen getString:nil defaultValue:nil];
	NSInvocation * stringInvoc = [invocGen invocation];
	
	[(AppModule *)invocGen getList:nil defaultValue:nil];
	NSInvocation * getListInvoc = [invocGen invocation];
	
	[(AppModule *)invocGen setObject:nil value:nil];
	NSInvocation * setInvoc = [invocGen invocation];
	
	[(AppModule *)invocGen hasProperty:nil];
	NSInvocation * hasInvoc = [invocGen invocation];
	
	[(AppModule *)invocGen listProperties];
	NSInvocation * listInvoc = [invocGen invocation];
	
	
	NSDictionary * propertiesDict = [NSDictionary dictionaryWithObjectsAndKeys:
								 boolInvoc,@"getBool",
								 doubleInvoc,@"getDouble",
								 intInvoc,@"getInt",
								 stringInvoc,@"getString",
								 getListInvoc,@"getList",
								 setInvoc,@"setBool",
								 setInvoc,@"setDouble",
								 setInvoc,@"setInt",
								 setInvoc,@"setString",
								 setInvoc,@"setList",
								 [TitaniumJSCode codeWithString:@"function(key){Ti.App.Properties.setString(key,null);}"],@"removeProperty",
								 hasInvoc,@"hasProperty",
								 listInvoc,@"listProperties",
								 nil];
	
	NSDictionary * appDict = [NSDictionary dictionaryWithObjectsAndKeys:
			propertiesDict,@"Properties",
			[TitaniumJSCode functionReturning:[appPropertiesDict objectForKey:@"id"]],@"getID",
			[TitaniumJSCode functionReturning:[appPropertiesDict objectForKey:@"name"]],@"getName",
			[TitaniumJSCode functionReturning:[appPropertiesDict objectForKey:@"version"]],@"getVersion",
			[TitaniumJSCode functionReturning:[appPropertiesDict objectForKey:@"publisher"]],@"getPublisher",
			[TitaniumJSCode functionReturning:[appPropertiesDict objectForKey:@"description"]],@"getDescription",
			[TitaniumJSCode functionReturning:[appPropertiesDict objectForKey:@"copyright"]],@"getCopyright",
			[TitaniumJSCode functionReturning:[appPropertiesDict objectForKey:@"url"]],@"getURL",
			[TitaniumJSCode functionReturning:[appPropertiesDict objectForKey:@"guid"]],@"getGUID",
			appUrlInvoc,@"appURLToPath",
			launchOptionsInvoc,@"getArguments",
			nil];
	[[[TitaniumHost sharedHost] titaniumObject] setObject:appDict forKey:@"App"];
	return YES;
}

- (BOOL) endModule;
{
	return YES;
}

- (void) dealloc
{
	[defaultsObject release];
	[super dealloc];
}


@end

#endif