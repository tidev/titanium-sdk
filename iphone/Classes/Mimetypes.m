/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "Mimetypes.h"
#import <MobileCoreServices/UTType.h>
const NSString * svgMimeType = @"image/svg+xml";


@implementation Mimetypes

+ (NSString *)extensionForMimeType:(NSString *)mimetype
{
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
