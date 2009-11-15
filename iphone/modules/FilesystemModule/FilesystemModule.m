/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_FILESYSTEM

#import "FilesystemModule.h"
#import "TitaniumJSCode.h"
#import "TitaniumHost.h"
#import "Logging.h"
#import "TitaniumBlobWrapper.h"

@interface FileProxy : TitaniumProxyObject
{
}

@end

@implementation FileProxy

- (id) init;
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

@interface FileCopy : TitaniumProxyObject
{
	int numberToken;
	NSArray * startPaths;
	NSString * destination;
}
-(id) init: (int) newToken From: (NSArray *) newStartPaths to:(NSString *)newDestination;

@end

@implementation FileCopy

-(id) init: (int) newToken From: (NSArray *) newStartPaths to:(NSString *)newDestination;
{
	self = [super init];
	if (self != nil) {
		numberToken = newToken;
		startPaths = [newStartPaths copy];
		destination = [newDestination copy];
	}
	return self;
}

- (void) dealloc
{
	[startPaths release];
	[destination release];
	[super dealloc];
}

- (void) start;
{
	int filesCopied = 0;
	NSError * error = nil;
	NSFileManager * ourFileManager = [[NSFileManager alloc] init];
	
	
	for(NSString * thisPath in startPaths){
		if(![ourFileManager copyItemAtPath:thisPath toPath:destination error:&error])break;
		filesCopied ++;
	}
	
	NSMutableString * resultString;
	if(error == nil){
		resultString = [[NSMutableString alloc] initWithFormat:@"Ti.Filesystem._COPIES[%d].callback();"];
	}else{
		for(int i=0;i<filesCopied;i++){
			[ourFileManager removeItemAtPath:[startPaths objectAtIndex:i] error:nil];
		}
		resultString = [[NSMutableString alloc] init];
	}
	[resultString appendFormat:@"delete Ti.Filesystem._COPIES[%d];",numberToken];
	
	[self sendJavascript:resultString];
	
	[resultString release];
	[ourFileManager release];
}

@end

//Why do we use preprocessors instead of an enum? Sadly, it's because of the stringify for the
//Javascript side prototypes doesn't let us convert from enum to the int value at preprocessing
//time.
#define FILEPATH_EXISTS				0
#define FILEPATH_ISLOCKED			1
#define FILEPATH_ISLINK				2
#define FILEPATH_CREATIONSTAMP		3
#define FILEPATH_MODIFYSTAMP		4
#define FILEPATH_LISTFILES			5
#define FILEPATH_COPY				6
#define	FILEPATH_MAKEDIRECTORY		7
#define FILEPATH_DELETEDIRECTORY	8
#define FILEPATH_DELETEFILE			9
#define FILEPATH_MAKEFILE			10
#define FILEPATH_MOVE				11
#define FILEPATH_READ				12
#define FILEPATH_WRITE				13
#define FILEPATH_EXTENSION			14
#define FILEPATH_PARENTDIR			15
#define FILEPATH_NAME				16
#define FILEPATH_RESOLVEPATH		17
#define FILEPATH_DRIVESPACE			18
#define FILEPATH_FILESIZE			19

@implementation FilesystemModule

- (id) filePath: (NSString *) path performFunction: (NSNumber *) functNum arguments:(id)args;
{
	Class stringClass = [NSString class];
	if(![path isKindOfClass:stringClass] || ![functNum respondsToSelector:@selector(intValue)])return nil;
	path = [path stringByStandardizingPath];

	switch ([functNum intValue]) {
		case FILEPATH_EXISTS:{
			BOOL result = [[NSFileManager defaultManager] fileExistsAtPath:path];
			return [NSNumber numberWithBool:result];
		}
		case FILEPATH_ISLOCKED:{
			NSError * error=nil;
			NSDictionary * resultDict = [[NSFileManager defaultManager] attributesOfItemAtPath:path error:&error];
//			if(error!=nil)return error;
			return [resultDict objectForKey:NSFileImmutable];
		}
		case FILEPATH_ISLINK:{
			NSError * error=nil;
			NSDictionary * resultDict = [[NSFileManager defaultManager] attributesOfItemAtPath:path error:&error];
//			if(error!=nil)return error;
			BOOL result = [[resultDict objectForKey:NSFileType] isEqualToString:NSFileTypeSymbolicLink];
			return [NSNumber numberWithBool:result];
		}
		case FILEPATH_CREATIONSTAMP:{
			NSError * error=nil;
			NSDictionary * resultDict = [[NSFileManager defaultManager] attributesOfItemAtPath:path error:&error];
			if(error!=nil)return error;
			return [resultDict objectForKey:NSFileCreationDate];
		}
		case FILEPATH_MODIFYSTAMP:{
			NSError * error=nil;
			NSDictionary * resultDict = [[NSFileManager defaultManager] attributesOfItemAtPath:path error:&error];
			if(error!=nil)return error;
			return [resultDict objectForKey:NSFileModificationDate];
		}
		case FILEPATH_LISTFILES:{
			NSError * error=nil;
			NSArray * resultArray = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:path error:&error];
			if(error!=nil)return error;
			return resultArray;			
		}
		case FILEPATH_DRIVESPACE:{
			NSError * error=nil;
			NSDictionary * resultDict = [[NSFileManager defaultManager] attributesOfFileSystemForPath:path error:&error];
			if(error!=nil)return error;
			return [resultDict objectForKey:NSFileSystemFreeSize];
		}
		case FILEPATH_FILESIZE:{
			NSError * error=nil;
			NSDictionary * resultDict = [[NSFileManager defaultManager] attributesOfItemAtPath:path error:&error];
			if(error!=nil)return error;
			return [resultDict objectForKey:NSFileSize];
		}
		case FILEPATH_COPY:{
			if(![args isKindOfClass:[NSString class]])return [NSNumber numberWithBool:NO];
			NSError * error=nil;
			NSString * dest=[args stringByStandardizingPath];
			BOOL result = [[NSFileManager defaultManager] copyItemAtPath:path toPath:dest error:&error];
			VERBOSE_LOG_IF_TRUE((error!=nil),@"Tried to copy file '%@' to '%@', error was %@",path,dest,error);
			return [NSNumber numberWithBool:result];			
		}
		case FILEPATH_MAKEDIRECTORY:{
			NSFileManager * theFM = [NSFileManager defaultManager];
			BOOL result;
			if(![theFM fileExistsAtPath:path]){
				BOOL recurse;
				if([args respondsToSelector:@selector(boolValue)]){
					recurse = [args boolValue];
				} else {
					recurse = NO;
				}
				NSError * error = nil;
				result = [theFM createDirectoryAtPath:path withIntermediateDirectories:recurse attributes:nil error:&error];
				VERBOSE_LOG_IF_TRUE((error!=nil),@"Tried to make a directory at '%@' with recursion '%@', error was %@",path,args,error);
			} else {
				result = NO;
			}
			return [NSNumber numberWithBool:result];
		}
		case FILEPATH_DELETEDIRECTORY:{
			NSFileManager * theFM = [NSFileManager defaultManager];
			BOOL result = NO;
			BOOL isDirectory = NO;
			BOOL exists = [theFM fileExistsAtPath:path isDirectory:&isDirectory];
			if(exists && isDirectory){
				NSError * error = nil;
				BOOL shouldDelete = NO;
				if([args respondsToSelector:@selector(boolValue)] && [args boolValue]){
					shouldDelete = YES;
				} else {
					NSArray * remainers = [theFM contentsOfDirectoryAtPath:path error:&error];
					if(error==nil){
						if([remainers count]==0){
							shouldDelete = YES;
						} else {
							VERBOSE_LOG(@"Denying deleting directory at '%@' because these files remain: %@",path,remainers);
						}
					}
				}
				
				if(shouldDelete){
					result = [theFM removeItemAtPath:path error:&error];
				}
				VERBOSE_LOG_IF_TRUE((error!=nil),@"Tried to delete directory at '%@' with recursion %@, error was %@",path,args,error);
			}
			return [NSNumber numberWithBool:result];
		}
		case FILEPATH_DELETEFILE:{
			NSFileManager * theFM = [NSFileManager defaultManager];
			BOOL result;
			BOOL isDirectory = YES;
			BOOL exists = [theFM fileExistsAtPath:path isDirectory:&isDirectory];
			if(exists && !isDirectory){
				NSError * error = nil;
				result = [theFM removeItemAtPath:path error:&error];
				VERBOSE_LOG_IF_TRUE((error!=nil),@"Tried to delete file at '%@', error was %@",path,args,error);
			} else {
				result = NO;
			}
			return [NSNumber numberWithBool:result];
		}
		case FILEPATH_MAKEFILE:{
			NSFileManager * theFM = [NSFileManager defaultManager];
			BOOL result;
			if(![theFM fileExistsAtPath:path]){
				if([args respondsToSelector:@selector(boolValue)] && [args boolValue]){
					[theFM createDirectoryAtPath:[path stringByDeletingLastPathComponent] withIntermediateDirectories:YES attributes:nil error:nil];
					//We don't care if this fails.
				}
				NSError * error = nil;
				result = [[NSData data] writeToFile:path options:0 error:&error];
				VERBOSE_LOG_IF_TRUE((error!=nil),@"Tried to make a file at '%@' with recursion '%@', error was %@",path,args,error);
			} else {
				result = NO;
			}			
			return [NSNumber numberWithBool:result];
		}
		case FILEPATH_MOVE:{
			if(![args isKindOfClass:[NSString class]])return [NSNumber numberWithBool:NO];
			NSError * error=nil;
			NSString * dest=[args stringByStandardizingPath];
			BOOL result = [[NSFileManager defaultManager] moveItemAtPath:path toPath:dest error:&error];
			VERBOSE_LOG_IF_TRUE((error!=nil),@"Tried to move file '%@' to '%@', error was %@",path,dest,error);
			return [NSNumber numberWithBool:result];			
		}
		case FILEPATH_READ:{
			BOOL exists = [[NSFileManager defaultManager] fileExistsAtPath:path];
			if(!exists) return nil;
			NSError * error = nil;	//TODO: Be tricky. Return to lazyloading with blobForFile, but have write orphan data blobs that have that file path.
			NSData * resultData = [NSData dataWithContentsOfFile:path options:0 error:&error];
			VERBOSE_LOG_IF_TRUE((error!=nil),@"Tried read file '%@', error was %@",path,error);
			return [[TitaniumHost sharedHost] blobForData:resultData];
//			NSStringEncoding enc = 0;
//			NSString * result = [NSString stringWithContentsOfFile:path usedEncoding:&enc error:&error];
//			return result;
		}
		case FILEPATH_WRITE:{
			BOOL result = NO;
			NSError * error = nil;
			if([args isKindOfClass:stringClass]){
				NSStringEncoding enc = [(NSString *)args fastestEncoding];
					result = [(NSString *)args writeToFile:path atomically:NO encoding:enc error:&error];
			} else if([args isKindOfClass:[TitaniumBlobWrapper class]]){
				result = [[(TitaniumBlobWrapper *)args dataBlob] writeToFile:path options:NSAtomicWrite error:&error];
			}
			VERBOSE_LOG_IF_TRUE((error!=nil),@"Tried read write to file '%@', error was %@, data to write was %@",path,error,args);
			return [NSNumber numberWithBool:result];
		}
		case FILEPATH_EXTENSION:{
			return [path pathExtension];
		}
		case FILEPATH_PARENTDIR:{
			return [path stringByDeletingLastPathComponent];
		}
		case FILEPATH_NAME:{
			return [path lastPathComponent];
		}
		case FILEPATH_RESOLVEPATH:{
			return path;
		}
	}
	
	return nil;
}

- (id) makeNewTempPath: (NSNumber *) isDirectoryObject;
{
	if(![isDirectoryObject respondsToSelector:@selector(boolValue)])return nil;
	
	NSFileManager * ourFileManager = [[NSFileManager alloc] init];
	NSString * tempDir = NSTemporaryDirectory();
	NSError * error=nil;
	
	if(![ourFileManager fileExistsAtPath:tempDir]){
		[ourFileManager createDirectoryAtPath:tempDir withIntermediateDirectories:YES attributes:nil error:&error];
		if(error != nil){
			[ourFileManager release];
			return error;
		}
	}
	
	int timestamp = (int)(time(NULL) & 0xFFFFL);
	NSString * resultPath;
	do {
		resultPath = [tempDir stringByAppendingPathComponent:[NSString stringWithFormat:@"%X",timestamp]];
		timestamp ++;
	} while ([ourFileManager fileExistsAtPath:resultPath]);

	if([isDirectoryObject boolValue]){
		[ourFileManager createDirectoryAtPath:resultPath withIntermediateDirectories:NO attributes:nil error:&error];
	} else {
		[[NSData data] writeToFile:resultPath options:0 error:&error];
	}

	[ourFileManager release];

	if(error != nil)return error;
	
	NSString * command = [NSString stringWithFormat:@"Ti.Filesystem.getFile('%@')",resultPath];
	return [TitaniumJSCode codeWithString:command];
}


#pragma mark startModule
#define STRINGIFY(foo)	# foo
#define STRINGVAL(foo)	STRINGIFY(foo)


- (BOOL) startModule;
{
	TitaniumInvocationGenerator * invocGen = [TitaniumInvocationGenerator generatorWithTarget:self];


	[(FilesystemModule *)invocGen filePath:nil performFunction:nil arguments:nil];
	NSInvocation * fileActionInvoc = [invocGen invocation];
	
	[(FilesystemModule *)invocGen makeNewTempPath:nil];
	NSInvocation * fileTempInvoc = [invocGen invocation];
	
	TitaniumJSCode * fileWrapperObjectCode = [TitaniumJSCode codeWithString:@"function(newPath){this.path=newPath;this._HACK=0;}"];
	[fileWrapperObjectCode setEpilogueCode:@"Ti.Filesystem._FILEOBJ.prototype={"
			"path:null,_HACK:0,nativePath:function(){return this.path},"
//Boolean functions
			"exists:function(){return Ti.Filesystem._FILEACT(this.path," STRINGVAL(FILEPATH_EXISTS) ");},"
			"isReadonly:function(){return Ti.Filesystem._FILEACT(this.path," STRINGVAL(FILEPATH_ISLOCKED) ");},"
			"isSymbolicLink:function(){return Ti.Filesystem._FILEACT(this.path," STRINGVAL(FILEPATH_ISLINK) ");},"
			"isWritable:function(){return !this.isReadonly();},"
//Legacy no-ops
			"isExecutable:function(){return false;},"
			"isHidden:function(){return false;},"
			"setReadonly:function(){return false;},"
			"setExecutable:function(){return false;},"
			"setHidden:function(){return false;},"
//Value functions
			"createTimeStamp:function(){return Ti.Filesystem._FILEACT(this.path," STRINGVAL(FILEPATH_CREATIONSTAMP) ");},"
			"modificationTimeStamp:function(){return Ti.Filesystem._FILEACT(this.path," STRINGVAL(FILEPATH_MODIFYSTAMP) ");},"
			"getDirectoryListing:function(){return Ti.Filesystem._FILEACT(this.path," STRINGVAL(FILEPATH_LISTFILES) ");},"
			"size:function(){return Ti.Filesystem._FILEACT(this.path," STRINGVAL(FILEPATH_FILESIZE) ");},"
			"spaceAvailible:function(){return Ti.Filesystem._FILEACT(this.path," STRINGVAL(FILEPATH_DRIVESPACE) ");},"
//Functions that change data
			"copy:function(dest){return Ti.Filesystem._FILEACT(this.path," STRINGVAL(FILEPATH_COPY) ",dest.toString());},"
			"createDirectory:function(recur){return Ti.Filesystem._FILEACT(this.path," STRINGVAL(FILEPATH_MAKEDIRECTORY) ",recur);},"
			"deleteDirectory:function(recur){return Ti.Filesystem._FILEACT(this.path," STRINGVAL(FILEPATH_DELETEDIRECTORY) ",recur);},"
			"deleteFile:function(recur){return Ti.Filesystem._FILEACT(this.path," STRINGVAL(FILEPATH_DELETEFILE) ",recur);},"
			"createFile:function(recur){return Ti.Filesystem._FILEACT(this.path," STRINGVAL(FILEPATH_MAKEFILE) ",recur);},"
			"move:function(dest){var res=Ti.Filesystem._FILEACT(this.path," STRINGVAL(FILEPATH_MOVE) ",dest.toString());this.path=res;},"
			"rename:function(dest){var res=Ti.Filesystem._FILEACT(this.path," STRINGVAL(FILEPATH_MOVE) ",dest.toString());this.path=res;},"
//IO Functions that mean we can't share file objects?
			"read:function(){return Ti.Filesystem._FILEACT(this.path," STRINGVAL(FILEPATH_READ) ");},"
			"write:function(newval){return Ti.Filesystem._FILEACT(this.path," STRINGVAL(FILEPATH_WRITE) ",newval);},"

//Functions that should be done in javascript, but I'm feeling lazy?
			"extension:function(){return Ti.Filesystem._FILEACT(this.path," STRINGVAL(FILEPATH_EXTENSION) ");},"
			"getParent:function(){return Ti.Filesystem._FILEACT(this.path," STRINGVAL(FILEPATH_PARENTDIR) ");},"
			"name:function(){return Ti.Filesystem._FILEACT(this.path," STRINGVAL(FILEPATH_NAME) ");},"
			"resolve:function(){return Ti.Filesystem._FILEACT(this.path," STRINGVAL(FILEPATH_RESOLVEPATH) ");},"

//Maintenance cool whizzy things
			"toString:function(){return this.path;},"
			"};Ti.Filesystem._FILEOBJ.prototype.__defineGetter__('url',function(){this._HACK++;return '/_TIFILE'+this.path+'?'+this._HACK;});"];
	
	TitaniumJSCode * getFileCode = [TitaniumJSCode codeWithString:@"function(newPath){var len=arguments.length;if(len==0)return null;var path;"
			"if(newPath.charAt(0)!='/'){path=Ti.Filesystem.getApplicationDataDirectory()+'/'+newPath;}else{path=newPath;}"
			"for(var i=1;i<len;i++){path+='/'+arguments[i];}var res=Ti.Filesystem._FILES[path];"
			"if(!res){res=new Ti.Filesystem._FILEOBJ(path);Ti.Filesystem._FILES[path]=res;}return res;}"];
	
	TitaniumJSCode * falseFunct = [TitaniumJSCode codeWithString:@"function(){return false;}"];
	
	NSString * resourcePath = [[NSBundle mainBundle] resourcePath];
	NSString * appDirectory = [NSSearchPathForDirectoriesInDomains(NSApplicationDirectory, NSUserDomainMask, YES) objectAtIndex:0];
	NSString * dataDirectory = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0];
	
//	[[NSFileManager defaultManager] changeCurrentDirectoryPath:dataDirectory];

	NSDictionary * moduleDict = [NSDictionary dictionaryWithObjectsAndKeys:

			fileWrapperObjectCode,@"_FILEOBJ",
			fileActionInvoc,@"_FILEACT",
			[TitaniumJSCode codeWithString:@"{}"],@"_FILES",
			
			getFileCode,@"getFile",
			
			fileTempInvoc,@"_MKTMP",
			[TitaniumJSCode codeWithString:@"function(){return Ti.Filesystem._MKTMP(false);}"],@"createTempFile",
			[TitaniumJSCode codeWithString:@"function(){return Ti.Filesystem._MKTMP(true);}"],@"createTempDirectory",
			
			[TitaniumJSCode functionReturning:resourcePath],@"getResourcesDirectory",
			[TitaniumJSCode functionReturning:appDirectory],@"getApplicationDirectory",
			[TitaniumJSCode functionReturning:dataDirectory],@"getApplicationDataDirectory",
			[TitaniumJSCode codeWithString:@"function(){return '/';}"],@"getSeperator",
			[TitaniumJSCode codeWithString:@"function(){return '\\n';}"],@"getLineEnding",

			falseFunct,@"isExteralStoragePresent",
			
			[NSNumber numberWithInt:(int)'A'],@"MODE_APPEND",
			[NSNumber numberWithInt:(int)'R'],@"MODE_READ",
			[NSNumber numberWithInt:(int)'W'],@"MODE_WRITE",
			nil];
	[[[TitaniumHost sharedHost] titaniumObject] setObject:moduleDict forKey:@"Filesystem"];
	
	return YES;
}

@end

#endif