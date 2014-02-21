/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "HttpClientProxy.h"
#import "NetworkModule.h"
#import "TiUtils.h"
#import "TiApp.h"

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
        [self replaceValue:[args objectAtIndex:2] forKey:@"async" notification: YES];
    }
    
    [self replaceValue:url forKey:@"url" notification:NO];
    [self replaceValue:method forKey:@"method" notification:NO];
}

-(void)send:(id)args
{
    [self rememberSelf];
    [[TiApp app] startNetwork];
    
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
             NSURLCacheStorageAllowed : NSURLCacheStorageNotAllowed
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

    TiHTTPPostForm *form = nil;
    if(args != nil) {
        ENSURE_ARRAY(args)
        NSInteger dataIndex = 0;
        form = [[[TiHTTPPostForm alloc] init] autorelease];
        id arg = [args objectAtIndex:0];
        if([arg isKindOfClass:[NSDictionary class]]) {
            NSDictionary *dict = (NSDictionary*)arg;
            for(NSString *key in dict) {
                id value = [dict objectForKey:key];
                if([value isKindOfClass:[NSString class]]) {
                    [form addFormKey:key andValue: (NSString*)value];
                }
                else if([value isKindOfClass:[TiBlob class]]|| [value isKindOfClass:[TiFile class]]) {
                    TiBlob *blob;
                    NSString *name;
                    if([value isKindOfClass:[TiBlob class]]) {
                        blob = (TiBlob*)value;
                        name = [NSString stringWithFormat:@"file%i", dataIndex++];
                    }else{
                        blob = [(TiFile*)value blob];
                        name = [[(TiFile*)value path] lastPathComponent];
                    }
                    [form addFormData:[(TiBlob*)value data]
                             fileName:name
                            fieldName:key];
                }
                else if([value isKindOfClass:[NSDictionary class]] || [value isKindOfClass:[NSArray class]]) {
                    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:value options:kNilOptions error:nil];
                    [form addFormKey:key
                            andValue:[NSString stringWithUTF8String:[jsonData bytes]]];
                }
            }
        } else if ([arg isKindOfClass:[TiBlob class]] || [arg isKindOfClass:[TiFile class]]) {
            TiBlob *blob;
            NSString *name;
            if([arg isKindOfClass:[TiBlob class]]) {
                blob = (TiBlob*)arg;
                name = [NSString stringWithFormat:@"file%i", dataIndex++];
            } else {
                blob = [(TiFile*)arg blob];
                name = [[(TiFile*)arg path] lastPathComponent];
            }
            [form addFormData:[blob data] fileName:name];
        } else if([arg isKindOfClass:[NSString class]]) {
            [form setStringData:(NSString*)arg];
        }
    }
    
    if(form != nil) {
        [[self request] setPostForm:form];
    }
    
    BOOL async = [TiUtils boolValue:[self valueForUndefinedKey:@"async"] def:YES];
    
    NSOperationQueue *operationQueue =
    [NetworkModule operationQueue];
    
    if(async) {
        [[self request] setTheQueue:operationQueue];
        [[self request] send];
    } else {
        [[self request] setSynchronous:YES];
        [[self request] send];
        response = [[[self request] response] retain];
        if([operationQueue operationCount] == 0) {
            [[TiApp app] stopNetwork];
        }
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
    return [[response headers] valueForKey:args];
}

-(NSDictionary*)allResponseHeaders
{
    return [response headers];
}

-(NSString*)apiName
{
    NSString *className =  NSStringFromClass ([self class]);
    className = [className stringByReplacingOccurrencesOfString:@"TiNetwork" withString:@""];
    className = [className stringByReplacingOccurrencesOfString:@"Proxy" withString:@""];
    return [NSString stringWithFormat:@"Ti.Network.%@", className];
}

-(NSNumber*)connected
{
    if([[self request] response] == nil) {
        return NUMBOOL(NO);
    }
    TiHTTPResponseState state = [[[self request] response]readyState];
    return NUMBOOL(
                   state == TiHTTPResponseStateHeaders ||
                   state == TiHTTPResponseStateLoading ||
                   state == TiHTTPResponseStateOpened
                   );
}

# pragma mark - Callback functions

-(void)tiRequest:(TiHTTPRequest *)request onDataStream:(TiHTTPResponse *)tiResponse
{
    if(hasOndatastream) {
        NSTimeInterval diff = [[NSDate date] timeIntervalSince1970] - _downloadTime;
        if(_downloadTime == 0 || diff > TI_HTTP_REQUEST_PROGRESS_INTERVAL || [tiResponse readyState] == TiHTTPResponseStateDone) {
            _downloadTime = 0;
            NSDictionary *eventDict = [NSMutableDictionary dictionary];
            [eventDict setValue:[NSNumber numberWithFloat: [tiResponse downloadProgress]] forKey:@"progress"];
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
        if(_uploadTime == 0 || diff > TI_HTTP_REQUEST_PROGRESS_INTERVAL || [tiResponse readyState] == TiHTTPResponseStateDone) {
            _uploadTime = 0;
            NSDictionary *eventDict = [NSMutableDictionary dictionary];
            [eventDict setValue:[NSNumber numberWithFloat: [tiResponse uploadProgress]] forKey:@"progress"];
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
    int responseCode = [response status];
    /**
     *	Per customer request, successful communications that resulted in an
     *	4xx or 5xx response is treated as an error instead of an onload.
     *	For backwards compatibility, if no error handler is provided, even
     *	an 4xx or 5xx response will fall back onto an onload.
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
    
    if([operationQueue operationCount] == 0) {
        [[TiApp app] stopNetwork];
    }
    [self forgetSelf];
}

-(void)tiRequest:(TiHTTPRequest *)request onError:(TiHTTPResponse *)tiResponse
{
    NSOperationQueue *operationQueue = [NetworkModule operationQueue];
    
    if([request cancelled]) {
        if([operationQueue operationCount] == 0) {
            [[TiApp app] stopNetwork];
        }
        return;
    }
    int responseCode = [tiResponse status];
    if(hasOnerror) {
        NSError *error = [tiResponse error];
        NSMutableDictionary * event = [TiUtils dictionaryWithCode:[error code] message:[TiUtils messageFromError:error]];
        [event setObject:@"error" forKey:@"type"];
        [self fireCallback:@"onerror" withArg:event withSource:self];
    }
    
    if([operationQueue operationCount] == 0) {
        [[TiApp app] stopNetwork];
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

-(NSNumber*)status
{
    return NUMINT([response status]);
}
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
-(NSNumber*)UNSENT
{
	return NUMINT(TiHTTPResponseStateUnsent);
}
-(NSNumber*)OPENED
{
	return NUMINT(TiHTTPResponseStateOpened);
}
-(NSNumber*)HEADERS_RECEIVED
{
	return NUMINT(TiHTTPResponseStateHeaders);
}
-(NSNumber*)LOADING
{
	return NUMINT(TiHTTPResponseStateLoading);
}
-(NSNumber*)DONE
{
	return NUMINT(TiHTTPResponseStateDone);
}


@end
