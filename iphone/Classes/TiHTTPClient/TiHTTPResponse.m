/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiHTTPClient.h"

@implementation TiHTTPResponse

@synthesize url = _url;
@synthesize status = _status;
@synthesize headers = _headers;
@synthesize responseArray = _responseArray;
@synthesize responseData = _responseData;
@synthesize responseDictionary = _responseDictionary;
@synthesize responseString = _responseString;
@synthesize error = _error;

- (void)dealloc
{
    RELEASE_TO_NIL(_data);
    RELEASE_TO_NIL(_location);
    RELEASE_TO_NIL(_connectionType);
    RELEASE_TO_NIL(_headers);
    RELEASE_TO_NIL(_error);
    
    [super dealloc];
}
-(void)setResponse:(NSURLResponse*) response
{
    _url = [response URL];
    if([response isKindOfClass:[NSHTTPURLResponse class]]) {
        _status = [(NSHTTPURLResponse*)response statusCode];
        _headers = [[(NSHTTPURLResponse*)response allHeaderFields] retain];
        NSStringEncoding encoding = [TiHTTPHelper parseStringEncodingFromHeaders: _headers];
        encoding = encoding == 0 ? NSUTF8StringEncoding : encoding;
        [self setEncoding: encoding];

    }
}
-(void)setRequest:(NSURLRequest*) request
{
    RELEASE_TO_NIL(_location);
    RELEASE_TO_NIL(_connectionType);
    _connectionType = [[request HTTPMethod] retain];
    _location = [[[request URL] absoluteString] retain];
}

-(void)appendData:(NSData *)data
{
    if(_data == nil) {
        _data = [[NSMutableData alloc] init];
    }
    [_data appendData:data];
}

-(NSData *)responseData
{
    if(_data == nil) {
        return nil;
    }
    return [[_data copy] autorelease];
}

-(id)jsonResponse
{
    if([self responseData] == nil) return nil;
    NSError *error = nil;
    id json = [NSJSONSerialization JSONObjectWithData: [self responseData]
                                              options: NSJSONReadingAllowFragments
                                                error: &error];
    if(error != nil) {
        DeveloperLog(@"%s - %@", __PRETTY_FUNCTION__, [error localizedDescription]);
        return nil;
    }
    return json;
}

-(NSString*)responseString
{
    if([self error] != nil) {
        DeveloperLog(@"%s", __PRETTY_FUNCTION__);
        return [[self error] localizedDescription];
    }
    if([self responseData] == nil || [[self responseData] length] == 0) return nil;
    NSData *data =  [self responseData];
    NSString * result = [[[NSString alloc] initWithBytes:[data bytes] length:[data length] encoding:[self encoding]] autorelease];
    if (result==nil) {
        // encoding failed, probably a bad webserver or content we have to deal
        // with in a _special_ way
        NSStringEncoding encoding = NSUTF8StringEncoding;
        BOOL didExtractEncoding =  [TiHTTPHelper extractEncodingFromData:data result:&encoding];
        if (didExtractEncoding) {
            //If I did extract encoding use that
            result = [[[NSString alloc] initWithBytes:[data bytes] length:[data length] encoding:encoding] autorelease];
        } else {
            result = [[[NSString alloc] initWithBytes:[data bytes] length:[data length] encoding:NSISOLatin1StringEncoding] autorelease];
        }
			
    }
    return result;
}

-(NSDictionary*)responseDictionary
{
    id json = [self jsonResponse];
    if([json isKindOfClass:[NSDictionary class]]) {
        DeveloperLog(@"%s", __PRETTY_FUNCTION__);
        return (NSDictionary*)json;
    }
    DeveloperLog(@"%s - JSON is %@", __PRETTY_FUNCTION__, [[json superclass] description]);
    return nil;
}
-(NSArray*)responseArray
{
    id json = [self jsonResponse];
    if([json isKindOfClass:[NSArray class]]) {
        return (NSArray*)json;
    }
    DeveloperLog(@"%s - JSON is %@", __PRETTY_FUNCTION__, [[json superclass] description]);
    return nil;
}

@end
