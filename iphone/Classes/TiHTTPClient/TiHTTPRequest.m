/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiHTTPClient.h"

@implementation TiHTTPRequest
@synthesize url = _url;
@synthesize method = _method;
@synthesize response = _response;
@synthesize filePath = _filePath;
@synthesize requestPassword = _requestPassword;
@synthesize requestUsername = _requestUsername;

- (void)dealloc
{
    RELEASE_TO_NIL(_connection);
    RELEASE_TO_NIL(_request);
    RELEASE_TO_NIL(_response);
    RELEASE_TO_NIL(_url);
    RELEASE_TO_NIL(_method);
    RELEASE_TO_NIL(_filePath);
    RELEASE_TO_NIL(_requestUsername);
    RELEASE_TO_NIL(_requestPassword);
    RELEASE_TO_NIL(_postForm);
    RELEASE_TO_NIL(_operation);
    RELEASE_TO_NIL(_userInfo);
    RELEASE_TO_NIL(_headers);
    [super dealloc];
}
- (id)init
{
    self = [super init];
    if (self) {
        [self initialize];
    }
    return self;
}

-(void)initialize
{
    [self setSendDefaultCookies:YES];
    [self setRedirects:YES];
    [self setValidatesSecureCertificate: YES];
    
    _request = [[NSMutableURLRequest alloc] init];
    [_request setCachePolicy:NSURLCacheStorageAllowed];
    _response = [[TiHTTPResponse alloc] init];
    [_response setReadyState: TiHTTPResponseStateUnsent];
}

-(void)abort
{
    if(_connection != nil)
        [_connection cancel];
    if(_operation != nil)
        [_operation cancel];
}

-(void)send
{
    if([self postForm] != nil) {
        NSData *data = [[self postForm] requestData];
        if([data length] > 0) {
            [_request setHTTPBody:data];
        }
        DeveloperLog(@"Data: %@", [NSString stringWithUTF8String: [data bytes]]);
        NSDictionary *headers = [[self postForm] requestHeaders];
        for (NSString* key in headers)
        {
            [_request setValue:[headers valueForKey:key] forHTTPHeaderField:key];
            DeveloperLog(@"Header: %@: %@", key, [headers valueForKey:key]);
        }
    }
    if(_headers != nil) {
        for (NSString* key in _headers)
        {
            [_request setValue:[_headers valueForKey:key] forHTTPHeaderField:key];
            DeveloperLog(@"Header: %@: %@", key, [_headers valueForKey:key]);
        }
    }
    DeveloperLog(@"URL: %@", [self url]);
    [_request setURL: [self url]];
    
    if([self timeout] > 0) {
        [_request setTimeoutInterval:[self timeout]];
    }
    if([self method] != nil) {
        [_request setHTTPMethod: [self method]];
        DeveloperLog(@"Method: %@", [self method]);
    }
    [_request setHTTPShouldHandleCookies:[self sendDefaultCookies]];
    
    /*
     
    // Is this needed? Should the developer do it himself?
     
    if([self requestUsername] != nil && [self requestPassword] != nil) {
        if([_request valueForHTTPHeaderField:@"Authorization"] == nil) {
            
            NSString *basic = [TiHTTPHelper base64encode:
                               [[NSString stringWithFormat:@"%@:%@", [self requestUsername],[self requestPassword]]
                                dataUsingEncoding:NSUTF8StringEncoding
                                ]];
            [_request setValue: [NSString stringWithFormat:@"Basic: %@", basic] forHTTPHeaderField:@"Authorization"];
            DeveloperLog(@"%@", [NSString stringWithFormat:@"Basic: %@", basic] );
        }
    }
    */
    if([self synchronous]) {
        NSURLResponse *response;
        NSError *error = nil;
        NSData *responseData = [NSURLConnection sendSynchronousRequest:_request returningResponse:&response error:&error];
        [_response appenData:responseData];
        [_response setResponse:response];
        [_response setError:error];
        [_response setRequest:_request];
        [_response setReadyState:TiHTTPResponseStateDone];
        [_response setConnected:NO];
    } else {
        [_response setRequest:_request];
        [_response setReadyState:TiHTTPResponseStateOpened];
        if([_delegate respondsToSelector:@selector(tiRequest:onReadyStateChage:)]) {
            [_delegate tiRequest:self onReadyStateChage:_response];
        }
        
        _connection = [[NSURLConnection alloc] initWithRequest: _request
                                                              delegate: self
                                                      startImmediately: NO
                               ];
        if([self theQueue]) {
            RELEASE_TO_NIL(_operation);
            _operation = [[TiHTTPOperation alloc] initWithConnection: _connection];
            [_operation setIndex:[[self theQueue] operationCount]];
            [[self theQueue] addOperation: _operation];
           
        } else {
            [_connection start];
        }
    }
    
}
-(void)setCachePolicy:(NSURLRequestCachePolicy*)cache
{
    [_request setCachePolicy:cache];
}
-(void)addRequestHeader:(NSString *)key value:(NSString *)value
{
    if(_headers == nil) {
        _headers = [[NSMutableDictionary alloc] init];
    }
    [_headers setValue:value forKey:key];
}
- (BOOL)connection:(NSURLConnection *)connection canAuthenticateAgainstProtectionSpace:(NSURLProtectionSpace *)protectionSpace
{
    DeveloperLog(@"%s %@", __PRETTY_FUNCTION__, [protectionSpace authenticationMethod]);
	return
    [[protectionSpace authenticationMethod] isEqualToString:NSURLAuthenticationMethodDefault] ||
    [[protectionSpace authenticationMethod] isEqualToString:NSURLAuthenticationMethodHTTPBasic] ||
    [[protectionSpace authenticationMethod] isEqualToString:NSURLAuthenticationMethodHTTPDigest] ||
    [[protectionSpace authenticationMethod] isEqualToString:NSURLAuthenticationMethodServerTrust] ||
    [[protectionSpace authenticationMethod] isEqualToString:NSURLAuthenticationMethodNTLM];
}


-(void)connection:(NSURLConnection *)connection didReceiveAuthenticationChallenge:(NSURLAuthenticationChallenge *)challenge
{
    DeveloperLog(@"%s", __PRETTY_FUNCTION__);
    if ([challenge previousFailureCount]) {
        [[challenge sender] cancelAuthenticationChallenge:challenge];
    }
    if(![self validatesSecureCertificate]) {
        if (
            [[[challenge protectionSpace] authenticationMethod] isEqualToString:NSURLAuthenticationMethodServerTrust] &&
            [challenge.protectionSpace.host isEqualToString:[[self url] host]]
            ) {
                [[challenge sender] useCredential:
                 [NSURLCredential credentialForTrust: [[challenge protectionSpace] serverTrust]]
                       forAuthenticationChallenge: challenge];
        }
    }
    
    if([self requestPassword] != nil && [self requestUsername] != nil) {
        [[challenge sender] useCredential:
         [NSURLCredential credentialWithUser:[self requestUsername]
                                    password:[self requestPassword]
                                 persistence:NSURLCredentialPersistenceForSession]
               forAuthenticationChallenge:challenge];

    }
    [[challenge sender] continueWithoutCredentialForAuthenticationChallenge:challenge];
}

-(void)connection:(NSURLConnection *)connection didCancelAuthenticationChallenge:(NSURLAuthenticationChallenge *)challenge
{
    DeveloperLog(@"%s", __PRETTY_FUNCTION__);
}


-(NSURLRequest*)connection:(NSURLConnection *)connection willSendRequest:(NSURLRequest *)request redirectResponse:(NSURLResponse *)response
{
    DeveloperLog(@"Code %i Redirecting from: %@ to: %@",[(NSHTTPURLResponse*)response statusCode], [_request URL] ,[request URL]);
    [_response setConnected:YES];
    [_response setResponse: response];
    [_response setRequest:request];

    if([[self delegate] respondsToSelector:@selector(tiRequest:onRedirect:)])
    {
        [[self delegate] tiRequest:self onRedirect:_response];
    }
    if(![self redirects] && [_response status] != 0)
    {
        return nil;
    }
    
    //http://tewha.net/2012/05/handling-302303-redirects/
    if (response) {
        NSMutableURLRequest *r = [[_request mutableCopy] autorelease];
        [r setURL: [request URL]];
        RELEASE_TO_NIL(_request);
        _request = [r retain];
        return r;
    } else {
        return request;
    }
}
- (void)connection:(NSURLConnection *)connection didReceiveResponse:(NSURLResponse *)response
{
    DeveloperLog(@"%s", __PRETTY_FUNCTION__);
    [_response setReadyState:TiHTTPResponseStateHeaders];
    [_response setConnected:YES];
    [_response setResponse: response];
    if([_response status] == 0) {
        [self connection:connection
        didFailWithError:[NSError errorWithDomain: [_response location]
                                             code: [_response status]
                                         userInfo: @{NSLocalizedDescriptionKey: [NSHTTPURLResponse localizedStringForStatusCode:[(NSHTTPURLResponse*)response statusCode]]}
                          ]];
        return;
    }
    _expectedDownloadResponseLength = [response expectedContentLength];
    
    if([_delegate respondsToSelector:@selector(tiRequest:onReadyStateChage:)]) {
        [_delegate tiRequest:self onReadyStateChage:_response];
    }

}

- (void)connection:(NSURLConnection *)connection didReceiveData:(NSData *)data
{
    DeveloperLog(@"2 %s", __PRETTY_FUNCTION__);

    if([_response readyState] != TiHTTPResponseStateLoading) {
        [_response setReadyState:TiHTTPResponseStateLoading];
        if([_delegate respondsToSelector:@selector(tiRequest:onReadyStateChage:)]) {
            [_delegate tiRequest:self onReadyStateChage:_response];
        }
    }
    [_response appenData:data];
    [_response setDownloadProgress: (float)[[_response responseData] length] / (float)_expectedDownloadResponseLength];
    if([_delegate respondsToSelector:@selector(tiRequest:onDataStream:)]) {
        [_delegate tiRequest:self onDataStream:_response];
    }
    
}

-(void)connection:(NSURLConnection *)connection didSendBodyData:(NSInteger)bytesWritten totalBytesWritten:(NSInteger)totalBytesWritten totalBytesExpectedToWrite:(NSInteger)totalBytesExpectedToWrite
{
    if([_response readyState] != TiHTTPResponseStateLoading) {
        [_response setReadyState:TiHTTPResponseStateLoading];
        if([_delegate respondsToSelector:@selector(tiRequest:onReadyStateChage:)]) {
            [_delegate tiRequest:self onReadyStateChage:_response];
        }
    }
    [_response setUploadProgress: (float)totalBytesWritten / (float)totalBytesExpectedToWrite];
    if([_delegate respondsToSelector:@selector(tiRequest:onSendStream:)]) {
        [_delegate tiRequest:self onSendStream:_response];
    }
}

- (void)connectionDidFinishLoading:(NSURLConnection *)connection
{
    if([self operation] != nil) {
        [[self operation] setFinished:YES];
    }
    DeveloperLog(@"3 %s", __PRETTY_FUNCTION__);
    [_response setDownloadProgress:1.f];
    [_response setUploadProgress:1.f];
    [_response setReadyState:TiHTTPResponseStateDone];
    [_response setConnected:NO];
     
    if([_delegate respondsToSelector:@selector(tiRequest:onReadyStateChage:)]) {
        [_delegate tiRequest:self onReadyStateChage:_response];
    }
    if([_delegate respondsToSelector:@selector(tiRequest:onSendStream:)]) {
        [_delegate tiRequest:self onSendStream:_response];
    }
    if([_delegate respondsToSelector:@selector(tiRequest:onDataStream:)]) {
        [_delegate tiRequest:self onDataStream:_response];
    }
    if([_delegate respondsToSelector:@selector(tiRequest:onLoad:)]) {
        [_delegate tiRequest:self onLoad:_response];
    }
    if([self filePath] != nil) {
        NSError *error = nil;
        [[_response responseData] writeToFile:[self filePath] options:NSDataWritingAtomic error:&error];
        if(error != nil) {
            DeveloperLog(@"Could not save to file %@ - Error is %@", [self filePath], [error localizedDescription]);
        }
    }

}

- (void)connection:(NSURLConnection *)connection didFailWithError:(NSError *)error
{
    if([self operation] != nil) {
        [[self operation] setFinished:YES];
    }
    DeveloperLog(@"%s", __PRETTY_FUNCTION__);
    [_response setReadyState:TiHTTPResponseStateDone];
    if([_delegate respondsToSelector:@selector(tiRequest:onReadyStateChage:)]) {
        [_delegate tiRequest:self onReadyStateChage:_response];
    }
    [_response setConnected:NO];
    [_response setError:error];
    if([_delegate respondsToSelector:@selector(tiRequest:onError:)]) {
        [_delegate tiRequest:self onError:_response];
    }
}

@end