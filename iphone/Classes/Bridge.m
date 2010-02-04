/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>
#import "Bridge.h"
#import "SBJSON.h"
#import "TiModule.h"
#import "TiHost.h"

@implementation Bridge

-(id)initWithHost:(TiHost*)host_
{
	if (self = [self init])
	{
		host = [host_ retain];
	}
	return self;
}

-(void) dealloc
{
	[host release];
	[url release];
	[callback release];
	[super dealloc];
}

- (TiHost*)host
{
	return host;
}

-(void)shutdown
{
}

-(void)gc
{
}

-(void)booted
{
	if (callback!=nil)
	{
		[callback performSelectorOnMainThread:@selector(booted:) withObject:self waitUntilDone:NO];
		[callback release];
		callback = nil;
	}
	[url release];
	url=nil;
}

-(void)boot:(id)callback_ url:(NSURL*)url_ preload:(NSDictionary*)preload
{
	url = [url_ retain];
	callback = [callback_ retain];
}

-(NSData*)invoke:(NSString*)pageToken operation:(NSString*)operation module:(NSString*)moduleName property:(NSString*)property arguments:(NSString*)arguments exception:(NSString**)exception
{
	// lazy load modules if not already found
	id module = nil;
	
	if ([moduleName hasPrefix:@"proxy$"])
	{
		module = [host proxyForId:moduleName];
	}
	else  
	{
		module = [host moduleNamed:moduleName];
	}
	
	if (module==nil)
	{
		NSLog(@"[ERROR] MODULE NOT FOUND: %@", moduleName);
		*exception = [NSString stringWithFormat:@"'Titanium.%@' not found",moduleName];
		return nil;
	}
	else 
	{
		NSData *data = nil;
		NSString *methodName = nil;
		
		BOOL passArg = YES;
		BOOL makeArg = NO;
		BOOL unpackArg = NO;
		BOOL invoke = NO;
		
		if ([operation isEqualToString:@"1"]) // invoke
		{
			methodName = [NSString stringWithFormat:@"%@:",property];
			invoke = YES;
			if ([methodName hasPrefix:@"set"])
			{
				unpackArg = YES;
			}
		}
		else if ([operation isEqualToString:@"2"]) // get
		{
			methodName = property;
			passArg = NO;
		}
		else if ([operation isEqualToString:@"3"]) // set
		{
			NSString *name = [NSString stringWithFormat:@"%@%@",[[property substringToIndex:1] uppercaseString],[property substringFromIndex:1]];
			methodName = [NSString stringWithFormat:@"set%@:",name];
			makeArg = YES;
			unpackArg = YES;
		}
		
		if (methodName!=nil)
		{
			SEL selector = NSSelectorFromString(methodName);
			BOOL proxyMethod = NO;
			
			if (![module respondsToSelector:selector] && invoke)
			{
				// getter such as getViews: but we need to turn it into a property accessor
				if ([methodName hasPrefix:@"get"] && [methodName length] > 3 && [methodName hasSuffix:@":"])
				{
					NSString *f = [NSString stringWithFormat:@"%c", [methodName characterAtIndex:3]];
					NSString *prop = [NSString stringWithFormat:@"%@%@",[f lowercaseString],[methodName substringFromIndex:4]];
					selector = NSSelectorFromString([prop substringToIndex:[prop length]-1]);
					passArg = NO;
				}
				//FIXME
				else if ([methodName hasPrefix:@"create"] && [module respondsToSelector:@selector(createProxy:forName:)])
				{
					selector = @selector(createProxy:forName:);
					proxyMethod = YES;
				}
			}
			
			
			if ([module respondsToSelector:selector])
			{
				NSArray* arg = nil;
				
				if (passArg)
				{
					SBJSON *json = [[SBJSON alloc] init];
					NSError *error = nil;
					NSString *jsonArg = makeArg ? [NSString stringWithFormat:@"[%@]",arguments] : arguments;
					
					NSLog(@"JSON INCOMING = %@",jsonArg);
					
					arg = [json objectWithString:jsonArg error:&error];
					[json release];
				}
				
				if (unpackArg && arg!=nil && [arg count] > 0)
				{
					arg = [arg objectAtIndex:0];
				}
				
				NSMethodSignature * methodSignature = [module methodSignatureForSelector:selector];
				NSInvocation * invoker = [NSInvocation invocationWithMethodSignature:methodSignature];
				
				[invoker setSelector:selector]; 
				[invoker setTarget:module];
				if (arg!=nil)
				{
					[invoker setArgument:&arg atIndex:2];
				}
				if (proxyMethod)
				{
					[invoker setArgument:&property atIndex:3];
				}
				
				// invoke the pagetoken
				if ([module respondsToSelector:@selector(setPageContext:)])
				{
					[(TiModule*)module setPageContext:(id<TiEvaluator>)self];
				}
				
				NSLog(@"BEFORE INVOKE: %@->%@ with %@",module,methodName,arg);
				[invoker invoke];

				id result = nil;
				
				if ([methodSignature methodReturnLength] == sizeof(id)) 
				{
					[invoker getReturnValue:&result];
				}
				
				if (result == nil)
				{
					data = [@"result=null" dataUsingEncoding:NSUTF8StringEncoding];
				}
				else 
				{
					NSLog(@"RESULT WAS = %@ [%@] - method = %@ (%@)", result, [result class], methodName, module);
					
					SBJSON *sbjson = [[SBJSON alloc] init];
					NSString *jsonResult = [NSString stringWithFormat:@"result=%@",[sbjson stringWithObject:result allowScalar:YES error:nil]];
					[sbjson release];
					data = [jsonResult dataUsingEncoding:NSUTF8StringEncoding];
				}
				
				NSLog(@"AFTER INVOKE: %@ RESULT %@",methodName,[[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] autorelease]);
				
				//[arg release];
				
				return data;
			}
			else 
			{
				NSLog(@"[ERROR] module: %@ doesn't respond to selector: %@",moduleName, methodName);
			}

		}

		*exception = [NSString stringWithFormat:@"couldn't find Titanium.%@.%@", moduleName, property];
		return nil;
	}
}


@end
