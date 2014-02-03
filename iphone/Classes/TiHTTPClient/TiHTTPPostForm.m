/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Special thanks to Pedro Enrique for implementing this.
 */

#import "TiHTTPClient.h"
#import <MobileCoreServices/MobileCoreServices.h>

@implementation TiHTTPPostForm


- (void)dealloc
{
    RELEASE_TO_NIL(_headers);
    RELEASE_TO_NIL(_postFormData);
    RELEASE_TO_NIL(_requestFormDictionay);
    RELEASE_TO_NIL(_requestFilesArray);
    RELEASE_TO_NIL(_jsonData);
    RELEASE_TO_NIL(_stringData);
    [super dealloc];
}


-(void)appendStringData:(NSString*)str
{
    [[self postFormData] appendData:[str dataUsingEncoding: NSUTF8StringEncoding]];
}

-(void)appendData:(NSData*)data
{
    [[self postFormData] appendData: data];
}

-(void)buildStringPostData
{
	NSString *charset = (NSString *)CFStringConvertEncodingToIANACharSetName(CFStringConvertNSStringEncodingToEncoding(NSUTF8StringEncoding));

    [self addHeaderKey:@"Content-Type" andHeaderValue:[NSString stringWithFormat:@"application/x-www-form-urlencoded; charset=%@", charset]];
	BOOL last = NO;
    NSArray *allKeys = [[self requestFormDictionay] allKeys];
    for(NSInteger i = 0, len = [allKeys count]; i < len; i++)
    {
        if(i == len - 1) {
            last = YES;
        }
        NSString *key = [allKeys objectAtIndex:i];
        [self appendStringData:[NSString stringWithFormat:@"%@=%@%@",
                          [TiHTTPHelper encodeURL:key],
                          [TiHTTPHelper encodeURL: [[self requestFormDictionay] valueForKey:key]],
                          (last ?  @"" : @"&")
                          ]
         ];

    }
    

}
-(void)buildFilePostData
{
	NSString *charset = (NSString *)CFStringConvertEncodingToIANACharSetName(CFStringConvertNSStringEncodingToEncoding(NSUTF8StringEncoding));

    NSString* boundry = [NSString stringWithFormat:@"0xTibOuNdArY_%i", (int)[[NSDate date] timeIntervalSince1970]];
    [self addHeaderKey:@"Content-Type" andHeaderValue:[NSString stringWithFormat:@"multipart/form-data; charset=%@; boundary=%@", charset, boundry]];
    
    [self appendStringData:[NSString stringWithFormat:@"--%@\r\n",boundry]];
    
    NSArray *allKeys = [[self requestFormDictionay] allKeys];
    NSInteger fileCount = [[self requestFilesArray] count];
    BOOL last = NO;

    for(NSInteger i = 0, len = [allKeys count]; i < len; i++)
    {
        if(i == len - 1 && fileCount == 0) {
            last = YES;
        }

        NSString *key = [allKeys objectAtIndex:i];
        [self appendStringData: [NSString stringWithFormat:@"Content-Disposition: form-data; name=\"%@\"\r\n", key]];
        [self appendStringData:@"\r\n"];
        [self appendStringData:[NSString stringWithFormat:@"%@\r\n", [[self requestFormDictionay] valueForKey:key]]];
        [self appendStringData:[NSString stringWithFormat:@"--%@\r\n", last ? [@"--" stringByAppendingString:boundry] : boundry]];
         
         // Content-Disposition: form-data; name="username"
         //
         // pec1095
         // --0xTibOuNdArY
    }

    for(NSInteger i = 0; i < fileCount; i++)
    {
        if(i == fileCount - 1) {
            last = YES;
        }
        NSDictionary *dict = [[self requestFilesArray] objectAtIndex:i];
        
        [self appendStringData: [NSString stringWithFormat:@"Content-Disposition: form-data; name=\"%@\"; filename=\"%@\"\r\n", [dict valueForKey:@"fileField"], [dict valueForKey:@"fileName"]]];
		[self appendStringData: [NSString stringWithFormat:@"Content-Type: %@\r\n\r\n", [dict objectForKey:@"contentType"]]];
        [self appendData:[dict valueForKey:@"fileData"]];
        [self appendStringData:[NSString stringWithFormat:@"\r\n--%@\r\n", last ? [boundry stringByAppendingString:@"--"] : boundry]];

        // Content-Disposition: form-data; name="file0"; filename="image.jpg"
        // Content-Type: application/octet-stream
        //
        // [binary data]
        // --0xTibOuNdArY
        
    }

}

-(NSData*)requestData
{
    NSInteger fileCount = [[self requestFilesArray] count];
    RELEASE_TO_NIL(_postFormData);
    if(_stringData != nil) {
        [self appendData:_stringData];
    }
    if(_jsonData != nil) {
        NSString *charset = (NSString *)CFStringConvertEncodingToIANACharSetName(CFStringConvertNSStringEncodingToEncoding(NSUTF8StringEncoding));
        [self appendData:_jsonData];
        [self addHeaderKey:@"Content-Type" andHeaderValue:[NSString stringWithFormat: @"application/json;charset=%@", charset]];
    } else if(fileCount == 0) {
        [self buildStringPostData];
    } else {
        [self buildFilePostData];
    }
    [self addHeaderKey:@"Connection" andHeaderValue:@"close"];
    [self addHeaderKey:@"Content-Length" andHeaderValue:[NSString stringWithFormat:@"%i", [[self postFormData] length]]];
    return [self postFormData];
}
-(NSMutableData*)postFormData
{
    if(_postFormData == nil) {
        _postFormData = [[NSMutableData alloc] init];
    }
    return _postFormData;
}
-(NSDictionary*)requestHeaders
{
    return [[_headers copy] autorelease];
}

-(NSMutableDictionary*)requestFormDictionay
{
    if(_requestFormDictionay == nil) {
        _requestFormDictionay = [[NSMutableDictionary alloc] init];
    }
    return _requestFormDictionay;
}
-(NSMutableArray*)requestFilesArray
{
    if(_requestFilesArray == nil) {
        _requestFilesArray = [[NSMutableArray alloc] init];
    }
    return _requestFilesArray;
}
-(NSMutableDictionary*)headers
{
    if(_headers == nil) {
        _headers = [[NSMutableDictionary alloc] init];
    }

    return _headers;
}

-(void)setJSONData:(id)json
{
    NSError *error = nil;
    RELEASE_TO_NIL(_jsonData);
    _jsonData = [[NSJSONSerialization dataWithJSONObject:json options:kNilOptions error:&error] retain];
    if(error != nil) {
        NSLog(@"Error reading JSON: %@", [error localizedDescription]);
    }
}

-(void)setStringData:(NSString *)str
{
    RELEASE_TO_NIL(_stringData);
    _stringData = [[str dataUsingEncoding: NSUTF8StringEncoding] retain];
}

-(void)addDictionay:(NSDictionary*)dict
{
    [[self requestFormDictionay] setValuesForKeysWithDictionary:dict];
}

-(void)addFormKey:(NSString*)key andValue:(NSString*)value
{
	[[self requestFormDictionay] setValue:value forKey:key];
}

-(void)addFormFile:(NSString*)path;
{
    [self addFormFile:path fieldName:[NSString stringWithFormat:@"file%i", (unsigned int)[[self requestFilesArray] count]]];
}

-(void)addFormFile:(NSString*)path fieldName:(NSString*)name;
{
    [self addFormFile:path fieldName:name contentType:[TiHTTPHelper fileMIMEType:path]];
}

-(void)addFormFile:(NSString*)path fieldName:(NSString*)name contentType:(NSString*)contentType
{
    NSData *fileData = [NSData dataWithContentsOfFile:path];
    if(fileData == nil) {
        PELog(@"%s Cannot find file %@", __PRETTY_FUNCTION__, path);
        return;
    }
    NSString *fileName = [[path componentsSeparatedByString:@"/"] lastObject];
    
    [self addFormData:fileData fileName:fileName fieldName:name contentType:contentType];
}


-(void)addFormData:(NSData*)data
{
    [self addFormData:data
             fileName:[NSString stringWithFormat:@"file%i", (unsigned int)[[self requestFilesArray] count]]
     ];
}
-(void)addFormData:(NSData*)data fileName:(NSString*)fileName
{
    [self addFormData: data
             fileName: fileName
            fieldName: [NSString stringWithFormat:@"file_%i", (unsigned int)[[self requestFilesArray] count]]
     ];

}
-(void)addFormData:(NSData*)data fileName:(NSString*)fileName fieldName:(NSString*)fieldName
{
    [self addFormData: data
             fileName: fileName
            fieldName: fieldName
          contentType: [TiHTTPHelper contentTypeForImageData:data]
     ];

}
-(void)addFormData:(NSData*)data fileName:(NSString*)fileName fieldName:(NSString*)fieldName contentType:(NSString*)contentType
{
    [[self requestFilesArray] addObject:@{
                                          @"fileField": fieldName,
                                          @"fileName" : fileName,
                                          @"fileData" : data,
                                          @"contentType" : contentType
                                          }];
}

-(void)addHeaderKey:(NSString*)key andHeaderValue:(NSString*)value
{
	[[self headers] setValue:value forKey:key];
}

@end
