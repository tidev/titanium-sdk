/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_UICLIPBOARD
#import "TiUIClipboardProxy.h"
@import TitaniumKit.TiBlob;
@import TitaniumKit.TiFile;
@import TitaniumKit.TiUtils;

#import <MobileCoreServices/UTCoreTypes.h>
#import <MobileCoreServices/UTType.h>

typedef enum {
  CLIPBOARD_TEXT,
  CLIPBOARD_URI_LIST,
  CLIPBOARD_IMAGE,
  CLIPBOARD_COLOR,
  CLIPBOARD_UNKNOWN
} ClipboardType;

static ClipboardType mimeTypeToDataType(NSString *mimeType)
{
  mimeType = [mimeType lowercaseString];

  // Types "URL" and "Text" are for IE compatibility. We want to have
  // a consistent interface with WebKit's HTML 5 DataTransfer.
  // Support both MIME types and UTI strings: text, text/plain, text.plain,
  // public.text, public.plain-text, public.utf8-plain-text. We check the
  // known UTI strings explicitly because UTTypeConformsTo (deprecated
  // MobileCoreServices C API) is unreliable on newer iOS versions and was
  // causing public.plain-text to fall through to CLIPBOARD_UNKNOWN.
  if ([mimeType isEqualToString:@"text"]
      || [mimeType hasPrefix:@"text/plain"]
      || [mimeType isEqualToString:@"text.plain"]
      || [mimeType isEqualToString:@"public.text"]
      || [mimeType isEqualToString:@"public.plain-text"]
      || [mimeType isEqualToString:@"public.utf8-plain-text"]
      || UTTypeConformsTo((CFStringRef)mimeType, kUTTypeText)) {
    return CLIPBOARD_TEXT;
  }

  if ([mimeType isEqualToString:@"url"]
      || [mimeType hasPrefix:@"text/uri-list"]
      || [mimeType isEqualToString:@"public.url"]
      || UTTypeConformsTo((CFStringRef)mimeType, kUTTypeURL)) {
    return CLIPBOARD_URI_LIST;
  }

  if ([mimeType hasPrefix:@"image"] || UTTypeConformsTo((CFStringRef)mimeType, kUTTypeImage)) {
    return CLIPBOARD_IMAGE;
  }

  if ([mimeType isEqualToString:@"color"] || [mimeType isEqualToString:@"com.apple.uikit.color"]) {
    return CLIPBOARD_COLOR;
  }

  // Something else, work from the MIME type.
  return CLIPBOARD_UNKNOWN;
}

static NSString *mimeTypeToUTType(NSString *mimeType)
{
  if ([mimeType isEqualToString:@"text"] || [mimeType hasPrefix:@"text/plain"]) {
    return @"public.plain-text";
  }
  if ([mimeType isEqualToString:@"url"] || [mimeType hasPrefix:@"text/uri-list"]) {
    return @"public.url";
  }
  if ([mimeType hasPrefix:@"image"]) {
    return @"public.image";
  }
  if ([mimeType isEqualToString:@"color"]) {
    return @"com.apple.uikit.color";
  }

  NSString *uti = [(NSString *)UTTypeCreatePreferredIdentifierForTag(kUTTagClassMIMEType, (CFStringRef)mimeType, NULL) autorelease];
  // FIXME: If we get back a dyn. prefix, something is up!
  if (uti == nil) {
    // Should we do this? Lets us copy/paste custom data, anyway.
    uti = mimeType;
  }
  return uti;
}

@implementation TiUIClipboardProxy

- (void)_destroy
{
  RELEASE_TO_NIL(_pasteboard);
  [super _destroy];
}

- (id)init
{
  if (self = [super init]) {
    _pasteboard = nil;
    isUnique = false;
    shouldCreatePasteboard = false;
  }
  return self;
}

- (id)initWithProperties:(NSDictionary *)dict
{
  if (self = [super init]) {
    isUnique = [TiUtils boolValue:dict[@"unique"] def:false];
    shouldCreatePasteboard = [TiUtils boolValue:dict[@"allowCreation"] def:true];
    if (isUnique) {
      _pasteboard = [[UIPasteboard pasteboardWithUniqueName] retain];
    } else {
      NSString *pasteboardName = dict[@"name"];
      _pasteboard = [[UIPasteboard pasteboardWithName:pasteboardName create:shouldCreatePasteboard] retain];
    }
  }
  return self;
}

- (NSString *)apiName
{
  return @"Ti.UI.Clipboard";
}

- (UIPasteboard *)pasteboard
{
  if (_pasteboard != nil) {
    return _pasteboard;
  }
  return UIPasteboard.generalPasteboard;
}

- (NSString *)name
{
  return [self pasteboard].name;
}
GETTER_IMPL(NSString *, name, Name);

- (bool)unique
{
  return isUnique;
}
GETTER_IMPL(bool, unique, Unique);

- (bool)allowCreation
{
  return shouldCreatePasteboard;
}
GETTER_IMPL(bool, allowCreation, AllowCreation);

- (void)remove
{
  if (_pasteboard != nil) {
    [UIPasteboard removePasteboardWithName:[self pasteboard].name];
    RELEASE_TO_NIL(_pasteboard);
  }
}

- (void)clearData:(NSString *)mimeType
{
  if (mimeType == nil) {
    mimeType = @"application/octet-stream";
  }
  NSString *finalMimeType = mimeType;
  // UIPasteboard mutators must run on the main thread; off-main-thread writes
  // are silently dropped or delayed on iOS 26, so subsequent main-thread reads
  // see stale state.
  TiThreadPerformOnMainThread(
      ^{
        UIPasteboard *board = [self pasteboard];
        ClipboardType dataType = mimeTypeToDataType(finalMimeType);
        switch (dataType) {
        case CLIPBOARD_TEXT: {
          board.strings = nil;
          break;
        }
        case CLIPBOARD_URI_LIST: {
          board.URLs = nil;
          break;
        }
        case CLIPBOARD_IMAGE: {
          board.images = nil;
          break;
        }
        case CLIPBOARD_COLOR: {
          board.colors = nil;
          break;
        }
        case CLIPBOARD_UNKNOWN:
        default: {
          [board setItems:@[]];
        }
        }
      },
      YES);
}

- (void)clearText
{
  TiThreadPerformOnMainThread(
      ^{
        UIPasteboard *board = [self pasteboard];
        board.strings = nil;
      },
      YES);
}

- (id)getData:(NSString *)mimeType
{
  // FIXME: Support array arg?
  __block id result;
  TiThreadPerformOnMainThread(
      ^{
        result = [[self getData_:mimeType] retain];
      },
      YES);
  return [result autorelease];
}

// Must run on main thread.
- (id)getData_:(NSString *)mimeType
{
  UIPasteboard *board = [self pasteboard];
  ClipboardType dataType = mimeTypeToDataType(mimeType);
  switch (dataType) {
  case CLIPBOARD_TEXT: {
    return board.string;
  }
  case CLIPBOARD_URI_LIST: {
    return [board.URL absoluteString];
  }
  case CLIPBOARD_COLOR: {
    return [TiUtils hexColorValue:[board color]];
  }
  case CLIPBOARD_IMAGE: {
    UIImage *image = board.image;
    if (image) {
      return [[[TiBlob alloc] initWithImage:image] autorelease];
    } else {
      return nil;
    }
  }
  case CLIPBOARD_UNKNOWN:
  default: {
    NSData *data = [board dataForPasteboardType:mimeTypeToUTType(mimeType)];

    if (data) {
      return [[[TiBlob alloc] initWithData:data mimetype:mimeType] autorelease];
    } else {
      return nil;
    }
  }
  }
}

- (NSString *)getText
{
  return [self getData:@"text/plain"];
}

- (bool)hasData:(id)type
{
  __block BOOL result = NO;
  // type is an optional string
  NSString *mimeType = @"text/plain";
  if (type != nil) {
    mimeType = [TiUtils stringValue:type];
  }

  TiThreadPerformOnMainThread(
      ^{
        UIPasteboard *board = [self pasteboard];
        ClipboardType dataType = mimeTypeToDataType(mimeType);

        switch (dataType) {
        case CLIPBOARD_TEXT: {
          result = [board containsPasteboardTypes:UIPasteboardTypeListString];
          break;
        }
        case CLIPBOARD_URI_LIST: {
          result = [board containsPasteboardTypes:UIPasteboardTypeListURL];
          break;
        }
        case CLIPBOARD_IMAGE: {
          result = [board containsPasteboardTypes:UIPasteboardTypeListImage];
          break;
        }
        case CLIPBOARD_COLOR: {
          result = [board containsPasteboardTypes:UIPasteboardTypeListColor];
          break;
        }
        case CLIPBOARD_UNKNOWN:
        default: {
          result = [board containsPasteboardTypes:[NSArray arrayWithObject:mimeTypeToUTType(mimeType)]];
          break;
        }
        }
      },
      YES);
  return result;
}

- (bool)hasText
{
  return [[self pasteboard] hasStrings];
}

- (bool)hasColors
{
  return [[self pasteboard] hasColors];
}

- (bool)hasImages
{
  return [[self pasteboard] hasImages];
}

- (bool)hasURLs
{
  return [[self pasteboard] hasURLs];
}

- (void)setItems:(NSDictionary<NSString *, id> *)args
{
  NSArray<NSDictionary<NSString *, id> *> *items = args[@"items"];
  __block NSMutableArray<NSDictionary<NSString *, id> *> *result = [[NSMutableArray alloc] init];
  // The key of the items must be a string (mime-type)
  for (NSDictionary<NSString *, id> *item in items) {
    NSMutableDictionary<NSString *, id> *newDict = [[NSMutableDictionary alloc] init];
    for (NSString *key in item) {
      ENSURE_TYPE(key, NSString);
      [newDict setValue:[item valueForKey:key] forKey:mimeTypeToUTType(key)];
    }
    if (newDict != nil) {
      [result addObject:newDict];
    }
    RELEASE_TO_NIL(newDict);
  }

  NSDictionary<UIPasteboardOption, id> *options = args[@"options"];
  TiThreadPerformOnMainThread(
      ^{
        if (options == nil) {
          [[self pasteboard] setItems:result];
        } else {
          [[self pasteboard] setItems:result options:options];
        }
        RELEASE_TO_NIL(result);
      },
      YES);
}

- (NSArray<NSDictionary<NSString *, id> *> *)getItems
{
  __block NSMutableArray<NSDictionary<NSString *, id> *> *result = [[[NSMutableArray alloc] init] retain];
  TiThreadPerformOnMainThread(
      ^{
        NSArray<NSDictionary<NSString *, id> *> *items = [self pasteboard].items;

        // Check for invalid UTI's / mime-types to prevent a runtime-crash
        for (NSDictionary<NSString *, id> *item in items) {
          NSMutableDictionary<NSString *, id> *newItem = item.mutableCopy;
          for (NSString *key in newItem.allKeys) {
            if ([key isEqualToString:@"com.apple.uikit.color"]) {
              // Convert colors back to hex strings
              newItem[key] = [TiUtils hexColorValue:item[key]];
            } else if (UTTypeConformsTo((CFStringRef)key, kUTTypeURL)) {
              // Convert public.url and public.file-url values from NSURL to NSString
              newItem[key] = [TiUtils stringValue:item[key]];
            } else if (UTTypeConformsTo((CFStringRef)key, kUTTypeImage)) {
              // Convert UIImage to TiBlob!
              newItem[key] = [[[TiBlob alloc] initWithImage:(UIImage *)item[key]] autorelease];
            } else if ([key hasPrefix:@"dyn."]) {
              [newItem removeObjectForKey:key];
            }
          }
          [result addObject:newItem];
          [newItem release];
        }
      },
      YES);

  return [result autorelease];
}

- (void)setData:(NSString *)mimeType withData:(JSValue *)data
{
  if (data == nil) { // what about undefined?
    DebugLog(@"[WARN] setData: data object was nil.");
    return;
  }

  data = [self JSValueToNative:data];
  // TODO: If value is NSNull or undefined, should we throw or just clear the data for the given mime type?

  JSValue *finalData = data;
  NSString *finalMimeType = mimeType;
  // UIPasteboard mutators must run on the main thread; off-main-thread writes
  // are silently dropped or delayed on iOS 26, so subsequent main-thread reads
  // see stale state.
  TiThreadPerformOnMainThread(
      ^{
        UIPasteboard *board = [self pasteboard];
        ClipboardType dataType = mimeTypeToDataType(finalMimeType);
        switch (dataType) {
        case CLIPBOARD_TEXT: {
          board.string = [TiUtils stringValue:finalData];
          break;
        }
        case CLIPBOARD_URI_LIST: {
          board.URL = [NSURL URLWithString:[TiUtils stringValue:finalData]];
          break;
        }
        case CLIPBOARD_IMAGE: {
          UIImage *image = [TiUtils toImage:finalData proxy:self];
          if (image) {
            board.image = image;
          } else {
            board.image = nil;
          }
          break;
        }
        case CLIPBOARD_COLOR: {
          board.color = [[TiUtils colorValue:finalData] color];
          break;
        }
        case CLIPBOARD_UNKNOWN:
        default: {
          NSData *raw;
          if ([finalData isKindOfClass:[TiBlob class]]) {
            raw = [(TiBlob *)finalData data];
          } else if ([finalData isKindOfClass:[TiFile class]]) {
            raw = [[(TiFile *)finalData blob] data];
          } else {
            raw = [[TiUtils stringValue:finalData] dataUsingEncoding:NSUTF8StringEncoding];
          }

          [board setData:raw forPasteboardType:mimeTypeToUTType(finalMimeType)];
        }
        }
      },
      YES);
}

- (void)setText:(NSString *)text
{
  NSString *finalText = text;
  TiThreadPerformOnMainThread(
      ^{
        UIPasteboard *board = [self pasteboard];
        board.string = finalText;
      },
      YES);
}

@end
#endif
