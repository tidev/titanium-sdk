/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

@import Foundation;

extern const NSString *svgMimeType;

@interface Mimetypes : NSObject {
}
+ (NSString *)mimeTypeForExtension:(NSString *)ext;
+ (NSString *)extensionForMimeType:(NSString *)mimetype;

@end
