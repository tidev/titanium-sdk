/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UTILS

#import "UtilsModule.h"
#import "TiUtils.h"
#import "Base64Transcoder.h"
#import "TiBlob.h"
#import "TiFile.h"
#import <CommonCrypto/CommonDigest.h>

@implementation UtilsModule

#pragma mark Public API

-(TiBlob*)base64encode:(id)args
{
	ENSURE_SINGLE_ARG(args,NSString);

	const char *data = [args UTF8String];
	size_t len = [args length];
	
	size_t outsize = EstimateBas64EncodedDataSize(len);
	char *base64Result = malloc(sizeof(char)*outsize);
    size_t theResultLength = outsize;
	
    bool result = Base64EncodeData(data, len, base64Result, &theResultLength);
	if (result)
	{
		NSData *theData = [NSData dataWithBytes:base64Result length:theResultLength];
		free(base64Result);
		return [[[TiBlob alloc] initWithData:theData mimetype:@"application/octet-stream"] autorelease];
	}    
	free(base64Result);
	return nil;
}

-(TiBlob*)base64decode:(id)args
{
	ENSURE_SINGLE_ARG(args,NSString);
	
	const char *data = [args UTF8String];
	size_t len = [args length];
	
	size_t outsize = EstimateBas64DecodedDataSize(len);
	char *base64Result = malloc(sizeof(char)*outsize);
    size_t theResultLength = outsize;
	
    bool result = Base64DecodeData(data, len, base64Result, &theResultLength);
	if (result)
	{
		NSData *theData = [NSData dataWithBytes:base64Result length:theResultLength];
		free(base64Result);
		return [[[TiBlob alloc] initWithData:theData mimetype:@"application/octet-stream"] autorelease];
	}    
	free(base64Result);
	return nil;
}

-(NSString*)md5HexDigest:(id)args
{
	ENSURE_SINGLE_ARG(args,NSString);
	const char* str = [args UTF8String];
	unsigned char result[CC_MD5_DIGEST_LENGTH];
	CC_MD5(str, strlen(str), result);
	
	return [NSString stringWithFormat:
			@"%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x%02x",
			result[0], result[1], result[2], result[3], result[4], result[5], result[6], result[7],
			result[8], result[9], result[10], result[11], result[12], result[13], result[14], result[15]
			];
}

@end

#endif
