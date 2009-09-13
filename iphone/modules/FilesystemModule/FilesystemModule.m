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




@implementation FilesystemModule

- (id) filePath: (NSString *) path performFunction: (NSString *) functName arguments:(id)args;
{
	Class stringClass = [NSString class];
	if(![path isKindOfClass:stringClass] || ![functName isKindOfClass:stringClass])return nil;
	
	if([functName isEqualToString:@"EXISTP"]){
		BOOL result = [[NSFileManager defaultManager] fileExistsAtPath:path];
		return [NSNumber numberWithBool:result];
	}
	if([functName isEqualToString:@"EXECP"]){
		NSDictionary * resultDict = [[NSFileManager defaultManager] fileAttributesAtPath:path traverseLink:NO];
		return [resultDict objectForKey:NSFilePosixPermissions];
	}
	if([functName isEqualToString:@"LOCKP"]){
		NSDictionary * resultDict = [[NSFileManager defaultManager] fileAttributesAtPath:path traverseLink:NO];
		return [resultDict objectForKey:NSFileImmutable];
	}
	if([functName isEqualToString:@"LINKP"]){
		NSDictionary * resultDict = [[NSFileManager defaultManager] fileAttributesAtPath:path traverseLink:NO];
		BOOL result = [[resultDict objectForKey:NSFileType] isEqualToString:NSFileTypeSymbolicLink];
		return [NSNumber numberWithBool:result];
	}

	if([functName isEqualToString:@"MADEST"]){
		NSDictionary * resultDict = [[NSFileManager defaultManager] fileAttributesAtPath:path traverseLink:NO];
		return [resultDict objectForKey:NSFileCreationDate];
	}
	if([functName isEqualToString:@"MODST"]){
		NSDictionary * resultDict = [[NSFileManager defaultManager] fileAttributesAtPath:path traverseLink:NO];
		return [resultDict objectForKey:NSFileModificationDate];
	}
	if([functName isEqualToString:@"LS"]){
		NSError * error=nil;
		NSArray * resultArray = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:path error:&error];
		if(error!=nil)return error;
		return resultArray;
	}
	


	if([functName isEqualToString:@"EXT"]){
		return [path pathExtension];
	}
	if([functName isEqualToString:@"PARENT"]){
		return [path stringByDeletingLastPathComponent];
	}
	if([functName isEqualToString:@"NAME"]){
		return [path lastPathComponent];
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

- (BOOL) startModule;
{
	TitaniumInvocationGenerator * invocGen = [TitaniumInvocationGenerator generatorWithTarget:self];
	
	[(FilesystemModule *)invocGen doAsyncFileCopy:nil from:nil to:nil];
	NSInvocation * asyncCopyInvoc = [invocGen invocation];

	[(FilesystemModule *)invocGen filePath:nil performFunction:nil arguments:nil];
	NSInvocation * fileActionInvoc = [invocGen invocation];
	
	TitaniumJSCode * asyncCopyObjectCode = [TitaniumJSCode codeWithString:@"function(call){this.running=true;this.callback=call;}"];
//	[asyncCopyObjectCode setEpilogueCode:@"Ti.Filesystem.AsyncCopyObj.prototype={};"];
	TitaniumJSCode * asyncCopyCode = [TitaniumJSCode codeWithString:@"function(src,dst,call){var res=new Ti.Filesystem._ASYNCOBJ(call);"
			"var tkn=Ti.Filesystem._FILESYSTKN++;Ti.Filesystem._COPIES[tkn]=res;Ti.Filesystem._ASYNCCOPYACT(tkn,src,dst);"
			"return res;}"];
	
	TitaniumJSCode * fileWrapperObjectCode = [TitaniumJSCode codeWithString:@"function(newPath){this.path=newPath;}"];
	[fileWrapperObjectCode setEpilogueCode:@"Ti.Filesystem._FILEOBJ.prototype={"
			"path:null,nativePath:function(){return this.path},"
//Boolean functions
			"exists:function(){return Ti.Filesystem._FILEACT(this.path,'EXISTP');},"
			"isExecutable:function(){return Ti.Filesystem._FILEACT(this.path,'EXECP');},"
			"isHidden:function(){return false;}," //Really. This necessary?
			"isReadonly:function(){return Ti.Filesystem._FILEACT(this.path,'LOCKP');},"
			"isSymbolicLink:function(){return Ti.Filesystem._FILEACT(this.path,'LINKP');},"
			"isWritable:function(){return !this.isReadonly();},"
//Value functions
			"createTimeStamp:function(){return Ti.Filesystem._FILEACT(this.path,'MADEST');},"
			"modificationTimeStamp:function(){return Ti.Filesystem._FILEACT(this.path,'MODST');},"
			"getDirectoryListing:function(){return Ti.Filesystem._FILEACT(this.path,'LS');},"
//Functions that change data
			"copy:function(dest){return Ti.Filesystem._FILEACT(this.path,'COPY',dest);},"
			"createDirectory:function(dest){return Ti.Filesystem._FILEACT(this.path,'MKDIR',dest);},"
			"deleteDirectory:function(dest){return Ti.Filesystem._FILEACT(this.path,'RMRF',dest);},"
			"deleteFile:function(dest){return Ti.Filesystem._FILEACT(this.path,'RM',dest);},"
			"move:function(dest){var res=Ti.Filesystem._FILEACT(this.path,'MOVE',dest);this.path=res;},"
			"rename:function(dest){var res=Ti.Filesystem._FILEACT(this.path,'MOVE',dest);this.path=res;},"
//Functions that mean we can't share file objects?
			//Read readline

//Functions that should be done in javascript, but I'm feeling lazy?
			"extension:function(){return Ti.Filesystem._FILEACT(this.path,'EXT');},"
			"getParent:function(){return Ti.Filesystem._FILEACT(this.path,'PARENT');},"
			"name:function(){return Ti.Filesystem._FILEACT(this.path,'NAME');},"
			"};"];
	
	TitaniumJSCode * getFileCode = [TitaniumJSCode codeWithString:@"function(newPath){var len=arguments.length;if(len==0)return null;var path=newPath;"
			"for(var i=1;i<len;i++){path+='/'+arguments[i];}var res=Ti.Filesystem._FILES[path];"
			"if(!res){res=new Ti.Filesystem._FILEOBJ(path);Ti.Filesystem._FILES[path]=res;}return res;}"];
	
	NSDictionary * moduleDict = [NSDictionary dictionaryWithObjectsAndKeys:
			[NSNumber numberWithInt:0],@"_FILESYSTKN",

			asyncCopyObjectCode,@"_ASYNCOBJ",
			fileWrapperObjectCode,@"_FILEOBJ",
			fileActionInvoc,@"_FILEACT",
			
			[TitaniumJSCode codeWithString:@"{}"],@"_COPIES",
			[TitaniumJSCode codeWithString:@"{}"],@"_FILES",
			asyncCopyInvoc,@"_ASYNCCOPYACT",
			asyncCopyCode,@"asyncCopy",
			
			getFileCode,@"getFile",
			
			[NSNumber numberWithInt:(int)'A'],@"MODE_APPEND",
			[NSNumber numberWithInt:(int)'R'],@"MODE_READ",
			[NSNumber numberWithInt:(int)'W'],@"MODE_WRITE",
			nil];
	[[[TitaniumHost sharedHost] titaniumObject] setObject:moduleDict forKey:@"Filesystem"];
	
	return YES;
}

@end

#endif