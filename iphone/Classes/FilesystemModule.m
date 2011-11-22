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
#import "TiHost.h"

#if TARGET_IPHONE_SIMULATOR 
extern NSString * TI_APPLICATION_RESOURCE_DIR;
#endif

@implementation FilesystemModule

// internal
-(id)resolveFile:(id)arg
{
	if ([arg isKindOfClass:[TiFilesystemFileProxy class]])
	{
		return [arg path];
	}
	return [TiUtils stringValue:arg];
}

-(NSString*)pathFromComponents:(NSArray*)args
{
	NSString * newpath;
	id first = [args objectAtIndex:0];
	if ([first hasPrefix:@"file://localhost/"])
	{
		NSURL * fileUrl = [NSURL URLWithString:first];
		//Why not just crop? Because the url may have some things escaped that need to be unescaped.
		newpath =[fileUrl path];
	}
	else if ([first characterAtIndex:0]!='/')
	{
		NSURL* url = [NSURL URLWithString:[self resourcesDirectory]];
        newpath = [[url path] stringByAppendingPathComponent:[self resolveFile:first]];
	}
	else 
	{
		newpath = [self resolveFile:first];
	}
	
	if ([args count] > 1)
	{
		for (int c=1;c<[args count];c++)
		{
			newpath = [newpath stringByAppendingPathComponent:[self resolveFile:[args objectAtIndex:c]]];
		}
	}
    
    return [newpath stringByStandardizingPath];
}

-(id)createTempFile:(id)args
{
	return [TiFilesystemFileProxy makeTemp:NO];
}

-(id)createTempDirectory:(id)args
{
	return [TiFilesystemFileProxy makeTemp:YES];
}

-(id)openStream:(id) args {
	NSNumber *fileMode = nil;
	
	ENSURE_ARG_AT_INDEX(fileMode, args, 0, NSNumber);
	ENSURE_VALUE_RANGE([fileMode intValue], TI_READ, TI_APPEND);

	if([args count] < 2) {
		[self throwException:TiExceptionNotEnoughArguments
				   subreason:nil
					location:CODELOCATION];
	}
	
	//allow variadic file components to be passed
	NSArray *pathComponents = [args subarrayWithRange:NSMakeRange(1, [args count] - 1 )];
	NSString *path = [self pathFromComponents:pathComponents];
    
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

#define fileURLify(foo)	[[NSURL fileURLWithPath:foo isDirectory:YES] absoluteString]

-(NSString*)resourcesDirectory
{
	return fileURLify([TiHost resourcePath]);
}

-(NSString*)applicationDirectory
{
	return fileURLify([NSSearchPathForDirectoriesInDomains(NSApplicationDirectory, NSUserDomainMask, YES) objectAtIndex:0]);
}

-(NSString*)applicationSupportDirectory
{
	return fileURLify([NSSearchPathForDirectoriesInDomains(NSApplicationSupportDirectory, NSUserDomainMask, YES) objectAtIndex:0]);
}

-(NSString*)applicationDataDirectory
{
	return fileURLify([NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0]);
}

-(NSString*)tempDirectory
{
	return fileURLify(NSTemporaryDirectory());
}

-(NSString*)separator
{
	return @"/";
}

-(NSString*)lineEnding
{
	return @"\n";
}

-(id)getFile:(id)args
{
	NSString* newpath = [self pathFromComponents:args];
    
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