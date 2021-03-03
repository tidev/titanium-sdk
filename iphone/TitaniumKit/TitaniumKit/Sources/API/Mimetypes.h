/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>

extern const NSString *svgMimeType;

/**
 A static class to convert file extensions into mime-types and vice versa.
 */
@interface Mimetypes : NSObject

/**
 Converts a file extension into a mime type.
 
 @param ext The extension to convert.
 @return The mime-type converted from the extension.
 */
+ (NSString *)mimeTypeForExtension:(NSString *)ext;

/**
 Converts a mime type into a file extension.
 
 @param mimetype The mime type to convert.
 @return The file extension converted from the mime-type.
 */
+ (NSString *)extensionForMimeType:(NSString *)mimetype;

@end
