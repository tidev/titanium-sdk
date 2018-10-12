/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UTILS

#import "UtilsModule.h"
#import <CommonCrypto/CommonDigest.h>
#import <CommonCrypto/CommonHMAC.h>
#import <TitaniumKit/TiBlob.h>
#import <TitaniumKit/TiFile.h>
#import <TitaniumKit/TiUtils.h>

@implementation UtilsModule

- (NSString *)convertToString:(JSValue *)arg
{
  if ([arg isString]) {
    return [arg toString];
  }
  // FIXME: Once TiBlob/TiFile have been migrated we can remove this conversion
  id oldProxyStyle = [self JSValueToNative:arg];
  if ([oldProxyStyle isKindOfClass:[TiBlob class]]) {
    return [(TiBlob *)oldProxyStyle text];
  } else if ([oldProxyStyle isKindOfClass:[TiFile class]]) {
    return [(TiBlob *)[(TiFile *)oldProxyStyle blob] text];
  }
  THROW_INVALID_ARG(@"Invalid type");
}

- (NSData *)convertToData:(JSValue *)arg
{
  if ([arg isString]) {
    return [[self convertToString:arg] dataUsingEncoding:NSUTF8StringEncoding];
  }

  // FIXME: Once TiBlob/TiFile have been migrated we can remove this conversion
  id oldProxyStyle = [self JSValueToNative:arg];
  if ([oldProxyStyle isKindOfClass:[TiFile class]]) {
    // Support TiFile with possibly binary data by converting to TiBlob and continuing...
    oldProxyStyle = [(TiFile *)oldProxyStyle blob];
  }
  if ([oldProxyStyle isKindOfClass:[TiBlob class]]) {
    return [(TiBlob *)oldProxyStyle data];
  }
  THROW_INVALID_ARG(@"Invalid type");
}

- (NSString *)apiName
{
  return @"Ti.Utils";
}

#pragma mark Public API

- (JSValue *)base64encode:(JSValue *)obj
{
  NSData *data = [self convertToData:obj];
  NSString *base64Encoded = [data base64EncodedStringWithOptions:0];
  if (base64Encoded != nil) {
    // FIXME: Remove conversion once TiBlob is moved to Obj-c proxy
    return [self NativeToJSValue:[[[TiBlob alloc] initWithData:[base64Encoded dataUsingEncoding:NSUTF8StringEncoding]
                                                      mimetype:@"application/octet-stream"] autorelease]];
  }

  return nil;
}

- (JSValue *)base64decode:(JSValue *)obj
{
  NSString *str = [[self convertToString:obj] stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
  int padding = (4 - (str.length % 4)) % 4;
  NSString *paddedStr = [NSString stringWithFormat:@"%s%.*s", [str UTF8String], padding, "=="];
  NSData *decodedData = [[[NSData alloc] initWithBase64EncodedString:paddedStr options:0] autorelease];

  if (decodedData != nil) {
    // FIXME: Remove conversion once TiBlob is moved to Obj-c proxy
    return [self NativeToJSValue:[[[TiBlob alloc] initWithData:decodedData mimetype:@"application/octet-stream"] autorelease]];
  }

  return nil;
}

- (NSString *)md5HexDigest:(JSValue *)obj
{
  NSData *data = [self convertToData:obj];
  return [TiUtils md5:data];
}

- (NSString *)sha1:(JSValue *)obj
{
  NSData *data = [self convertToData:obj];

  unsigned char result[CC_SHA1_DIGEST_LENGTH];
  CC_SHA1([data bytes], (CC_LONG)[data length], result);

  return [TiUtils convertToHex:(unsigned char *)&result length:CC_SHA1_DIGEST_LENGTH];
}

- (NSString *)sha256:(JSValue *)obj
{
  NSData *data = [self convertToData:obj];

  unsigned char result[CC_SHA256_DIGEST_LENGTH];
  CC_SHA256([data bytes], (CC_LONG)[data length], result);

  return [TiUtils convertToHex:(unsigned char *)&result length:CC_SHA256_DIGEST_LENGTH];
}

@end

#endif
