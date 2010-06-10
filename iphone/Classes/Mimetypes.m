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
const NSString * svgMimeType = @"image/svg+xml";

static NSDictionary * mimeTypeFromExtensionDict = nil;

@implementation Mimetypes

+ (void)initialize
{
	if (mimeTypeFromExtensionDict == nil)
	{
		mimeTypeFromExtensionDict = [[NSDictionary alloc] initWithObjectsAndKeys:
									 @"image/png",@"png",@"image/gif",@"gif",
									 jpegMimeType,@"jpg",jpegMimeType,@"jpeg",
									 @"image/x-icon",@"ico",
									 htmlMimeType,@"html",htmlMimeType,@"htm",
									 textMimeType,@"text",textMimeType,@"txt",
									 svgMimeType,@"svgz",svgMimeType,@"svg",
									 @"text/json",@"json",
									 @"text/javascript",@"js",
									 @"text/x-javascript",@"js",
									 @"application/x-javascript",@"js",
									 @"text/css",@"css",
									 @"text/xml",@"xml",
									 @"audio/x-wav",@"wav",
									 @"video/mpeg",@"mov",
									 @"video/mpeg",@"m4v",
									 nil];
	}
}

+ (NSString *)extensionForMimeType:(NSString *)mimetype
{
	[Mimetypes initialize];
	for (NSString *key in mimeTypeFromExtensionDict)
	{
		NSString *value = [mimeTypeFromExtensionDict objectForKey:key];
		if ([value isEqualToString:mimetype])
		{
			return key;
		}
	}
	return @"bin";
}

+ (NSString *)mimeTypeForExtension:(NSString *)ext
{
	[Mimetypes initialize];
	NSString *result=[mimeTypeFromExtensionDict objectForKey:[ext pathExtension]];
	if (result == nil){
		result = @"application/octet-stream";
	}
	return result;
}

@end
