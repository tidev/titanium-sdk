/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_FILESYSTEM

#import "TiUtils.h"
#import "TiBlob.h"
#import "TiFilesystemFileProxy.h"
#import "TiFilesystemFileStreamProxy.h"

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
    RELEASE_TO_NIL(path);
	[super dealloc];
}

-(id)nativePath
{
	return [[NSURL fileURLWithPath:path] absoluteString];
}

-(id)exists:(id)args
{
	return NUMBOOL([fm fileExistsAtPath:path]);
}

#define FILEATTR(propName,attrKey,throwError) \
-(id) propName	\
{	\
	NSError *error = nil; \
	NSDictionary * resultDict = [fm attributesOfItemAtPath:path error:&error];\
	if ((throwError) && error!=nil)	\
	{	\
		[self throwException:TiExceptionOSError subreason:[error localizedDescription] location:CODELOCATION];	\
	}	\
	return [resultDict objectForKey:attrKey];\
}

FILEATTR(readonly,NSFileImmutable,NO)
FILEATTR(modificationTimestamp,NSFileModificationDate,YES);

-(id)createTimestamp
{	
	NSError *error = nil; 
	NSDictionary * resultDict = [fm attributesOfItemAtPath:path error:&error];
	if ((YES) && error!=nil)	
	{	
		[self throwException:TiExceptionOSError subreason:[error localizedDescription] location:CODELOCATION];	
	}	
	// Have to do this one up special because of 3.x bug where NSFileCreationDate is sometimes undefined
	id result = [resultDict objectForKey:NSFileCreationDate];
	if (result == nil) {
		result = [resultDict objectForKey:NSFileModificationDate];
	}
	return result;
}

//TODO: Should this be a method or a property? Until then, do both.
-(id)createTimestamp:(id)args
{
	return [self createTimestamp];
}

-(id)modificationTimestamp:(id)args
{
	return [self modificationTimestamp];
}

-(id)symbolicLink
{
	NSError *error = nil;
	NSDictionary * resultDict = [fm attributesOfItemAtPath:path error:&error];
	if (error!=nil)
	{
		[self throwException:TiExceptionOSError subreason:[error localizedDescription] location:CODELOCATION];
	}
	NSString * fileType = [resultDict objectForKey:NSFileType];

	return NUMBOOL([fileType isEqualToString:NSFileTypeSymbolicLink]);
}

-(id)writeable
{
	return NUMBOOL(![[self readonly] boolValue]);
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
	return [resultDict objectForKey:NSFileSystemFreeSize];
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

-(TiFilesystemFileStreamProxy *) open:(id) args {
	NSNumber *mode;
	ENSURE_ARG_AT_INDEX(mode, args, 0, NSNumber);
	ENSURE_VALUE_RANGE([mode intValue], TI_READ, TI_APPEND);
	
	NSArray *payload = [NSArray arrayWithObjects:[self path], mode, nil];
	
	return [[[TiFilesystemFileStreamProxy alloc] _initWithPageContext:[self executionContext] args:payload] autorelease];
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
		result = [[NSData data] writeToFile:path options:NSDataWritingFileProtectionComplete error:nil];
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

-(NSString *)_grabFirstArgumentAsFileName_:(id)args {
    NSString * arg = [args objectAtIndex:0];
    NSString * file = FILE_TOSTR(arg);
	NSURL * fileUrl = [NSURL URLWithString:file];
	if([fileUrl isFileURL]){
		file = [fileUrl path];
	}
    NSString * dest = [file stringByStandardizingPath];

    return dest;
}

-(id)move:(id)args
{
	ENSURE_TYPE(args,NSArray);
	NSError * error=nil;
	NSString * dest = [self _grabFirstArgumentAsFileName_:args];
    
    if (![dest isAbsolutePath]) {
        NSString * subpath = [path stringByDeletingLastPathComponent];
        dest = [subpath stringByAppendingPathComponent:dest];
    }
    
	BOOL result = [fm moveItemAtPath:path toPath:dest error:&error];
	return NUMBOOL(result);	
}

-(id)rename:(id)args
{
    ENSURE_TYPE(args,NSArray);
	NSString * dest = [self _grabFirstArgumentAsFileName_:args];
    NSString * ourSubpath = [path stringByDeletingLastPathComponent];
    
    if ([dest isAbsolutePath]) {
        NSString * destSubpath = [dest stringByDeletingLastPathComponent];

        if (![ourSubpath isEqualToString:destSubpath]) {
            return NUMBOOL(NO); // rename is not move
        }
    }
    
    return [self move:args];
}

-(id)read:(id)args
{
	BOOL exists = [fm fileExistsAtPath:path];
	if(!exists) return nil;
	return [[[TiBlob alloc] initWithFile:path] autorelease];
}

-(id)append:(id)args
{
	ENSURE_TYPE(args,NSArray);
	id arg = [args objectAtIndex:0];

	if([arg isKindOfClass:[TiFile class]]) {
		//allow the ability to append files to another file
		//e.g. file.append(Ti.Filesystem.getFile('somewhere'));
		
		TiFile *file_arg = (TiFile *) arg;
		NSError *err = nil;
		NSString *contents = [NSString stringWithContentsOfFile:[file_arg path] encoding:NSUTF8StringEncoding error:&err];
		if(contents != nil && err == nil) {
			arg = contents;
		} else {
			NSLog(@"[ERROR] Can't open file (%@) for reading!\n%@", [file_arg path], err);
			return NUMBOOL(NO);
		}
	}		

	if ([arg isKindOfClass:[TiBlob class]] ||
		[arg isKindOfClass:[NSString class]]) {
		
		NSData *data = nil;
		if([arg isKindOfClass:[NSString class]]) {
			data = [arg dataUsingEncoding:NSUTF8StringEncoding];
		} else {
			data = [(TiBlob*) arg data];
		}
		
		if(data == nil) {
			return NUMBOOL(NO);
		}
				
		if(![fm fileExistsAtPath:path]) {
			//create the file if it doesn't exist already
			NSError *writeError = nil;
			[data writeToFile:path options:NSDataWritingFileProtectionComplete | NSDataWritingAtomic error:&writeError];
			if(writeError != nil) {
				NSLog(@"[ERROR] Could not write data to file at path \"%@\"", path);
			}
			return NUMBOOL(writeError == nil);
		}	
		
		NSFileHandle *handle = [NSFileHandle fileHandleForUpdatingAtPath:path];

		unsigned long long offset = [handle seekToEndOfFile];
		[handle writeData:data];
		
		BOOL success = ([handle offsetInFile] - offset) == [data length];		
		[handle closeFile];
		
		return NUMBOOL(success);
	} else {
		NSLog(@"[ERROR] Can only append blobs and strings");
	}
	return NUMBOOL(NO);
}

-(id)write:(id)args
{
	ENSURE_TYPE(args,NSArray);	
	id arg = [args objectAtIndex:0];

	//Short-circuit against non-supported types
	if(!([arg isKindOfClass:[TiFile class]] || [arg isKindOfClass:[TiBlob class]] 
		 || [arg isKindOfClass:[NSString class]])) {
		return NUMBOOL(NO);
	}
	
	if([args count] > 1) {
		ENSURE_TYPE([args objectAtIndex:1], NSNumber);
		
		//We have a second argument, is it truthy?
		//If yes, we'll hand the args to -append:
		NSNumber *append = [args objectAtIndex:1];
		if([append boolValue] == YES) {
			return [self append:[args subarrayWithRange:NSMakeRange(0, 1)]];
		}
	}
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
    NSString* dataString = [TiUtils stringValue:arg];
    NSData* data = [dataString dataUsingEncoding:NSUTF8StringEncoding];
	NSError *err = nil;
    [data writeToFile:path options:NSDataWritingFileProtectionComplete | NSDataWritingAtomic error:&err];
	if(err != nil) {
		NSLog(@"[ERROR] Could not write data to file at path \"%@\" - details: %@", path, err);
	}
	return NUMBOOL(err == nil);
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
		[[NSData data] writeToFile:resultPath options:NSDataWritingFileProtectionComplete error:&error];
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
