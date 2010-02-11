/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "Mimetypes.h"

const NSString * htmlMimeType = @"text/html";
const NSString * textMimeType = @"text/plain";
const NSString * jpegMimeType = @"image/jpeg";

@implementation Mimetypes

+ (NSString *)mimeTypeForExtension:(NSString *)ext
{
	static NSDictionary * mimeTypeFromExtensionDict = nil;
	
	if (mimeTypeFromExtensionDict == nil){
		mimeTypeFromExtensionDict = [[NSDictionary alloc] initWithObjectsAndKeys:
									 @"image/png",@"png",@"image/gif",@"gif",
									 jpegMimeType,@"jpeg",jpegMimeType,@"jpg",
									 @"image/x-icon",@"ico",
									 htmlMimeType,@"html",htmlMimeType,@"htm",
									 textMimeType,@"text",textMimeType,@"txt",
									 @"text/json",@"json",					 
									 @"text/javascript",@"js",
									 @"text/css",@"css",
									 @"text/xml",@"xml",
									 @"audio/x-wav",@"wav",
									 @"video/mpeg",@"mov",
									 @"video/mpeg",@"m4v",
									 nil];
	}
	
	NSString *result=[mimeTypeFromExtensionDict objectForKey:[ext pathExtension]];
	if (result == nil){
		result = @"application/octet-stream";
	}
	return result;
}

@end
