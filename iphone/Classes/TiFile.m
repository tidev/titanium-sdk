/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiFile.h"
#import "TiBlob.h"


@implementation TiFile

-(void)dealloc
{
	if (deleteOnExit)
	{
		[[NSFileManager defaultManager] removeItemAtPath:path error:nil];
	}
	RELEASE_TO_NIL(path);
	[super dealloc];
}

-(id)initWithPath:(NSString*)path_
{
	if ([self init])
	{
		path = [path_ retain];
	}
	return self;
}

-(id)initWithTempFilePath:(NSString*)path_
{
	if ([self initWithPath:path_])
	{
		deleteOnExit=YES;
	}
	return self;
}

-(NSString*)path
{
	return path;
}

-(NSInteger)size
{
	NSFileManager *fm = [NSFileManager defaultManager];
	NSError *error = nil; 
	NSDictionary * resultDict = [fm attributesOfItemAtPath:path error:&error];
	id result = [resultDict objectForKey:NSFileSize];
	if (error!=NULL)
	{
		return 0;
	}
	return [result intValue];
}

-(id)blob
{
	return [[[TiBlob alloc] initWithFile:path] autorelease];
}

-(id)toBlob:(id)args
{
	return [self blob];
}

+(TiFile*)createTempFile:(NSString*)extension
{
	NSString * tempDir = NSTemporaryDirectory();
	NSError * error=nil;
	
	NSFileManager *fm = [NSFileManager defaultManager];
	if(![fm fileExistsAtPath:tempDir])
	{
		[fm createDirectoryAtPath:tempDir withIntermediateDirectories:YES attributes:nil error:&error];
		if(error != nil)
		{
			//TODO: ?
			return nil;
		}
	}
	
	int timestamp = (int)(time(NULL) & 0xFFFFL);
	NSString * resultPath;
	do 
	{
		resultPath = [tempDir stringByAppendingPathComponent:[NSString stringWithFormat:@"%X.%@",timestamp,extension]];
		timestamp ++;
	} while ([fm fileExistsAtPath:resultPath]);
	
	// create empty file
	[[NSData data] writeToFile:resultPath options:0 error:&error];
	
	if (error != nil)
	{
		//TODO: ?
		return nil;
	}
	
	return [[[TiFile alloc] initWithTempFilePath:resultPath] autorelease];
}

@end
