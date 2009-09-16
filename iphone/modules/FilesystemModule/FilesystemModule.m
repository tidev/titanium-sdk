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
	
	[[TitaniumHost sharedHost] sendJavascript:resultString toPageWithToken:[self parentPageToken]];
	
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

@implementation FilesystemModule

- (id) filePath: (NSString *) path performFunction: (NSNumber *) functNum arguments:(id)args;
{
	Class stringClass = [NSString class];
	if(![path isKindOfClass:stringClass] || ![functNum respondsToSelector:@selector(intValue)])return nil;
	switch ([functNum intValue]) {
		case FILEPATH_EXISTS:{
			path = [path stringByStandardizingPath];
			BOOL result = [[NSFileManager defaultManager] fileExistsAtPath:path];
			return [NSNumber numberWithBool:result];
		}
		case FILEPATH_ISLOCKED:{
			path = [path stringByStandardizingPath];
			NSDictionary * resultDict = [[NSFileManager defaultManager] fileAttributesAtPath:path traverseLink:NO];
			return [resultDict objectForKey:NSFileImmutable];
		}
		case FILEPATH_ISLINK:{
			path = [path stringByStandardizingPath];
			NSDictionary * resultDict = [[NSFileManager defaultManager] fileAttributesAtPath:path traverseLink:NO];
			BOOL result = [[resultDict objectForKey:NSFileType] isEqualToString:NSFileTypeSymbolicLink];
			return [NSNumber numberWithBool:result];
		}
		case FILEPATH_CREATIONSTAMP:{
			path = [path stringByStandardizingPath];
			NSDictionary * resultDict = [[NSFileManager defaultManager] fileAttributesAtPath:path traverseLink:NO];
			return [resultDict objectForKey:NSFileCreationDate];
		}
		case FILEPATH_MODIFYSTAMP:{
			path = [path stringByStandardizingPath];
			NSDictionary * resultDict = [[NSFileManager defaultManager] fileAttributesAtPath:path traverseLink:NO];
			return [resultDict objectForKey:NSFileModificationDate];
		}
		case FILEPATH_LISTFILES:{
			NSError * error=nil;
			path = [path stringByStandardizingPath];
			NSArray * resultArray = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:path error:&error];
			if(error!=nil)return error;
			return resultArray;			
		}
		case FILEPATH_COPY:{
			if(![args isKindOfClass:[NSString class]])return [NSNumber numberWithBool:NO];
			NSError * error=nil;
			NSString * dest=[args stringByStandardizingPath];
			path = [path stringByStandardizingPath];
			BOOL result = [[NSFileManager defaultManager] copyItemAtPath:path toPath:dest error:&error];
			if(error!=nil){
				VERBOSE_LOG(@"Tried to copy file '%@' to '%@', error was %@",path,dest,error);
			}
			return [NSNumber numberWithBool:result];			
		}
		case FILEPATH_MAKEDIRECTORY:{
			NSFileManager * theFM = [NSFileManager defaultManager];
			BOOL result;
			path = [path stringByStandardizingPath];
			if(![theFM fileExistsAtPath:path]){
				BOOL recurse;
				if([args respondsToSelector:@selector(boolValue)]){
					recurse = [args boolValue];
				} else {
					recurse = NO;
				}
				NSError * error = nil;
				result = [theFM createDirectoryAtPath:path withIntermediateDirectories:recurse attributes:nil error:&error];
				if(error != nil){
					VERBOSE_LOG(@"Tried to make a directory at '%@' with recursion '%@', error was %@",path,args,error);
				}
			} else {
				result = NO;
			}
			return [NSNumber numberWithBool:result];
		}
		case FILEPATH_DELETEDIRECTORY:{
			NSFileManager * theFM = [NSFileManager defaultManager];
			BOOL result;
			BOOL isDirectory = NO;
			path = [path stringByStandardizingPath];
			BOOL exists = [theFM fileExistsAtPath:path isDirectory:&isDirectory];
			if(exists && isDirectory){
				NSError * error = nil;
				result = [theFM removeItemAtPath:path error:&error];
				if(error != nil){
					VERBOSE_LOG(@"Tried to delete directory at '%@', error was %@",path,args,error);
				}
			} else {
				result = NO;
			}
			return [NSNumber numberWithBool:result];
		}
		case FILEPATH_DELETEFILE:{
			NSFileManager * theFM = [NSFileManager defaultManager];
			BOOL result;
			BOOL isDirectory = YES;
			path = [path stringByStandardizingPath];
			BOOL exists = [theFM fileExistsAtPath:path isDirectory:&isDirectory];
			if(exists && !isDirectory){
				NSError * error = nil;
				result = [theFM removeItemAtPath:path error:&error];
				if(error != nil){
					VERBOSE_LOG(@"Tried to delete file at '%@', error was %@",path,args,error);
				}
			} else {
				result = NO;
			}
			return [NSNumber numberWithBool:result];
		}
		case FILEPATH_MAKEFILE:{
			NSFileManager * theFM = [NSFileManager defaultManager];
			BOOL result;
			path = [path stringByStandardizingPath];
			if(![theFM fileExistsAtPath:path]){
				if([args respondsToSelector:@selector(boolValue)] && [args boolValue]){
					[theFM createDirectoryAtPath:[path stringByDeletingLastPathComponent] withIntermediateDirectories:YES attributes:nil error:nil];
					//We don't care if this fails.
				}
				NSError * error = nil;
				result = [theFM createFileAtPath:path contents:nil attributes:nil];
				if(error != nil){
					VERBOSE_LOG(@"Tried to make a file at '%@' with recursion '%@', error was %@",path,args,error);
				}
			} else {
				result = NO;
			}			
			return [NSNumber numberWithBool:result];
		}
		case FILEPATH_MOVE:{
			if(![args isKindOfClass:[NSString class]])return [NSNumber numberWithBool:NO];
			NSError * error=nil;
			path = [path stringByStandardizingPath];
			NSString * dest=[args stringByStandardizingPath];
			BOOL result = [[NSFileManager defaultManager] moveItemAtPath:path toPath:dest error:&error];
			if(error!=nil){
				VERBOSE_LOG(@"Tried to move file '%@' to '%@', error was %@",path,dest,error);
			}
			return [NSNumber numberWithBool:result];			
		}
		case FILEPATH_READ:{
			
		}
		case FILEPATH_WRITE:{
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
			return [path stringByStandardizingPath];
		}
	}
	
	return nil;
}



- (void) doAsyncFileCopy: (NSNumber *) copyToken from:(id)sourceObj to:(id)destObj;
{
	if(fileCopyQueue == nil){
		fileCopyQueue = [[NSOperationQueue alloc] init];
	}
	FileCopy * ourFileCopy = [[FileCopy alloc] init:[copyToken intValue] From:sourceObj to:destObj];
	
	NSInvocationOperation * ourOp = [[NSInvocationOperation alloc] initWithTarget:ourFileCopy selector:@selector(begin) object:nil];
	[fileCopyQueue addOperation:ourOp];
	[ourOp release];
	[ourFileCopy release];
}


#pragma mark startModule
#define STRINGIFY(foo)	# foo
#define STRINGVAL(foo)	STRINGIFY(foo)


- (BOOL) startModule;
{
	TitaniumInvocationGenerator * invocGen = [TitaniumInvocationGenerator generatorWithTarget:self];
	
//	[(FilesystemModule *)invocGen doAsyncFileCopy:nil from:nil to:nil];
//	NSInvocation * asyncCopyInvoc = [invocGen invocation];

	[(FilesystemModule *)invocGen filePath:nil performFunction:nil arguments:nil];
	NSInvocation * fileActionInvoc = [invocGen invocation];
	
//	TitaniumJSCode * asyncCopyObjectCode = [TitaniumJSCode codeWithString:@"function(call){this.running=true;this.callback=call;}"];
////	[asyncCopyObjectCode setEpilogueCode:@"Ti.Filesystem.AsyncCopyObj.prototype={};"];
//	TitaniumJSCode * asyncCopyCode = [TitaniumJSCode codeWithString:@"function(src,dst,call){var res=new Ti.Filesystem._ASYNCOBJ(call);"
//			"var tkn=Ti.Filesystem._FILESYSTKN++;Ti.Filesystem._COPIES[tkn]=res;Ti.Filesystem._ASYNCCOPYACT(tkn,src,dst);"
//			"return res;}"];
	
	TitaniumJSCode * fileWrapperObjectCode = [TitaniumJSCode codeWithString:@"function(newPath){this.path=newPath;}"];
	[fileWrapperObjectCode setEpilogueCode:@"Ti.Filesystem._FILEOBJ.prototype={"
			"path:null,nativePath:function(){return this.path},"
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
			"};"];
	
	TitaniumJSCode * getFileCode = [TitaniumJSCode codeWithString:@"function(newPath){var len=arguments.length;if(len==0)return null;var path=newPath;"
			"for(var i=1;i<len;i++){path+='/'+arguments[i];}var res=Ti.Filesystem._FILES[path];"
			"if(!res){res=new Ti.Filesystem._FILEOBJ(path);Ti.Filesystem._FILES[path]=res;}return res;}"];
	
	TitaniumJSCode * falseFunct = [TitaniumJSCode codeWithString:@"function(){return false;}"];
	
	NSDictionary * moduleDict = [NSDictionary dictionaryWithObjectsAndKeys:
			[NSNumber numberWithInt:0],@"_FILESYSTKN",

//			asyncCopyObjectCode,@"_ASYNCOBJ",
			fileWrapperObjectCode,@"_FILEOBJ",
			fileActionInvoc,@"_FILEACT",
			
//			[TitaniumJSCode codeWithString:@"{}"],@"_COPIES",
			[TitaniumJSCode codeWithString:@"{}"],@"_FILES",
//			asyncCopyInvoc,@"_ASYNCCOPYACT",
//			asyncCopyCode,@"asyncCopy",
			
			getFileCode,@"getFile",
			
			[TitaniumJSCode functionReturning:[[NSBundle mainBundle] resourcePath]],@"getResourcesDirectory",
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