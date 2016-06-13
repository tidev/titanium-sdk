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
#import <CommonCrypto/CommonHMAC.h>

@implementation UtilsModule

-(NSString*)convertToString:(id)arg
{
	if ([arg isKindOfClass:[NSString class]])
	{
		return arg;
	}
	else if ([arg isKindOfClass:[TiBlob class]])
	{
		return [(TiBlob*)arg text];
	}
	THROW_INVALID_ARG(@"invalid type");
}

-(NSString*)apiName
{
    return @"Ti.Utils";
}


#pragma mark Public API

MAKE_SYSTEM_PROP(ENCODE_TYPE_LF, NSDataBase64EncodingEndLineWithLineFeed);
MAKE_SYSTEM_PROP(ENCODE_TYPE_CR, NSDataBase64EncodingEndLineWithCarriageReturn);
MAKE_SYSTEM_PROP(ENCODE_TYPE_64, NSDataBase64Encoding64CharacterLineLength);
MAKE_SYSTEM_PROP(ENCODE_TYPE_76, NSDataBase64Encoding76CharacterLineLength);

-(TiBlob*)base64encode:(id)args
{
    ENSURE_UI_THREAD(base64encode, args);
    NSData *base64Data = nil;
    NSData *data = nil;
    
    if ([args isKindOfClass:[NSArray class]]) {
        NSArray *arguments = (NSArray*)args;
        
        if (![TiUtils isIOS7OrGreater]) {
            [self iOS7Base64encode:[args objectAtIndex:0]];
            return;
        }
        
        if([[arguments objectAtIndex:0] isKindOfClass:[NSString class]]) {
            data = [[arguments objectAtIndex:0]
                        dataUsingEncoding:NSUTF8StringEncoding];
        } else if ([[arguments objectAtIndex:0] isKindOfClass:[TiBlob class]]) {
            data = [(TiBlob*)args data];
        } else {
            [self throwException:@"Invalid datatype passed in"
                       subreason:[NSString stringWithFormat:@"Expected a string or a TiBlob, was: %@",[[arguments objectAtIndex:0] class]]
                        location:CODELOCATION];
        }
        
        if ([args count] == 2) {
            if ([[arguments objectAtIndex:1] isKindOfClass:[NSNumber class]]) {
                NSNumber *type = (NSNumber*)[arguments objectAtIndex:1];
                
                switch ([type integerValue]) {
                    case NSDataBase64Encoding64CharacterLineLength:
                        base64Data = [data base64EncodedDataWithOptions:NSDataBase64Encoding64CharacterLineLength];
                        break;
                    case NSDataBase64Encoding76CharacterLineLength:
                        base64Data = [data base64EncodedDataWithOptions:NSDataBase64Encoding76CharacterLineLength];
                        break;
                    case NSDataBase64EncodingEndLineWithCarriageReturn:
                        base64Data = [data base64EncodedDataWithOptions:NSDataBase64EncodingEndLineWithCarriageReturn];
                        break;
                    case NSDataBase64EncodingEndLineWithLineFeed:
                        base64Data = [data base64EncodedDataWithOptions:NSDataBase64EncodingEndLineWithLineFeed];
                        break;
                    default:
                        base64Data = [data base64EncodedDataWithOptions:NSDataBase64Encoding76CharacterLineLength];
                        break;
                }
            }
            
        } else {
            base64Data = [data base64EncodedDataWithOptions:NSDataBase64Encoding76CharacterLineLength];
        }
        
    } else if ([args isKindOfClass:[TiBlob class]]) {
        
        if (![TiUtils isIOS7OrGreater]) {
            [self iOS7Base64encode:args];
            return;
        }
        
        data = [(TiBlob*)args data];
        base64Data = [data base64EncodedDataWithOptions:NSDataBase64Encoding76CharacterLineLength];
    } else {
        [self throwException:@"Invalid datatype passed in"
                   subreason:[NSString stringWithFormat:@"Expected a string or a TiBlob, was: %@",[args class]]
                    location:CODELOCATION];
    }
    
    return base64Data ? [[[TiBlob alloc] _initWithPageContext:[self pageContext] andData:base64Data mimetype:@"application/octet-stream"] autorelease] : nil;
}

-(TiBlob*)base64decode:(id)args
{
    ENSURE_UI_THREAD(base64encode, args);
    ENSURE_SINGLE_ARG(args,NSObject);
    NSData *base64Data = nil;
    NSData *data = nil;
    
    if (![TiUtils isIOS7OrGreater]) {
        [self iOS7Base64encode:[args objectAtIndex:0]];
        return;
    }
    
    if ([args isKindOfClass:[NSString class]]) {
        NSString *argument = [TiUtils stringValue:args];
        data = [argument dataUsingEncoding:NSUTF8StringEncoding];
        base64Data = [[NSData alloc]initWithBase64EncodedData:data options:NSDataBase64DecodingIgnoreUnknownCharacters];
    } else if ([args isKindOfClass:[TiBlob class]]) {
        data = [(TiBlob*)args data];
        base64Data = [[NSData alloc]initWithBase64EncodedData:data options:NSDataBase64DecodingIgnoreUnknownCharacters];
    } else {
        [self throwException:@"Invalid datatype passed in"
                   subreason:[NSString stringWithFormat:@"Expected a string or a TiBlob, was: %@",[args class]]
                    location:CODELOCATION];
    }

    return base64Data ? [[[TiBlob alloc] _initWithPageContext:[self pageContext] andData:base64Data mimetype:@"application/octet-stream"] autorelease] : nil;
    
}


-(TiBlob*)iOS7Base64encode:(id)args
{
    ENSURE_SINGLE_ARG(args,NSObject);
    const char *data;
    size_t len;
    
    if ([args isKindOfClass:[TiBlob class]]) {
        NSData * blobData = [(TiBlob*)args data];
        data = (char *)[blobData bytes];
        len = [blobData length];
    }
    else
    {
        NSString *str = [self convertToString:args];
        data = (char *)[str UTF8String];
        len = [str length];
    }
    
    char *base64Result;
    size_t theResultLength;
    bool result = Base64AllocAndEncodeData(data, len, &base64Result, &theResultLength);
    if (result)
    {
        NSData *theData = [NSData dataWithBytes:base64Result length:theResultLength];
        free(base64Result);
        return [[[TiBlob alloc] _initWithPageContext:[self pageContext] andData:theData mimetype:@"application/octet-stream"] autorelease];
    }
    return nil;
}

-(TiBlob*)iOS7Base64decode:(id)args
{
    ENSURE_SINGLE_ARG(args,NSObject);
    
    NSString *str = [self convertToString:args];
    
    const char *data = [str UTF8String];
    size_t len = [str length];
    
    size_t outsize = TI_EstimateBas64DecodedDataSize(len);
    char *base64Result = NULL;
    if(len>0){
        base64Result = malloc(sizeof(char)*outsize);
    }
    
    if (base64Result==NULL) {
        return nil;
    }
    
    size_t theResultLength = outsize;
    bool result = TI_Base64DecodeData(data, len, base64Result, &theResultLength);
    if (result)
    {
        NSData *theData = [NSData dataWithBytes:base64Result length:theResultLength];
        free(base64Result);
        return [[[TiBlob alloc] _initWithPageContext:[self pageContext] andData:theData mimetype:@"application/octet-stream"] autorelease];
    }
    free(base64Result);
    return nil;
}

-(NSString*)md5HexDigest:(id)args
{
	ENSURE_SINGLE_ARG(args,NSObject);
	
	NSData* data = nil;
	NSString *nstr = [self convertToString:args];
	if (nstr) {
		const char* s = [nstr UTF8String];
		data = [NSData dataWithBytes:s length:strlen(s)];
	} else if ([args respondsToSelector:@selector(data)]) {
		data = [args data];
	}
	return [TiUtils md5:data];
}

-(id)sha1:(id)args
{
	ENSURE_SINGLE_ARG(args,NSObject);
	NSString *nstr = [self convertToString:args];
	const char *cStr = [nstr UTF8String];
	unsigned char result[CC_SHA1_DIGEST_LENGTH];
	CC_SHA1(cStr, (CC_LONG)[nstr lengthOfBytesUsingEncoding:NSUTF8StringEncoding], result);
	return [TiUtils convertToHex:(unsigned char*)&result length:CC_SHA1_DIGEST_LENGTH];
}

-(id)sha256:(id)args
{
	ENSURE_SINGLE_ARG(args,NSObject);
	NSString *nstr = [self convertToString:args];
	const char *cStr = [nstr UTF8String];
	unsigned char result[CC_SHA256_DIGEST_LENGTH];
	CC_SHA256(cStr, (CC_LONG)[nstr lengthOfBytesUsingEncoding:NSUTF8StringEncoding], result);
	return [TiUtils convertToHex:(unsigned char*)&result length:CC_SHA256_DIGEST_LENGTH];
}

@end

#endif
