/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"
#import "TopTiModule.h"
#import "KrollBridge.h"
#import "TiApp.h"
#import "TiUtils.h"
#import "TiBuffer.h"

#ifdef KROLL_COVERAGE
# include "KrollCoverage.h"
#endif

@implementation TopTiModule

-(id)version
{
	return @"__VERSION__";
}

-(id)buildDate
{
	return @"__TIMESTAMP__";
}

-(id)buildHash
{
	return @"__GITHASH__";
}

+(BOOL)shouldRegisterOnInit
{
	return NO;
}

-(id)userAgent
{
	return [[TiApp app] userAgent];
}

-(void)include:(NSArray*)jsfiles
{
	id<TiEvaluator> context = [self executionContext];
	NSURL * oldUrl = [context currentURL];
	NSURL * rootURL = (oldUrl != nil)?oldUrl:[self _baseURL];

	for (id file in jsfiles)
	{
		// only allow includes that are local to our execution context url
		// for security, refuse to load non-compiled in Javascript code
		NSURL *url = [TiUtils toURL:file relativeToURL:rootURL];
		DebugLog(@"[DEBUG] Include url: %@",[url absoluteString]);
		[context setCurrentURL:url];
		[context evalFile:[url absoluteString]];
	}

	[context setCurrentURL:oldUrl];
}

-(id)ressourcesRelativePath
{
	id<TiEvaluator> context = [self executionContext];
	NSURL * oldUrl = [context currentURL];
	NSURL * rootURL = (oldUrl != nil)?oldUrl:[self _baseURL];
    NSString * result = [[rootURL absoluteString] stringByReplacingOccurrencesOfString:[[self _baseURL] absoluteString] withString:@""];
	return result;
}

#ifdef DEBUG
// an internal include that works with absolute URLs (debug mode only)
-(void)includeAbsolute:(NSArray*)jsfiles
{
	for (id file in jsfiles)
	{
		DebugLog(@"[DEBUG] Absolute url: %@", file);

		NSURL *url = nil;
		if (![file hasPrefix:@"file:"]) {
			url = [NSURL URLWithString:file];
		} else {
			url = [[NSURL fileURLWithPath:file] standardizedURL];
		}
		[[self executionContext] evalFile:[url absoluteString]];
	}
}
#endif

-(TiBuffer*)createBuffer:(id)arg
{
    ENSURE_SINGLE_ARG_OR_NIL(arg, NSDictionary);

    int length;
    BOOL hasLength;
    id data;
    NSString* type;
    int byteOrder;
    BOOL hasByteOrder;
    
    ENSURE_INT_OR_NIL_FOR_KEY(length, arg, @"length", hasLength);
    ENSURE_ARG_OR_NIL_FOR_KEY(data, arg, @"value", NSObject);
    ENSURE_ARG_OR_NIL_FOR_KEY(type, arg, @"type", NSString);
    ENSURE_INT_OR_NIL_FOR_KEY(byteOrder, arg, @"byteOrder", hasByteOrder);
    
    TiBuffer* buffer = [[[TiBuffer alloc] _initWithPageContext:[self executionContext]] autorelease];
    if (hasLength) {
        [buffer setLength:[NSNumber numberWithInt:length]];
    }
    
    // NOTE: We use the length of the buffer as a hint when encoding strings.  In this case, if [string length] > length,
    // we only encode up to 'length' of the string.
    if ([data isKindOfClass:[NSString class]]) {
        int encodeLength = (hasLength) ? length : [data length];

        NSString* charset = (type != nil) ? type : kTiUTF8Encoding;
        
        // Just put the string data directly into the buffer, if we can.
        if (!hasLength){
            NSStringEncoding encoding = [TiUtils charsetToEncoding:charset];
            [buffer setData:[NSMutableData dataWithData:[data dataUsingEncoding:encoding]]];
        }
        else {
            switch ([TiUtils encodeString:data toBuffer:buffer charset:charset offset:0 sourceOffset:0 length:encodeLength]) {
                case BAD_DEST_OFFSET: // Data length == 0 : return our empty buffer
                case BAD_SRC_OFFSET: { // String length == 0 : return our empty buffer (no string encoded into it)
                    return buffer;
                    break;
                }
                case BAD_ENCODING: {
                    [self throwException:[NSString stringWithFormat:@"Invalid string encoding type '%@'",charset]
                               subreason:nil 
                                location:CODELOCATION];   
                    break;
                }
            }
        }
    }
    else if ([data isKindOfClass:[NSNumber class]]) {
        if (type == nil) {
            [self throwException:[NSString stringWithFormat:@"Missing required type information for buffer created with number %@",data]
                       subreason:nil
                        location:CODELOCATION];
        }
        
        if (!hasLength) {
            length = [TiUtils dataSize:[TiUtils constantToType:type]];
            [buffer setLength:NUMINT(length)];
        }
        
        byteOrder = (hasByteOrder) ? byteOrder : CFByteOrderGetCurrent();
        [buffer setByteOrder:[NSNumber numberWithInt:byteOrder]];
        switch ([TiUtils encodeNumber:data toBuffer:buffer offset:0 type:type endianness:byteOrder]) {
            case BAD_ENDIAN: {
                [self throwException:[NSString stringWithFormat:@"Invalid endianness: %d", byteOrder]
                           subreason:nil
                            location:CODELOCATION];
                break;
            }
            case BAD_DEST_OFFSET: { // Buffer size == 0; throw exception for numbers (is this right?!?)
                NSString* errorStr = [NSString stringWithFormat:@"Offset %d is past buffer bounds (length %d)",0,length];
                [self throwException:errorStr
                           subreason:nil
                            location:CODELOCATION];
                break;
            }
            case BAD_TYPE: {
                [self throwException:[NSString stringWithFormat:@"Invalid type identifier '%@'",type]
                           subreason:nil
                            location:CODELOCATION];
                break;
            }
            case TOO_SMALL: { // This makes sense, at least.
                [self throwException:[NSString stringWithFormat:@"Buffer of length %d too small to hold type %@",length, type]
                           subreason:nil
                            location:CODELOCATION];
                break;
            }
        }
    }
    else if (data != nil) {
        [self throwException:[NSString stringWithFormat:@"Invalid data type '%@'",data]
                   subreason:nil
                    location:CODELOCATION];
    }
    
    return buffer;
}

-(NSDictionary*)dumpCoverage:(id)unused_
{
#ifdef KROLL_COVERAGE
    NSDictionary* coverage = [KrollCoverageObject dumpCoverage];
    return coverage;
#else
    return [NSDictionary dictionary];
#endif
}

@end
