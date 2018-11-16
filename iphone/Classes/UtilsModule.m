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

- (NSString *)convertToString:(id)arg
{
  if ([arg isKindOfClass:[NSString class]]) {
    return arg;
  } else if ([arg isKindOfClass:[TiBlob class]]) {
    return [(TiBlob *)arg text];
  } else if ([arg isKindOfClass:[TiFile class]]) {
    return [(TiBlob *)[(TiFile *)arg blob] text];
  }
  THROW_INVALID_ARG(@"Invalid type");
}

- (NSData *)convertToData:(id)arg
{
  if ([arg isKindOfClass:[TiBlob class]]) {
    return [(TiBlob *)arg data];
  } else if ([arg isKindOfClass:[TiFile class]]) {
    // Support TiFile with possibly binary data by converting to TiBlob and recursing
    return [self convertToData:[(TiFile *)arg blob]];
  }
  return [[self convertToString:arg] dataUsingEncoding:NSUTF8StringEncoding];
}

- (NSString *)apiName
{
  return @"Ti.Utils";
}

#pragma mark Public API

- (TiBlob *)base64encode:(id)args
{
  ENSURE_SINGLE_ARG(args, NSObject);
  NSData *data = [self convertToData:args];
  NSString *base64Encoded = [data base64EncodedStringWithOptions:0];
  if (base64Encoded != nil) {
    return [[[TiBlob alloc] _initWithPageContext:[self pageContext]
                                         andData:[base64Encoded dataUsingEncoding:NSUTF8StringEncoding]
                                        mimetype:@"application/octet-stream"] autorelease];
  }

  return nil;
}

- (TiBlob *)base64decode:(id)args
{
  ENSURE_SINGLE_ARG(args, NSObject);

  NSString *str = [[self convertToString:args] stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
  int padding = (4 - (str.length % 4)) % 4;
  NSString *paddedStr = [NSString stringWithFormat:@"%s%.*s", [str UTF8String], padding, "=="];
  NSData *decodedData = [[[NSData alloc] initWithBase64EncodedString:paddedStr options:0] autorelease];

  if (decodedData != nil) {
    return [[[TiBlob alloc] _initWithPageContext:[self pageContext] andData:decodedData mimetype:@"application/octet-stream"] autorelease];
  }

  return nil;
}

- (NSString *)md5HexDigest:(id)args
{
  ENSURE_SINGLE_ARG(args, NSObject);

  NSData *data = [self convertToData:args];
  return [TiUtils md5:data];
}

- (id)sha1:(id)args
{
  ENSURE_SINGLE_ARG(args, NSObject);

  NSData *data = [self convertToData:args];

  unsigned char result[CC_SHA1_DIGEST_LENGTH];
  CC_SHA1([data bytes], (CC_LONG)[data length], result);

  return [TiUtils convertToHex:(unsigned char *)&result length:CC_SHA1_DIGEST_LENGTH];
}

- (id)sha256:(id)args
{
  ENSURE_SINGLE_ARG(args, NSObject);

  NSData *data = [self convertToData:args];

  unsigned char result[CC_SHA256_DIGEST_LENGTH];
  CC_SHA256([data bytes], (CC_LONG)[data length], result);

  return [TiUtils convertToHex:(unsigned char *)&result length:CC_SHA256_DIGEST_LENGTH];
}

@end

#endif
