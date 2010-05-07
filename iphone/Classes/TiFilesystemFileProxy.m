/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_FILESYSTEM

#import "TiFilesystemFileProxy.h"
#import "TiUtils.h"
#import "TiBlob.h"


#define FILE_TOSTR(x) \
	([x isKindOfClass:[TiFilesystemFileProxy class]]) ? [(TiFilesystemFileProxy*)x nativePath] : [TiUtils stringValue:x]

@implementation TiFilesystemFileProxy


-(id)initWithFile:(NSString*)path_
{
	if (self = [super init])
	{
		fm = [[NSFileManager alloc] init];
		path = [path_ retain];
	}
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(fm);
	[super dealloc];
}

-(id)nativePath
{
	return path;
}

-(id)exists:(id)args
{
	return NUMBOOL([fm fileExistsAtPath:path]);
}

#define FILEATTR(attr,x,w) \
NSError *error = nil; \
NSDictionary * resultDict = [fm attributesOfItemAtPath:path error:&error];\
if (error!=nil && x) return NUMBOOL(NO);\
return w([resultDict objectForKey:attr]!=nil);\

-(id)readonly
{
	FILEATTR(NSFileImmutable,NO,NUMBOOL);
}

-(id)symbolicLink
{
	FILEATTR(NSFileTypeSymbolicLink,NO,NUMBOOL);
}

-(id)writeable
{
	return NUMBOOL(![self readonly]);
}

-(id)writable
{
	NSLog(@"[WARN] The File.writable method is deprecated and should no longer be used. Use writeable instead.");
	return [self writeable];
}


#define FILENOOP(name) \
-(id)name\
{\
	return NUMBOOL(NO);\
}\

FILENOOP(executable);
FILENOOP(hidden);
FILENOOP(setReadonly:(id)x);
FILENOOP(setExecutable:(id)x);
FILENOOP(setHidden:(id)x);

-(id)createTimestamp:(id)args
{
	FILEATTR(NSFileCreationDate,YES,NUMLONG);
}

-(id)modificationTimestamp:(id)args
{
	FILEATTR(NSFileModificationDate,YES,NUMLONG);
}

-(id)getDirectoryListing:(id)args
{
	NSError * error=nil;
	NSArray * resultArray = [fm contentsOfDirectoryAtPath:path error:&error];
	if(error!=nil)
	{
		//TODO: what should be do?
	}
	return resultArray;
}

-(id)spaceAvailable:(id)args
{
	NSError *error = nil; 
	NSDictionary * resultDict = [fm attributesOfFileSystemForPath:path error:&error];
	if (error!=nil) return NUMBOOL(NO);
	return NUMBOOL([resultDict objectForKey:NSFileSystemFreeSize]!=nil);
}

-(id)createDirectory:(id)args
{
	BOOL result = NO;
	if (![fm fileExistsAtPath:path])
	{
		BOOL recurse = args!=nil && [args count] > 0 ? [TiUtils boolValue:[args objectAtIndex:0]] : NO;
		result = [fm createDirectoryAtPath:path withIntermediateDirectories:recurse attributes:nil error:nil];
	}
	return NUMBOOL(result);
}

-(id)createFile:(id)args
{
	BOOL result = NO;
	if(![fm fileExistsAtPath:path])
	{
		BOOL shouldCreate = args!=nil && [args count] > 0 ? [TiUtils boolValue:[args objectAtIndex:0]] : NO;
		if(shouldCreate)
		{
			[fm createDirectoryAtPath:[path stringByDeletingLastPathComponent] withIntermediateDirectories:YES attributes:nil error:nil];
			//We don't care if this fails.
		}
		result = [[NSData data] writeToFile:path options:0 error:nil];
	}			
	return NUMBOOL(result);
}

-(id)deleteDirectory:(id)args
{
	BOOL result = NO;
	BOOL isDirectory = NO;
	BOOL exists = [fm fileExistsAtPath:path isDirectory:&isDirectory];
	if (exists && isDirectory)
	{
		NSError * error = nil;
		BOOL shouldDelete = args!=nil && [args count] > 0 ? [TiUtils boolValue:[args objectAtIndex:0]] : NO;
		if (!shouldDelete)
		{
			NSArray * remainers = [fm contentsOfDirectoryAtPath:path error:&error];
			if(error==nil)
			{
				if([remainers count]==0)
				{
					shouldDelete = YES;
				} 
			}
		}
		if(shouldDelete)
		{
			result = [fm removeItemAtPath:path error:&error];
		}
	}
	return NUMBOOL(result);
}

-(id)deleteFile:(id)args
{
	BOOL result = NO;
	BOOL isDirectory = YES;
	BOOL exists = [fm fileExistsAtPath:path isDirectory:&isDirectory];
	if(exists && !isDirectory)
	{
		result = [fm removeItemAtPath:path error:nil];
	} 
	return NUMBOOL(result);
}

-(id)move:(id)args
{
	ENSURE_TYPE(args,NSArray);
	NSError * error=nil;
	NSString * arg = [args objectAtIndex:0];
	NSString * file = FILE_TOSTR(arg);
	NSString * dest = [file stringByStandardizingPath];
	BOOL result = [fm moveItemAtPath:path toPath:dest error:&error];
	return NUMBOOL(result);	
}

-(id)rename:(id)args
{
	return [self move:args];
}

-(id)read:(id)args
{
	BOOL exists = [fm fileExistsAtPath:path];
	if(!exists) return nil;
	return [[[TiBlob alloc] initWithFile:path] autorelease];
}

-(id)write:(id)args
{
	ENSURE_TYPE(args,NSArray);
	id arg = [args objectAtIndex:0];
	if ([arg isKindOfClass:[TiBlob class]])
	{
		TiBlob *blob = (TiBlob*)arg;
		return NUMBOOL([blob writeTo:path error:nil]);
	}
	else if ([arg isKindOfClass:[TiFile class]])
	{
		TiFile *file = (TiFile*)arg;
		[[NSFileManager defaultManager] removeItemAtPath:path error:nil];
		NSError *error = nil;
		[[NSFileManager defaultManager] copyItemAtPath:[file path] toPath:path error:&error];
		if (error!=nil)
		{
			NSLog(@"[ERROR] error writing file: %@ to: %@. Error: %@",[file path],path,error);
		}
		return NUMBOOL(error==nil);
	}
	else
	{
		NSString *data = [TiUtils stringValue:arg];
		return NUMBOOL([data writeToFile:path atomically:YES encoding:NSUTF8StringEncoding error:nil]);
	}
}

-(id)extension:(id)args
{
	return [path pathExtension];
}

-(id)getParent:(id)args
{
	return [path stringByDeletingLastPathComponent];
}

-(id)name
{
	return [path lastPathComponent];
}

-(id)resolve:(id)args
{
	return path;
}

-(id)description
{
	return path;
}

+(id)makeTemp:(BOOL)isDirectory
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
		resultPath = [tempDir stringByAppendingPathComponent:[NSString stringWithFormat:@"%X",timestamp]];
		timestamp ++;
	} while ([fm fileExistsAtPath:resultPath]);
	
	if(isDirectory)
	{
		[fm createDirectoryAtPath:resultPath withIntermediateDirectories:NO attributes:nil error:&error];
	} 
	else 
	{
		[[NSData data] writeToFile:resultPath options:0 error:&error];
	}
	
	if (error != nil)
	{
		//TODO: ?
		return nil;
	}
	
	return [[[TiFilesystemFileProxy alloc] initWithFile:resultPath] autorelease];
}

@end

#endif