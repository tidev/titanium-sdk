/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <MobileCoreServices/UTType.h>
#import "Mimetypes.h"

const NSString * svgMimeType = @"image/svg+xml";

static NSDictionary * mimeTypeFromExtensionDict = nil;


@implementation Mimetypes

+ (void)initialize
{
	//This dictionary contains info on mimetypes surrently missing on IOS platform.
	//This should be updated on a case by case basis.
	if (mimeTypeFromExtensionDict == nil)
	{
		mimeTypeFromExtensionDict = [[NSDictionary alloc] initWithObjectsAndKeys:
									 @"text/css",@"css",
									 @"video/x-m4v",@"m4v",
									 nil];
	}
}


+ (NSString *)extensionForMimeType:(NSString *)mimetype
{
	//Get info from the system
	CFStringRef uti = UTTypeCreatePreferredIdentifierForTag(kUTTagClassMIMEType, (CFStringRef)mimetype, NULL);
	CFStringRef extension = UTTypeCopyPreferredTagWithClass(uti, kUTTagClassFilenameExtension);
	
	//Release the UTI
	CFRelease(uti);
	
	if (extension == NULL) {
		//Missing info is retrieved from dictionary
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
	else {
		return [(NSString*)extension autorelease];
	}
	
	
}

+ (NSString *)mimeTypeForExtension:(NSString *)ext
{
	//Get info from the system
	CFStringRef uti = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, (CFStringRef)[ext pathExtension], NULL);
	CFStringRef mimetype = UTTypeCopyPreferredTagWithClass(uti, kUTTagClassMIMEType);

	//Release the UTI
	CFRelease(uti);
	
	if (mimetype == NULL) {
		//Missing info is retrieved from dictionary
		[Mimetypes initialize];
		NSString *result=[mimeTypeFromExtensionDict objectForKey:[ext pathExtension]];
		
		if (result == nil)
			result = @"application/octet-stream";
		
		return result;
	}
	else {
		return [(NSString*)mimetype autorelease];
	}
	
}
@end
