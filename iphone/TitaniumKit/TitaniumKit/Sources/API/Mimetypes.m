/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "Mimetypes.h"
#import <MobileCoreServices/UTType.h>

const NSString *svgMimeType = @"image/svg+xml";

static NSDictionary *MimeTypesDict(void)
{
  static NSDictionary *dict = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    // This dictionary contains info on mimetypes currently missing on iOS platform.
    dict = [[NSDictionary alloc] initWithObjectsAndKeys:
                                     @"text/css", @"css",
                                 @"video/x-m4v", @"m4v",
                                 nil];
  });
  return dict;
}

@implementation Mimetypes

+ (void)initialize
{
}

+ (NSString *)extensionForMimeType:(NSString *)mimetype
{
  // Get info from the system
  CFStringRef uti = UTTypeCreatePreferredIdentifierForTag(kUTTagClassMIMEType, (CFStringRef)mimetype, NULL);
  CFStringRef extension = UTTypeCopyPreferredTagWithClass(uti, kUTTagClassFilenameExtension);

  // Release the UTI
  // CFRelease should not be used on a NULL object.
  if (uti != NULL) {
    CFRelease(uti);
  }

  if (extension == NULL) {
    // Missing info is retrieved from dictionary
    NSDictionary *extra = MimeTypesDict();
    for (NSString *key in extra) {
      NSString *value = [extra objectForKey:key];
      if ([value isEqualToString:mimetype]) {
        return key;
      }
    }
    return @"bin";
  } else {
    return [(NSString *)extension autorelease];
  }
}

+ (NSString *)mimeTypeForExtension:(NSString *)ext
{
  // Get info from the system
  CFStringRef uti = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, (CFStringRef)[ext pathExtension], NULL);
  CFStringRef mimetype = UTTypeCopyPreferredTagWithClass(uti, kUTTagClassMIMEType);

  // Release the UTI
  // CFRelease should not be used on a NULL object.
  if (uti != NULL) {
    CFRelease(uti);
  }

  if (mimetype == NULL) {
    // Missing info is retrieved from dictionary
    NSString *result = [MimeTypesDict() objectForKey:[ext pathExtension]];

    if (result == nil)
      result = @"application/octet-stream";

    return result;
  } else {
    return [(NSString *)mimetype autorelease];
  }
}
@end
