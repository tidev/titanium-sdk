/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_APP

#import "TiAppPropertiesProxy.h"
#import "TiUtils.h"

@implementation TiAppPropertiesProxy

-(void)dealloc
{
	TiThreadPerformOnMainThread(^{
		[[NSNotificationCenter defaultCenter] removeObserver:self];
	}, YES);
	RELEASE_TO_NIL(defaultsObject);
	[super dealloc];
}

-(void)_listenerAdded:(NSString*)type count:(int)count
{
	if (count == 1 && [type isEqual:@"change"])
	{
		TiThreadPerformOnMainThread(^{
			[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(NSUserDefaultsDidChange) name:NSUserDefaultsDidChangeNotification object:nil];
		}, YES);
	}
}

-(void)_listenerRemoved:(NSString*)type count:(int)count
{
	if (count == 0 && [type isEqual:@"change"])
	{
		TiThreadPerformOnMainThread(^{
			[[NSNotificationCenter defaultCenter] removeObserver:self name:NSUserDefaultsDidChangeNotification object:nil];
		}, YES);
	}
}

-(void)_configure
{
	defaultsObject = [[NSUserDefaults standardUserDefaults] retain];
	[super _configure];
}

-(BOOL)propertyExists: (NSString *) key;
{
	if (![key isKindOfClass:[NSString class]]) return NO;
	[defaultsObject synchronize];
	return ([defaultsObject objectForKey:key] != nil);
}

#define GETPROP \
ENSURE_TYPE(args,NSArray);\
NSString *key = [args objectAtIndex:0];\
id defaultValue = [args count] > 1 ? [args objectAtIndex:1] : [NSNull null];\
if (![self propertyExists:key]) return defaultValue; \

-(id)getBool:(id)args
{
	GETPROP
	return [NSNumber numberWithBool:[defaultsObject boolForKey:key]];
}

-(id)getDouble:(id)args
{
	GETPROP
	return [NSNumber numberWithDouble:[defaultsObject doubleForKey:key]];
}

-(id)getInt:(id)args
{
	GETPROP
	return [NSNumber numberWithInt:[defaultsObject integerForKey:key]];
}

-(id)getString:(id)args
{
	GETPROP
	return [defaultsObject stringForKey:key];
}

-(id)getList:(id)args
{
	GETPROP
	return [defaultsObject arrayForKey:key];
}

-(id)getObject:(id)args
{
	GETPROP
	return [defaultsObject dictionaryForKey:key];
}

#define SETPROP \
ENSURE_TYPE(args,NSArray);\
NSString *key = [args objectAtIndex:0];\
id value = [args count] > 1 ? [args objectAtIndex:1] : nil;\
if (value==nil || value==[NSNull null]) {\
    [defaultsObject removeObjectForKey:key];\
	[defaultsObject synchronize]; \
	return;\
}\
if ([self propertyExists:key] && [ [defaultsObject objectForKey:key] isEqual:value]) {\
    return;\
}\



-(void)setBool:(id)args
{
	SETPROP
	[defaultsObject setBool:[TiUtils boolValue:value] forKey:key];
	[defaultsObject synchronize];
}

-(void)setDouble:(id)args
{
	SETPROP
	[defaultsObject setDouble:[TiUtils doubleValue:value] forKey:key];
	[defaultsObject synchronize];
}

-(void)setInt:(id)args
{
	SETPROP
	[defaultsObject setInteger:[TiUtils intValue:value] forKey:key];
	[defaultsObject synchronize];	
}

-(void)setString:(id)args
{
	SETPROP
	[defaultsObject setObject:[TiUtils stringValue:value] forKey:key];
	[defaultsObject synchronize];
}

-(void)setList:(id)args
{
	SETPROP
	[defaultsObject setObject:value forKey:key];
	[defaultsObject synchronize];
}

-(void)setObject:(id)args
{
	SETPROP
	[defaultsObject setObject:value forKey:key];
	[defaultsObject synchronize];
}

-(void)removeProperty:(id)args
{
	ENSURE_SINGLE_ARG(args,NSString);
	[defaultsObject removeObjectForKey:[TiUtils stringValue:args]];
	[defaultsObject synchronize];
}

-(void)removeAllProperties {
	NSArray *keys = [[defaultsObject dictionaryRepresentation] allKeys];
	for(NSString *key in keys) {
		[defaultsObject removeObjectForKey:key];
	}
}

-(id)hasProperty:(id)args
{
	ENSURE_SINGLE_ARG(args,NSString);
	return [NSNumber numberWithBool:[self propertyExists:[TiUtils stringValue:args]]];
}

-(id)listProperties:(id)args
{
	return [[defaultsObject dictionaryRepresentation] allKeys];
}

-(void) NSUserDefaultsDidChange
{
	[self fireEvent:@"change" withObject:nil];
}

@end

#endif
