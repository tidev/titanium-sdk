/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <MobileCoreServices/UTType.h>
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
									 @"video/quicktime",@"mov",
									 @"video/x-m4v",@"m4v",
									 nil];
	}
}


+ (NSString *)extensionForMimeType:(NSString *)mimetype
{
	//First look in the dictionary
	[Mimetypes initialize];
	for (NSString *key in mimeTypeFromExtensionDict)
	{
		NSString *value = [mimeTypeFromExtensionDict objectForKey:key];
		if ([value isEqualToString:mimetype])
		{
			return key;
		}
	}
	
	//Missing info is retrieved from the system
	CFStringRef uti = UTTypeCreatePreferredIdentifierForTag(kUTTagClassMIMEType, (CFStringRef)mimetype, NULL);
	CFStringRef extension = UTTypeCopyPreferredTagWithClass(uti, kUTTagClassFilenameExtension);
	
	//Release the UTI
	CFRelease(uti);
	
	if (extension == NULL) {
		return @"bin";
	}
	else {
		return [(NSString*)extension autorelease];
	}
	
	
}

+ (NSString *)mimeTypeForExtension:(NSString *)ext
{
	//First look in the dictionary
	[Mimetypes initialize];
	NSString *result=[mimeTypeFromExtensionDict objectForKey:[ext pathExtension]];
	
	if (result != nil)
		return result;
	
	//Missing mimetypes are retrieved from the system
	CFStringRef uti = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, (CFStringRef)[ext pathExtension], NULL);
	CFStringRef mimetype = UTTypeCopyPreferredTagWithClass(uti, kUTTagClassMIMEType);

	//Release the UTI
	CFRelease(uti);
	
	if (mimetype == NULL) {
		return @"application/octet-stream";
	}
	else {
		return [(NSString*)mimetype autorelease];
	}
	
}
@end
