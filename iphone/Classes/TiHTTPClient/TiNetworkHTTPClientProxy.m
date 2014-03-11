/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_NETWORK

#import "TiNetworkHTTPClientProxy.h"
#import "NetworkModule.h"
#import "TiUtils.h"
#import "TiBase.h"
#import "TiApp.h"

#define TI_HTTP_REQUEST_PROGRESS_INTERVAL 0.03f

extern NSString * const TI_APPLICATION_GUID;

@implementation TiNetworkHTTPClientProxy

- (void)dealloc
{
    RELEASE_TO_NIL(httpRequest);
    [super dealloc];
}
-(TiHTTPRequest*)request
{
    if(httpRequest == nil) {
        httpRequest = [[TiHTTPRequest alloc] init];
        [httpRequest setDelegate:self];
    	[httpRequest addRequestHeader:@"User-Agent" value:[[TiApp app] userAgent]];
        [httpRequest addRequestHeader:[NSString stringWithFormat:@"%s-%s%s-%s", "X","Tita","nium","Id"] value:TI_APPLICATION_GUID];
        
    }
    return httpRequest;
}

-(TiHTTPResponse*)response
{
    return [[self request] response];
}

#pragma mark - Public methods

-(void)open:(id)args
{
    ENSURE_ARRAY(args);
    NSString *method = [TiUtils stringValue:[args objectAtIndex:0]];
    NSString *url = [TiUtils stringValue:[args objectAtIndex:1]];
    [[self request] setMethod: method];
    [[self request] setUrl:[NSURL URLWithString:url]];
    
    if([args count] >= 3) {
        [self replaceValue:[args objectAtIndex:2] forKey:@"async" notification: YES];
    }
    
    [self replaceValue:url forKey:@"url" notification:NO];
    [self replaceValue:method forKey:@"method" notification:NO];
}

-(void)send:(id)args
{
    [self rememberSelf];
    
    if([self valueForUndefinedKey:@"timeout"]) {
        [[self request] setTimeout: [TiUtils intValue:[self valueForUndefinedKey:@"timeout"] def:15000] / 1000 ];
    }
    if([self valueForUndefinedKey:@"autoRedirect"]) {
        [[self request] setRedirects:
         [TiUtils boolValue: [self valueForUndefinedKey:@"autoRedirect"] def:YES] ];
    }
    if([self valueForUndefinedKey:@"cache"]) {
        [[self request] setCachePolicy:
         [TiUtils boolValue: [self valueForUndefinedKey:@"cache"] def:YES] ?
             NSURLRequestUseProtocolCachePolicy : NSURLRequestReloadIgnoringLocalAndRemoteCacheData
         ];
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
    if([self valueForUndefinedKey:@"domain"]) {
        // TODO: NTLM
    }
	// twitter specifically disallows X-Requested-With so we only add this normal
	// XHR header if not going to twitter. however, other services generally expect
	// this header to indicate an XHR request (such as RoR)
	if ([[self valueForUndefinedKey:@"url"] rangeOfString:@"twitter.com"].location==NSNotFound)
	{
		[[self request] addRequestHeader:@"X-Requested-With" value:@"XMLHttpRequest"];
	}
    id file = [self valueForUndefinedKey:@"file"];
    if(file) {
        NSString *filePath = nil;
        if([file isKindOfClass:[TiFile class]]) {
            filePath = [(TiFile*)file path];
        }
        if([file isKindOfClass:[NSString class]]) {
            filePath = [TiUtils stringValue:file];
        }
        if(filePath != nil) {
            [[self request] setFilePath:filePath];
        }
    }
    
    
    TiHTTPPostForm *form = nil;
    if(args != nil) {
        ENSURE_ARRAY(args);
        NSInteger dataIndex = 0;
        form = [[[TiHTTPPostForm alloc] init] autorelease];
        id arg = [args objectAtIndex:0];
        if([arg isKindOfClass:[NSDictionary class]]) {
            NSDictionary *dict = (NSDictionary*)arg;
            for(NSString *key in dict) {
                id value = [dict objectForKey:key];
                if([value isKindOfClass:[TiBlob class]]|| [value isKindOfClass:[TiFile class]]) {
                    TiBlob *blob;
                    NSString *name;
                    NSString *mime;
                    if([value isKindOfClass:[TiBlob class]]) {
                        blob = (TiBlob*)value;
                        if([blob path] != nil) {
                            name = [[blob path] lastPathComponent];
                        } else {
                            name = [NSString stringWithFormat:@"file%i", dataIndex++];
                        }
                    }else{
                        blob = [(TiFile*)value blob];
                        name = [[(TiFile*)value path] lastPathComponent];
                    }
                    mime = [blob mimeType];
                    if(mime != nil) {
                        [form addFormData:[blob data] fileName:name fieldName:key contentType:mime];
                    } else {
                        [form addFormData:[blob data] fileName:name fieldName:key];
                    }
                }
                else {
                    [form addFormKey:key
                            andValue:[TiUtils stringValue:value]];
                }
            }
        } else if ([arg isKindOfClass:[TiBlob class]] || [arg isKindOfClass:[TiFile class]]) {
            TiBlob *blob;
            if([arg isKindOfClass:[TiBlob class]]) {
                blob = (TiBlob*)arg;
            } else {
                blob = [(TiFile*)arg blob];
            }
            NSString *mime = [blob mimeType];
            if(mime == nil) {
                mime = @"application/octet-stream";
            }
            [form appendData:[blob data] withContentType:mime];
        } else {
            [form setStringData:[TiUtils stringValue:arg]];
        }
    }
    
    if(form != nil) {
        [[self request] setPostForm:form];
    }
    
    BOOL async = [TiUtils boolValue:[self valueForUndefinedKey:@"async"] def:YES];
    
    NSOperationQueue *operationQueue = [NetworkModule operationQueue];
    
    [[TiApp app] startNetwork];
    if(async) {
        [[self request] setTheQueue:operationQueue];
        [[self request] send];
    } else {
        [[self request] setSynchronous:YES];
        [[self request] send];
        [[TiApp app] stopNetwork];
        [self forgetSelf];
    }
}

-(void)abort:(id)args
{
    [[self request] abort];
}

-(void)clearCookies:(id)args
{
    ENSURE_ARG_COUNT(args, 1);
    
    NSString *host = [TiUtils stringValue:[args objectAtIndex:0]];
    
    NSHTTPCookie *cookie;
    NSHTTPCookieStorage *storage = [NSHTTPCookieStorage sharedHTTPCookieStorage];
    NSArray* targetCookies = [storage cookiesForURL:[NSURL URLWithString:host]];
    if ([targetCookies count] > 0) {
        for (cookie in targetCookies) {
            [storage deleteCookie:cookie];
        }
    }
}

-(NSString*)getResponseHeader:(id)args
{
    ENSURE_SINGLE_ARG(args, NSString)
    return [[[self response] headers] valueForKey:args];
}

# pragma mark - Callback functions

-(void)tiRequest:(TiHTTPRequest *)request onDataStream:(TiHTTPResponse *)tiResponse
{
    if(hasOndatastream) {
        NSTimeInterval currentTime = [[NSDate date] timeIntervalSince1970];
        NSTimeInterval diff = currentTime - _downloadTime;
        if(_downloadTime == 0 || diff > TI_HTTP_REQUEST_PROGRESS_INTERVAL || [tiResponse readyState] == TiHTTPResponseStateDone) {
            _downloadTime = 0;
            NSDictionary *eventDict = [NSMutableDictionary dictionary];
            [eventDict setValue:[NSNumber numberWithFloat: [tiResponse downloadProgress]] forKey:@"progress"];
            [self fireCallback:@"ondatastream" withArg:eventDict withSource:self];
        }
        if(_downloadTime == 0) {
            _downloadTime = currentTime;
        }
    }
}

-(void)tiRequest:(TiHTTPRequest *)request onSendStream:(TiHTTPResponse *)tiResponse
{
    if(hasOnsendstream) {
        NSTimeInterval currentTime = [[NSDate date] timeIntervalSince1970];
        NSTimeInterval diff = currentTime - _uploadTime;
        if(_uploadTime == 0 || diff > TI_HTTP_REQUEST_PROGRESS_INTERVAL || [tiResponse readyState] == TiHTTPResponseStateDone) {
            _uploadTime = 0;
            NSDictionary *eventDict = [NSMutableDictionary dictionary];
            [eventDict setValue:[NSNumber numberWithFloat: [tiResponse uploadProgress]] forKey:@"progress"];
            [self fireCallback:@"onsendstream" withArg:eventDict withSource:self];
        }
        if(_uploadTime == 0) {
            _uploadTime = currentTime;
        }
    }
}

-(void)tiRequest:(TiHTTPRequest *)request onLoad:(TiHTTPResponse *)tiResponse
{
    [[TiApp app] stopNetwork];
    if([request cancelled]) {
        return;
    }
    int responseCode = [tiResponse status];
    /**
     *    Per customer request, successful communications that resulted in an
     *    4xx or 5xx response is treated as an error instead of an onload.
     *    For backwards compatibility, if no error handler is provided, even
     *    an 4xx or 5xx response will fall back onto an onload.
     */
    if (hasOnerror && (responseCode >= 400) && (responseCode <= 599)) {
        NSMutableDictionary * event = [TiUtils dictionaryWithCode:responseCode message:@"HTTP error"];
        [event setObject:@"error" forKey:@"type"];
        [self fireCallback:@"onerror" withArg:event withSource:self];
    } else if(hasOnload) {
        NSMutableDictionary * event = [TiUtils dictionaryWithCode:0 message:nil];
        [event setObject:@"load" forKey:@"type"];
        [self fireCallback:@"onload" withArg:event withSource:self];
    }
    
    [self forgetSelf];
}

-(void)tiRequest:(TiHTTPRequest *)request onError:(TiHTTPResponse *)tiResponse
{
    [[TiApp app] stopNetwork];
    if([request cancelled]) {
        return;
    }
    if(hasOnerror) {
        NSError *error = [tiResponse error];
        NSMutableDictionary * event = [TiUtils dictionaryWithCode:[error code] message:[TiUtils messageFromError:error]];
        [event setObject:@"error" forKey:@"type"];
        [self fireCallback:@"onerror" withArg:event withSource:self];
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
        [self fireCallback:@"onredirect" withArg:nil withSource:self];
    }
}

#pragma mark - Pulbic setters

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

-(void)setRequestHeader:(id)args
{
    ENSURE_ARG_COUNT(args,2);
    
    NSString *key = [TiUtils stringValue:[args objectAtIndex:0]];
    NSString *value = [TiUtils stringValue:[args objectAtIndex:1]];
    [[self request] addRequestHeader:key value:value];
}

#pragma mark - Public getter properties

-(NSDictionary*)allResponseHeaders
{
    return [[self response] headers];
}

-(NSString*)apiName
{
    return @"Ti.Network.HTTPClient";
}

-(NSNumber*)connected
{
    if([self response] == nil) {
        return NUMBOOL(NO);
    }
    TiHTTPResponseState state = [[[self request] response] readyState];
    return NUMBOOL(
                   state == TiHTTPResponseStateHeaders ||
                   state == TiHTTPResponseStateLoading ||
                   state == TiHTTPResponseStateOpened
                   );
}

-(NSNumber*)status
{
    return NUMINT([[self response] status]);
}
-(NSString*)location
{
    if([self response] == nil) {
        return [self valueForUndefinedKey:@"url"];
    }
    return [[self response] location];
}
-(NSString*)connectionType
{
    if([self response] == nil) {
        return [self valueForUndefinedKey:@"method"];
    }
    return [[self response] connectionType];
}
-(NSString*)responseText
{
    return [[self response] responseString];
}
-(TiBlob*)responseData
{
    NSString *contentType = [TiUtils stringValue: [[self responseHeaders] valueForKey:@"Content-Type"]];
    return [[[TiBlob alloc] initWithData:[[self response] responseData] mimetype:contentType] autorelease];
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
    return [[self response] responseDictionary];
}
-(NSArray*)responseArray
{
    return [[self response] responseArray];
}
-(NSNumber*)readyState
{
    return NUMINT([[self response] readyState]);
}
-(NSDictionary*)responseHeaders
{
    return [[self response] headers];
}

MAKE_SYSTEM_NUMBER(UNSENT, NUMINT(TiHTTPResponseStateUnsent))
MAKE_SYSTEM_NUMBER(OPENED, NUMINT(TiHTTPResponseStateOpened))
MAKE_SYSTEM_NUMBER(HEADERS_RECEIVED, NUMINT(TiHTTPResponseStateHeaders))
MAKE_SYSTEM_NUMBER(LOADING, NUMINT(TiHTTPResponseStateLoading))
MAKE_SYSTEM_NUMBER(DONE, NUMINT(TiHTTPResponseStateDone))


@end

#endif