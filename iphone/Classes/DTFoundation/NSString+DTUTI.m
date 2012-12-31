//
//  NSString+DTUTI.m
//  DTFoundation
//
//  Created by Oliver Drobnik on 03.10.12.
//  Copyright (c) 2012 Cocoanetics. All rights reserved.
//

#import "NSString+DTUTI.h"
#import <MobileCoreServices/MobileCoreServices.h>

@implementation NSString (DTUTI)

+ (NSString *)MIMETypeForFileExtension:(NSString *)extension
{
	CFStringRef typeForExt = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension,(__bridge CFStringRef)extension , NULL);
	NSString *result = (__bridge_transfer NSString *)UTTypeCopyPreferredTagWithClass(typeForExt, kUTTagClassMIMEType);
	
	if (!result)
	{
		return @"application/octet-stream";
	}
	
	return result;
}

+ (NSString *)fileTypeDescriptionForFileExtension:(NSString *)extension
{
	CFStringRef typeForExt = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension,(__bridge CFStringRef)extension , NULL);
	
	return (__bridge_transfer NSString *)UTTypeCopyDescription(typeForExt);
}

+ (NSString *)universalTypeIdentifierForFileExtension:(NSString *)extension
{
	return (__bridge_transfer NSString *)UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension,(__bridge CFStringRef)extension , NULL);
}

- (BOOL)conformsToUniversalTypeIdentifier:(NSString *)conformingUTI
{
	return UTTypeConformsTo((__bridge CFStringRef)(self), (__bridge CFStringRef)conformingUTI);
}

- (BOOL)isMovieFileName
{
	NSString *extension = [self pathExtension];
	NSString *uti = [NSString universalTypeIdentifierForFileExtension:extension];

	return [uti conformsToUniversalTypeIdentifier:@"public.movie"];
}

- (BOOL)isAudioFileName
{
	NSString *extension = [self pathExtension];
	NSString *uti = [NSString universalTypeIdentifierForFileExtension:extension];
	
	return [uti conformsToUniversalTypeIdentifier:@"public.audio"];
}

- (BOOL)isImageFileName
{
	NSString *extension = [self pathExtension];
	NSString *uti = [NSString universalTypeIdentifierForFileExtension:extension];
	
	return [uti conformsToUniversalTypeIdentifier:@"public.image"];
}

- (BOOL)isHTMLFileName
{
	NSString *extension = [self pathExtension];
	NSString *uti = [NSString universalTypeIdentifierForFileExtension:extension];
	
	return [uti conformsToUniversalTypeIdentifier:@"public.html"];
}


@end