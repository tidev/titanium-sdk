/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Special thanks to Pedro Enrique for implementing this.
 */

#import "HttpClientProxy.h"

#ifndef TI_HTTP_MODULE
#import "NetworkModule.h"
#else
#import "TiHttpModule.h"
#endif

#import "TiDOMDocumentProxy.h"
#import "TiUtils.h"
#import "TiBlob.h"

#define TI_HTTP_REQUEST_PROGRESS_INTERVAL 0.03f

@implementation HTTPClientProxy

- (void)dealloc
{
    RELEASE_TO_NIL(response);
    RELEASE_TO_NIL(httpRequest);
    [super dealloc];
}
-(TiHTTPRequest*)request
{
    if(httpRequest == nil) {
        httpRequest = [[TiHTTPRequest alloc] init];
        [httpRequest setDelegate:self];
    }
    return httpRequest;
}

#pragma mark - Public methods

-(void)open:(id)args
{
    ENSURE_ARRAY(args)
    NSString *method = [TiUtils stringValue:[args objectAtIndex:0]];
    NSString *url = [TiUtils stringValue:[args objectAtIndex:1]];
    [[self request] setMethod: method];
    [[self request] setUrl:[NSURL URLWithString:url]];
    
    if([args count] >= 3) {
        [self replaceValue:[args objectAtIndex:2] forKey:@"async" notification:NO];
    }
    
    [self replaceValue:url forKey:@"url" notification:NO];
    [self replaceValue:method forKey:@"method" notification:NO];
}

-(void)send:(id)args
{
    [self rememberSelf];
    [[UIApplication sharedApplication] setNetworkActivityIndicatorVisible:YES];

    if([self valueForUndefinedKey:@"timeout"]) {
        [[self request] setTimeout: [TiUtils intValue:[self valueForUndefinedKey:@"timeout"] def:1000] / 1000 ];
    }
    if([self valueForUndefinedKey:@"autoRedirect"]) {
        [[self request] setRedirects:
         [TiUtils boolValue: [self valueForUndefinedKey:@"autoRedirect"] def:YES] ];
    }
    if([self valueForUndefinedKey:@"validatesSecureCertificate"]) {
        [[self request] setValidatesSecureCertificate:
         [TiUtils boolValue: [self valueForUndefinedKey:@"validatesSecureCertificate"] def:YES] ];
    }

    if([self valueForUndefinedKey:@"username"]) {
        [[self request] setRequestUsername:
         [TiUtils stringValue: [self valueForUndefinedKey:@"username"]]];
    }

    if([self valueForUndefinedKey:@"password"]) {
        [[self request] setRequestPassword:
         [TiUtils stringValue: [self valueForUndefinedKey:@"password"]]];
    }

    TiHTTPPostForm *form = nil;
    if(args != nil) {
        ENSURE_ARRAY(args)
        form = [[[TiHTTPPostForm alloc] init] autorelease];
        id arg = [args objectAtIndex:0];
        if([arg isKindOfClass:[NSDictionary class]]) {
            NSDictionary *dict = (NSDictionary*)arg;
            NSInteger dataIndex = 0;
            for(NSString *key in dict) {
                id value = [dict objectForKey:key];
                if([value isKindOfClass:[NSString class]]) {
                    [form addFormKey:key andValue: (NSString*)value];
                }
                else if([value isKindOfClass:[TiBlob class]]) {
                    [form addFormData:[(TiBlob*)value data]
                             fileName:[NSString stringWithFormat:@"file%i", dataIndex++]
                            fieldName:key];
                }
                else if([value isKindOfClass:[NSDictionary class]] || [value isKindOfClass:[NSArray class]]) {
                    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:value options:kNilOptions error:nil];
                    [form addFormKey:key
                            andValue:[NSString stringWithUTF8String:[jsonData bytes]]];
                }
            }
        } else if ([arg isKindOfClass:[TiBlob class]]) {
            TiBlob *blob = (TiBlob*)arg;
            [form addFormData:[blob data]];
        } else if([arg isKindOfClass:[NSString class]]) {
            [form setStringData:(NSString*)arg];
        }
    }
    
    if(form != nil) {
        [[self request] setPostForm:form];
    }
    
    BOOL async = YES;
    if([self valueForUndefinedKey:@"async"]) {
        async = [TiUtils boolValue:[self valueForUndefinedKey:@"async"]];
    }
    NSOperationQueue *operationQueue =
#ifndef TI_HTTP_MODULE
    [NetworkModule operationQueue];
#else
    [TiHttpModule operationQueue];
#endif

    if(async) {
        [[self request] setTheQueue:operationQueue];
        [[self request] send];
    } else {
        [[self request] setSynchronous:YES];
        [[self request] send];
        response = [[[self request] response] retain];
        if([operationQueue operationCount] == 0) {
            [[UIApplication sharedApplication] setNetworkActivityIndicatorVisible:NO];
        }
    }
}

-(void)abort:(id)args
{
    [[self request] abort];
}

-(NSString*)getResponseHeader:(id)args
{
    ENSURE_SINGLE_ARG(args, NSString)
    return [[response headers] valueForKey:args];
}

# pragma mark - Callback functions

-(void)tiRequest:(TiHTTPRequest *)request onDataStream:(TiHTTPResponse *)tiResponse
{
    if(hasOndatastream) {
        NSTimeInterval diff = [[NSDate date] timeIntervalSince1970] - _downloadTime;
        if(_downloadTime == 0 || diff > TI_HTTP_REQUEST_PROGRESS_INTERVAL || [tiResponse readyState] == TiResponseStateDone) {
            _downloadTime = 0;
            NSDictionary *eventDict = @{@"progress": [NSNumber numberWithFloat: [tiResponse downloadProgress]]};
            [self fireCallback:@"ondatastream" withArg:eventDict withSource:self];
        }
        if(_downloadTime == 0) {
            _downloadTime = [[NSDate date] timeIntervalSince1970];
        }
    }
}

-(void)tiRequest:(TiHTTPRequest *)request onSendStream:(TiHTTPResponse *)tiResponse
{
    if(hasOnsendstream) {
        NSTimeInterval diff = [[NSDate date] timeIntervalSince1970] - _uploadTime;
        if(_uploadTime == 0 || diff > TI_HTTP_REQUEST_PROGRESS_INTERVAL || [tiResponse readyState] == TiResponseStateDone) {
            _uploadTime = 0;
            NSDictionary *eventDict = @{@"progress": [NSNumber numberWithFloat: [tiResponse uploadProgress]]};
            [self fireCallback:@"onsendstream" withArg:eventDict withSource:self];
        }
        if(_uploadTime == 0) {
            _uploadTime = [[NSDate date] timeIntervalSince1970];
        }
    }
}

-(void)tiRequest:(TiHTTPRequest *)request onLoad:(TiHTTPResponse *)tiResponse
{
    response = [tiResponse retain];
    if(hasOnload) {
        [self fireCallback:@"onload" withArg:nil withSource:self];
    }
    NSOperationQueue *operationQueue =
#ifndef TI_HTTP_MODULE
    [NetworkModule operationQueue];
#else
    [TiHttpModule operationQueue];
#endif

    if([operationQueue operationCount] == 0) {
        [[UIApplication sharedApplication] setNetworkActivityIndicatorVisible:NO];
    }
    [self forgetSelf];
}
-(void)tiRequest:(TiHTTPRequest *)request onError:(TiHTTPResponse *)tiResponse
{
    if([self valueForUndefinedKey:@"onerror"]) {
        [self replaceValue:[[tiResponse error] localizedDescription] forKey:@"error" notification:NO];
        [self fireCallback:@"onerror" withArg:nil withSource:self];
    }
    NSOperationQueue *operationQueue =
#ifndef TI_HTTP_MODULE
    [NetworkModule operationQueue];
#else
    [TiHttpModule operationQueue];
#endif
    
    if([operationQueue operationCount] == 0) {
        [[UIApplication sharedApplication] setNetworkActivityIndicatorVisible:NO];
    }
    [self forgetSelf];
}


-(void)tiRequest:(TiHTTPRequest *)request onReadyStateChage:(TiHTTPResponse *)tiResponse
{
    if(hasOnreadystatechange) {
        [self fireCallback:@"onreadystatechange" withArg:nil withSource:self];
    }
}

-(void)tiRequest:(TiHTTPRequest *)request onRedirect:(TiHTTPResponse *)tiResponse
{
    if(hasOnredirect) {
        RELEASE_AND_REPLACE(response, tiResponse)
        response = [tiResponse retain];
        [self fireCallback:@"onredirect" withArg:nil withSource:self];
    }
}

#pragma mark - Setters

-(void)setOnload:(id)callback
{
	ENSURE_SINGLE_ARG(callback, KrollCallback)
    [self replaceValue:callback forKey:@"onload" notification:NO];
    hasOnload = YES;
}
-(void)setOnerror:(id)callback
{
	ENSURE_SINGLE_ARG(callback, KrollCallback)
    [self replaceValue:callback forKey:@"onerror" notification:NO];
    hasOnerror = YES;
}
-(void)setOnreadystatechange:(id)callback
{
	ENSURE_SINGLE_ARG(callback, KrollCallback)
    [self replaceValue:callback forKey:@"onreadystatechange" notification:NO];
    hasOnreadystatechange = YES;
}
-(void)setOndatastream:(id)callback
{
	ENSURE_SINGLE_ARG(callback, KrollCallback)
    [self replaceValue:callback forKey:@"ondatastream" notification:NO];
    hasOndatastream = YES;
}
-(void)setOnsendstream:(id)callback
{
	ENSURE_SINGLE_ARG(callback, KrollCallback)
    [self replaceValue:callback forKey:@"onsendstream" notification:NO];
    hasOnsendstream = YES;
}
-(void)setOnredirect:(id)callback
{
	ENSURE_SINGLE_ARG(callback, KrollCallback)
    [self replaceValue:callback forKey:@"onredirect" notification:NO];
    hasOnredirect = YES;
}


#pragma mark - Public getter properties
-(NSString*)method
{
    if(response == nil) {
        return [self valueForUndefinedKey:@"method"];
    }
    return [response connectionType];
}
-(NSString*)url
{
    if(response == nil) {
        return [self valueForUndefinedKey:@"url"];
    }
    return [response location];
}
-(NSString*)location
{
    return [self url];
}
-(NSString*)connectionType
{
    return [self method];
}
-(NSString*)responseText
{
    return [response responseString];
}
-(TiBlob*)responseData
{
    return [[[TiBlob alloc] initWithData:[response responseData] mimetype:@""] autorelease];
}
-(TiDOMDocumentProxy*)responseXML
{
    if ([self responseText] != nil && (![[self responseText] isEqual:(id)[NSNull null]])) {
        TiDOMDocumentProxy *responseXML = [[[TiDOMDocumentProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
        [responseXML parseString:[self responseText]];
        return responseXML;
    }
    return nil;
}
-(NSDictionary*)responseDictionary
{
    return [response responseDictionary];
}
-(NSArray*)responseArray
{
    return [response responseArray];
}

-(NSNumber*)readyState
{
    return NUMINT([response readyState]);
}

-(NSDictionary*)responseHeaders
{
    return [response headers];
}

@end
