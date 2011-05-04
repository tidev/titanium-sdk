/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_FILESYSTEM

#import "FilesystemModule.h"
#import "TiFilesystemFileProxy.h"
#import "TiFilesystemBlobProxy.h"
#import "TiFilesystemFileStreamProxy.h"

#if TARGET_IPHONE_SIMULATOR 
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

-(id)openStream:(id) args {
	NSString *path;
	NSNumber *fileMode;
	
	ENSURE_ARG_AT_INDEX(fileMode, args, 0, NSNumber);
	ENSURE_VALUE_RANGE([fileMode intValue], TI_READ, TI_APPEND);

	if([args count] < 2) {
		[self throwException:TiExceptionNotEnoughArguments
				   subreason:nil
					location:CODELOCATION];
	}
	
	//allow variadic file components to be passed
	NSArray *pathComponents = [args subarrayWithRange:NSMakeRange(1, [args count] - 1 )];
	NSString *target = [pathComponents componentsJoinedByString:@"/"];

	path = [TiUtils stringValue:target];
	
	NSArray *payload = [NSArray arrayWithObjects:path, fileMode, nil];

	return [[[TiFilesystemFileStreamProxy alloc] _initWithPageContext:[self executionContext] args:payload] autorelease];
}

-(id)MODE_APPEND
{
	return NUMINT(TI_APPEND);
}

-(id)MODE_READ
{
	return NUMINT(TI_READ);
}

-(id)MODE_WRITE
{
	return NUMINT(TI_WRITE);
}

-(id)isExternalStoragePresent:(id)unused
{
	//IOS treats the camera connection kit as just that, and does not allow
	//R/W access to it, which is just as well as it'd mess up cameras.
	return NUMBOOL(NO);
}

-(NSString*)resourcesDirectory
{
#if TARGET_IPHONE_SIMULATOR 
	if (TI_APPLICATION_RESOURCE_DIR!=nil && [TI_APPLICATION_RESOURCE_DIR isEqualToString:@""]==NO)
	{
		// if the .local file exists and we're in the simulator, then force load from resources bundle
		if (![[NSFileManager defaultManager] fileExistsAtPath:[NSString stringWithFormat:@"%@/.local",[[NSBundle mainBundle] resourcePath]]])
		{
			return TI_APPLICATION_RESOURCE_DIR;
		}
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
	
	if ([newpath hasPrefix:[self resourcesDirectory]] &&
		([newpath hasSuffix:@".html"]||
		 [newpath hasSuffix:@".js"]||
		 [newpath hasSuffix:@".css"]))
	{
		NSURL *url = [NSURL fileURLWithPath:newpath];
		NSData *data = [TiUtils loadAppResource:url];
		if (data!=nil)
		{
			return [[[TiFilesystemBlobProxy alloc] initWithURL:url data:data] autorelease];
		}
	}
	
	return [[[TiFilesystemFileProxy alloc] initWithFile:newpath] autorelease];
}

@end

#endif