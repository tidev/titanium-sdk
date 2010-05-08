/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_FILESYSTEM

#import "FilesystemModule.h"
#import "TiFilesystemFileProxy.h"

#ifdef DEBUG 
extern NSString * TI_APPLICATION_RESOURCE_DIR;
#endif

@implementation FilesystemModule


-(id)createTempFile:(id)args
{
	return [TiFilesystemFileProxy makeTemp:NO];
}

-(id)createTempDirectory:(id)args
{
	return [TiFilesystemFileProxy makeTemp:YES];
}

-(id)MODE_APPEND
{
	return NUMINT((int)'A');
}

-(id)MODE_READ
{
	return NUMINT((int)'R');
}

-(id)MODE_WRITE
{
	return NUMINT((int)'W');
}

-(id)isExteralStoragePresent
{
	return NUMBOOL(NO);
}

-(NSString*)resourcesDirectory
{
#ifdef DEBUG 
	if (TI_APPLICATION_RESOURCE_DIR!=nil && [TI_APPLICATION_RESOURCE_DIR isEqualToString:@""]==NO)
	{
		return TI_APPLICATION_RESOURCE_DIR;
	}
#endif
	return [[NSBundle mainBundle] resourcePath];
}

-(NSString*)applicationDirectory
{
	return [NSSearchPathForDirectoriesInDomains(NSApplicationDirectory, NSUserDomainMask, YES) objectAtIndex:0];
}

-(NSString*)applicationSupportDirectory
{
	return [NSSearchPathForDirectoriesInDomains(NSApplicationSupportDirectory, NSUserDomainMask, YES) objectAtIndex:0];
}

-(NSString*)applicationDataDirectory
{
	return [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0];
}

-(NSString*)tempDirectory
{
	return NSTemporaryDirectory();
}

-(NSString*)separator
{
	return @"/";
}

-(NSString*)lineEnding
{
	return @"\n";
}

// internal
-(id)resolveFile:(id)arg
{
	if ([arg isKindOfClass:[TiFilesystemFileProxy class]])
	{
		return [arg path];
	}
	return [TiUtils stringValue:arg];
}

-(id)getFile:(id)args
{
	NSMutableString *newpath = [[[NSMutableString alloc] init] autorelease];
	id first = [args objectAtIndex:0];
	if ([first characterAtIndex:0]!='/')
	{
		[newpath appendFormat:@"%@/%@",[self resourcesDirectory],[self resolveFile:first]];
	}
	else 
	{
		[newpath appendString:[self resolveFile:first]];
	}
	
	if ([args count] > 1)
	{
		for (int c=1;c<[args count];c++)
		{
			[newpath appendFormat:@"/%@",[self resolveFile:[args objectAtIndex:c]]];
		}
	}
	return [[[TiFilesystemFileProxy alloc] initWithFile:newpath] autorelease];
}

@end

#endif