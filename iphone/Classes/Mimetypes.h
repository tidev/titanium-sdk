/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

extern const NSString * htmlMimeType;
extern const NSString * textMimeType;
extern const NSString * jpegMimeType;
extern const NSString * svgMimeType;


@interface Mimetypes : NSObject {

}
+ (NSString *)mimeTypeForExtension:(NSString *)ext;
+ (NSString *)extensionForMimeType:(NSString *)mimetype;

@end

