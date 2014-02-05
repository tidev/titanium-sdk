/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiHTTPClient.h"
#import <MobileCoreServices/MobileCoreServices.h>

@implementation TiHTTPHelper

static char *alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

+(NSString *)base64encode:(NSData *)plainText
{
    
    int encodedLength = (4 * (([plainText length] / 3) + (1 - (3 - ([plainText length] % 3)) / 3))) + 1;
    unsigned char *outputBuffer = malloc(encodedLength);
    unsigned char *inputBuffer = (unsigned char *)[plainText bytes];
    
    NSInteger i;
    NSInteger j = 0;
    int remain;
    
    for(i = 0; i < [plainText length]; i += 3) {
        remain = [plainText length] - i;
        
        outputBuffer[j++] = alphabet[(inputBuffer[i] & 0xFC) >> 2];
        outputBuffer[j++] = alphabet[((inputBuffer[i] & 0x03) << 4) |
                                     ((remain > 1) ? ((inputBuffer[i + 1] & 0xF0) >> 4): 0)];
        
        if(remain > 1)
            outputBuffer[j++] = alphabet[((inputBuffer[i + 1] & 0x0F) << 2)
                                         | ((remain > 2) ? ((inputBuffer[i + 2] & 0xC0) >> 6) : 0)];
        else
            outputBuffer[j++] = '=';
        
        if(remain > 2)
            outputBuffer[j++] = alphabet[inputBuffer[i + 2] & 0x3F];
        else
            outputBuffer[j++] = '=';
    }
    
    outputBuffer[j] = 0;
    NSString *result = [NSString stringWithUTF8String:(const char*)outputBuffer];
    free(outputBuffer);
    
    return result;
}


+(int)caselessCompareFirstString:(const char *)firstString secondString:(const char *)secondString size:(int)size
{
	int index = 0;
	while(index < size)
	{
		char firstChar = tolower(firstString[index]);
		char secondChar = secondString[index]; //Second string is always lowercase.
		index++;
		if(firstChar!=secondChar)return index; //Yes, this is one after the failure.
	}
	return 0;
}


#define TRYENCODING( encodingName, nameSize, returnValue, value )	\
if((remainingSize > nameSize)&&([self caselessCompareFirstString:data secondString:encodingName size:nameSize] == 0)) {*value = returnValue; return YES;}

+(BOOL)extractEncodingFromData:(NSData *)inputData result:(NSStringEncoding*)result
{

	int remainingSize = [inputData length];
	int unsearchableSize;
	if(remainingSize > 2008) unsearchableSize = remainingSize - 2000;
	else unsearchableSize = 8; // So that there's no chance of overrunning the buffer with 'charset='
	const char * data = [inputData bytes];
	
	// XML provides its own encoding format as part of the definition,
	// we need to use this if it looks like a XML document
	int prefix = [self caselessCompareFirstString:data secondString:"<?xml" size:5];
	if (prefix==0)
	{
		char *enc = strstr(data, "encoding=");
		if (enc)
		{
			enc += 10;
			data = enc;

            TRYENCODING("windows-1252",12,NSWindowsCP1252StringEncoding,result);
			TRYENCODING("iso-8859-1",10,NSISOLatin1StringEncoding,result);
			TRYENCODING("utf-8",5,NSUTF8StringEncoding,result);
			TRYENCODING("shift-jis",9,NSShiftJISStringEncoding,result);
			TRYENCODING("shift_jis",9,NSShiftJISStringEncoding,result);
			TRYENCODING("x-euc",5,NSJapaneseEUCStringEncoding,result);
			TRYENCODING("euc-jp",6,NSJapaneseEUCStringEncoding,result);
			TRYENCODING("windows-1250",12,NSWindowsCP1251StringEncoding,result);
			TRYENCODING("windows-1251",12,NSWindowsCP1252StringEncoding,result);
			TRYENCODING("windows-1253",12,NSWindowsCP1253StringEncoding,result);
			TRYENCODING("windows-1254",12,NSWindowsCP1254StringEncoding,result);
			TRYENCODING("windows-1255",12,CFStringConvertEncodingToNSStringEncoding(kCFStringEncodingWindowsHebrew),result);
			return NO;
		}
	}
	
	while(remainingSize > unsearchableSize)
	{
		int compareOffset = [self caselessCompareFirstString:data secondString:"charset=" size:8];
		if (compareOffset != 0)
		{
			data += compareOffset;
			remainingSize -= compareOffset;
			continue;
		}
		data += 8;
		remainingSize -= 8;
		
		TRYENCODING("windows-1252",12,NSWindowsCP1252StringEncoding,result);
		TRYENCODING("iso-8859-1",10,NSISOLatin1StringEncoding,result);
		TRYENCODING("utf-8",5,NSUTF8StringEncoding,result);
		TRYENCODING("shift-jis",9,NSShiftJISStringEncoding,result);
		TRYENCODING("shift_jis",9,NSShiftJISStringEncoding,result);
		TRYENCODING("x-euc",5,NSJapaneseEUCStringEncoding,result);
		TRYENCODING("euc-jp",6,NSJapaneseEUCStringEncoding,result);
		TRYENCODING("windows-1250",12,NSWindowsCP1251StringEncoding,result);
		TRYENCODING("windows-1251",12,NSWindowsCP1252StringEncoding,result);
		TRYENCODING("windows-1253",12,NSWindowsCP1253StringEncoding,result);
		TRYENCODING("windows-1254",12,NSWindowsCP1254StringEncoding,result);
		TRYENCODING("windows-1255",12,CFStringConvertEncodingToNSStringEncoding(kCFStringEncodingWindowsHebrew),result);
	}
	return NO;
}

// Taken from http://stackoverflow.com/questions/4147311/finding-image-type-from-nsdata-or-uiimage
+ (NSString *)contentTypeForImageData:(NSData *)data {
    uint8_t c;
    [data getBytes:&c length:1];
    
    switch (c) {
        case 0xFF:
            return @"image/jpeg";
        case 0x89:
            return @"image/png";
        case 0x47:
            return @"image/gif";
        case 0x49:
        case 0x4D:
            return @"image/tiff";
    }
    return @"application/octet-stream";
}

// Taken from http://stackoverflow.com/questions/2439020/wheres-the-iphone-mime-type-database
+ (NSString*)fileMIMEType:(NSString*) file
{
    CFStringRef UTI = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, (__bridge CFStringRef)[file pathExtension], NULL);
    CFStringRef MIMEType = UTTypeCopyPreferredTagWithClass (UTI, kUTTagClassMIMEType);
    CFRelease(UTI);
	if (!MIMEType) {
		return @"application/octet-stream";
	}
    return (__bridge NSString *)MIMEType;
}

// Taken from http://stackoverflow.com/questions/8088473/url-encode-an-nsstring
+ (NSString*)encodeURL:(NSString *)string
{
    NSMutableString *output = [NSMutableString string];
    const unsigned char *source = (const unsigned char *)[string UTF8String];
    int sourceLen = strlen((const char *)source);
    for (int i = 0; i < sourceLen; ++i) {
        const unsigned char thisChar = source[i];
        if (thisChar == ' '){
            [output appendString:@"+"];
        } else if (thisChar == '.' || thisChar == '-' || thisChar == '_' || thisChar == '~' ||
                   (thisChar >= 'a' && thisChar <= 'z') ||
                   (thisChar >= 'A' && thisChar <= 'Z') ||
                   (thisChar >= '0' && thisChar <= '9')) {
            [output appendFormat:@"%c", thisChar];
        } else {
            [output appendFormat:@"%%%02X", thisChar];
        }
    }
    return output;
}

+ (void)parseMimeType:(NSString **)mimeType andResponseEncoding:(NSStringEncoding *)stringEncoding fromContentType:(NSString *)contentType
{
	if (!contentType) {
		return;
	}
	NSScanner *charsetScanner = [NSScanner scannerWithString: contentType];
	if (![charsetScanner scanUpToString:@";" intoString:mimeType] || [charsetScanner scanLocation] == [contentType length]) {
		*mimeType = [contentType stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
		return;
	}
	*mimeType = [*mimeType stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceCharacterSet]];
	NSString *charsetSeparator = @"charset=";
	NSString *IANAEncoding = nil;
    
	if ([charsetScanner scanUpToString: charsetSeparator intoString: NULL] && [charsetScanner scanLocation] < [contentType length]) {
		[charsetScanner setScanLocation: [charsetScanner scanLocation] + [charsetSeparator length]];
		[charsetScanner scanUpToString: @";" intoString: &IANAEncoding];
	}
    
	if (IANAEncoding) {
		CFStringEncoding cfEncoding = CFStringConvertIANACharSetNameToEncoding((CFStringRef)IANAEncoding);
		if (cfEncoding != kCFStringEncodingInvalidId) {
			*stringEncoding = CFStringConvertEncodingToNSStringEncoding(cfEncoding);
		}
	}
}

+(NSStringEncoding)parseStringEncodingFromHeaders:(NSDictionary*)headers
{
	// Handle response text encoding
	NSStringEncoding charset = 0;
	NSString *mimeType = nil;
	[self parseMimeType:&mimeType andResponseEncoding:&charset fromContentType:[headers valueForKey:@"Content-Type"]];
    return charset;
}

@end
