/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_UICLIPBOARD
#import "TiUIClipboardProxy.h"
#import <TitaniumKit/TiApp.h>
#import <TitaniumKit/TiBlob.h>
#import <TitaniumKit/TiFile.h>
#import <TitaniumKit/TiUtils.h>

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
  if ([mimeType isEqualToString:@"text"] || [mimeType hasPrefix:@"text/plain"]) {
    return CLIPBOARD_TEXT;
  } else if ([mimeType isEqualToString:@"url"] || [mimeType hasPrefix:@"text/uri-list"]) {
    return CLIPBOARD_URI_LIST;
  } else if ([mimeType hasPrefix:@"image"]) {
    return CLIPBOARD_IMAGE;
  } else if ([mimeType isEqualToString:@"color"]) {
    return CLIPBOARD_COLOR;
  } else {
    // Something else, work from the MIME type.
    return CLIPBOARD_UNKNOWN;
  }
}

static NSString *mimeTypeToUTType(NSString *mimeType)
{
  NSString *uti = [(NSString *)UTTypeCreatePreferredIdentifierForTag(kUTTagClassMIMEType, (CFStringRef)mimeType, NULL) autorelease];
  if (uti == nil) {
    // Should we do this? Lets us copy/paste custom data, anyway.
    uti = mimeType;
  }
  return uti;
}

@implementation TiUIClipboardProxy

NSArray<NSString *> *clipboardKeySequence;

- (NSArray<NSString *> *)keySequence
{
  if (clipboardKeySequence == nil) {
    clipboardKeySequence = [[NSArray alloc] initWithObjects:@"unique", @"name", @"allowCreation", nil];
  }
  return clipboardKeySequence;
}

- (void)_destroy
{
  RELEASE_TO_NIL(_pasteboard);
  [super _destroy];
}

- (id)init
{
  if (self = [super init]) {
    shouldCreatePasteboard = true;
    isNamedPasteBoard = false;
    isUnique = false;
  };
  return self;
}

- (NSString *)apiName
{
  return @"Ti.UI.Clipboard";
}

- (UIPasteboard *)pasteboard
{
  if (isNamedPasteBoard) {
    return _pasteboard;
  }
  return UIPasteboard.generalPasteboard;
}

- (void)setName:(id)arg
{
  if (!isUnique) {
    ENSURE_STRING(arg);
    pasteboardName = arg;
    _pasteboard = [[UIPasteboard pasteboardWithName:arg create:shouldCreatePasteboard] retain];
    isNamedPasteBoard = true;
  }
}

- (NSString *)name
{
  return [self pasteboard].name;
}

- (void)setAllowCreation:(id)arg
{
  BOOL value = [TiUtils boolValue:arg def:true];
  shouldCreatePasteboard = value;
  if (!isUnique && pasteboardName && !shouldCreatePasteboard) {
    [self remove:nil];
    _pasteboard = [[UIPasteboard pasteboardWithName:pasteboardName create:value] retain];
    isNamedPasteBoard = true;
  }
}

- (void)setUnique:(id)arg
{
  BOOL value = [TiUtils boolValue:arg def:false];
  isUnique = value;
  if (isUnique) {
    _pasteboard = [[UIPasteboard pasteboardWithUniqueName] retain];
    isNamedPasteBoard = true;
  }
}

- (void)remove:(id)unused
{
  if (_pasteboard != nil) {
    [UIPasteboard removePasteboardWithName:[self pasteboard].name];
    RELEASE_TO_NIL(_pasteboard);
  }
}

- (void)clearData:(id)arg
{
  ENSURE_UI_THREAD(clearData, arg);
  ENSURE_SINGLE_ARG_OR_NIL(arg, NSString);

  NSString *mimeType = arg ?: @"application/octet-stream";
  UIPasteboard *board = [self pasteboard];
  ClipboardType dataType = mimeTypeToDataType(mimeType);

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
    [[self pasteboard] setItems:@[]];
  }
  }
}

- (void)clearText:(id)args
{
  ENSURE_UI_THREAD(clearText, args);

  UIPasteboard *board = [self pasteboard];
  board.strings = nil;
}

- (id)getData:(id)args
{
  id arg = nil;
  if ([args isKindOfClass:[NSArray class]]) {
    if ([args count] > 0) {
      arg = [args objectAtIndex:0];
    }
  } else {
    arg = args;
  }
  ENSURE_STRING(arg);
  NSString *mimeType = arg;
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

- (NSString *)getText:(id)args
{
  return [self getData:@"text/plain"];
}

- (id)hasData:(id)args
{
  id arg = nil;
  if ([args isKindOfClass:[NSArray class]]) {
    if ([args count] > 0) {
      arg = [args objectAtIndex:0];
    }
  } else {
    arg = args;
  }
  ENSURE_STRING_OR_NIL(arg);
  NSString *mimeType = arg;
  __block BOOL result = NO;
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
  return NUMBOOL(result);
}

- (id)hasText:(id)unused
{
  return NUMBOOL([[self pasteboard] hasStrings]);
}

- (id)hasColors:(id)unused
{
  return NUMBOOL([[self pasteboard] hasColors]);
}

- (id)hasImages:(id)unused
{
  return NUMBOOL([[self pasteboard] hasImages]);
}

- (id)hasURLs:(id)unused
{
  return NUMBOOL([[self pasteboard] hasURLs]);
}

- (void)setItems:(id)args
{
  NSArray *items = [args objectForKey:@"items"];
  NSDictionary *options = [args objectForKey:@"options"];

  __block NSMutableArray *result = [[[NSMutableArray alloc] init] retain];

  // The key of the items must be a string (mime-type)
  for (id item in items) {
    NSMutableDictionary *newDict = [[NSMutableDictionary alloc] init];
    for (id key in item) {
      ENSURE_TYPE(key, NSString);
      [newDict setValue:[item valueForKey:key] forKey:mimeTypeToUTType(key)];
    }
    if (newDict != nil) {
      [result addObject:newDict];
    }
    RELEASE_TO_NIL(newDict);
  }

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

- (id)getItems:(id)unused
{
  __block id items;

  TiThreadPerformOnMainThread(
      ^{
        items = [[[self pasteboard] items] retain];

        // Check for invalid UTI's / mime-types to prevent a runtime-crash
        for (NSDictionary *item in items) {
          for (NSString *key in [item allKeys]) {
            if ([key hasPrefix:@"dyn."]) {
              NSLog(@"[ERROR] Invalid mime-type specified to setItems() before. Returning an empty result ...");

              RELEASE_TO_NIL(items);
              items = @[];
              break;
            }
          }
          if ([items count] == 0) {
            break;
          }
        }
      },
      YES);

  return [items autorelease];
}

- (void)setData:(id)args
{
  ENSURE_ARG_COUNT(args, 2);
  ENSURE_UI_THREAD(setData, args);

  NSString *mimeType = [TiUtils stringValue:[args objectAtIndex:0]];
  id data = [args objectAtIndex:1];
  if (data == nil) {
    DebugLog(@"[WARN] setData: data object was nil.");
    return;
  }
  UIPasteboard *board = [self pasteboard];
  ClipboardType dataType = mimeTypeToDataType(mimeType);

  switch (dataType) {
  case CLIPBOARD_TEXT: {
    board.string = [TiUtils stringValue:data];
    break;
  }
  case CLIPBOARD_URI_LIST: {
    board.URL = [NSURL URLWithString:[TiUtils stringValue:data]];
    break;
  }
  case CLIPBOARD_IMAGE: {
    board.image = [TiUtils toImage:data proxy:self];
    break;
  }
  case CLIPBOARD_COLOR: {
    board.color = [[TiUtils colorValue:data] color];
    break;
  }
  case CLIPBOARD_UNKNOWN:
  default: {
    NSData *raw;
    if ([data isKindOfClass:[TiBlob class]]) {
      raw = [(TiBlob *)data data];
    } else if ([data isKindOfClass:[TiFile class]]) {
      raw = [[(TiFile *)data blob] data];
    } else {
      raw = [[TiUtils stringValue:data] dataUsingEncoding:NSUTF8StringEncoding];
    }

    [board setData:raw forPasteboardType:mimeTypeToUTType(mimeType)];
  }
  }
}

- (void)setText:(id)arg
{
  ENSURE_STRING(arg);
  NSString *text = arg;
  [self setData:[NSArray arrayWithObjects:@"text/plain", text, nil]];
}

@end
#endif
