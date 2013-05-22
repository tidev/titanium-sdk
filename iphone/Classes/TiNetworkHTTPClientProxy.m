/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

// TODO: Here's a big one... we need to conform to the SHOULD, MUST, SHOULD NOT, MUST NOT in XHR standard.  See http://www.w3.org/TR/XMLHttpRequest/
#ifdef USE_TI_NETWORK

#import "TiBase.h"
#import "TiNetworkHTTPClientProxy.h"
#import "TiNetworkHTTPClientResultProxy.h"
#import "TiUtils.h"
#import "TiApp.h"
#import "TiDOMDocumentProxy.h"
#import "Mimetypes.h"
#import "TiFile.h"
#import "ASIDownloadCache.h"

extern NSString * const TI_APPLICATION_GUID;

int CaselessCompare(const char * firstString, const char * secondString, int size)
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
if((remainingSize > nameSize) && (0==CaselessCompare(data, encodingName, nameSize))) {*value = returnValue; return YES;}

BOOL ExtractEncodingFromData(NSData * inputData, NSStringEncoding* result)
{
	int remainingSize = [inputData length];
	int unsearchableSize;
	if(remainingSize > 2008) unsearchableSize = remainingSize - 2000;
	else unsearchableSize = 8; // So that there's no chance of overrunning the buffer with 'charset='
	const char * data = [inputData bytes];
	
	// XML provides its own encoding format as part of the definition,
	// we need to use this if it looks like a XML document
	int prefix = CaselessCompare(data,"<?xml",5);
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
		int compareOffset = CaselessCompare(data, "charset=", 8);
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

extern NSString * const TI_APPLICATION_DEPLOYTYPE;

@implementation TiNetworkHTTPClientProxy

@synthesize timeout, validatesSecureCertificate, autoRedirect;

-(id)init
{
	if (self = [super init])
	{
		readyState = NetworkClientStateUnsent;
		autoRedirect = [[NSNumber alloc] initWithBool:YES];
#if defined(DEBUG) || defined(DEVELOPER)
			validatesSecureCertificate = [[NSNumber alloc] initWithBool:NO];
#else
			validatesSecureCertificate = [[NSNumber alloc] initWithBool:YES];
#endif
	}
	return self;
}

-(void)_configure
{
    [self initializeProperty:@"cache" defaultValue:NUMBOOL(NO)];
}

-(void)setOnload:(KrollCallback *)callback
{
	hasOnload = [callback isKindOfClass:[KrollCallback class]];
	[self setValue:callback forUndefinedKey:@"onload"];
}

-(void)setOnerror:(KrollCallback *)callback
{
	hasOnerror = [callback isKindOfClass:[KrollCallback class]];
	[self setValue:callback forUndefinedKey:@"onerror"];
}

-(void)setOnreadystatechange:(KrollCallback *)callback
{
	hasOnreadystatechange = [callback isKindOfClass:[KrollCallback class]];
	[self setValue:callback forUndefinedKey:@"onreadystatechange"];
}

-(void)setOndatastream:(KrollCallback *)callback
{
	hasOndatastream = [callback isKindOfClass:[KrollCallback class]];
	[self setValue:callback forUndefinedKey:@"ondatastream"];
}

-(void)setOnsendstream:(KrollCallback *)callback
{
	hasOnsendstream = [callback isKindOfClass:[KrollCallback class]];
	[self setValue:callback forUndefinedKey:@"onsendstream"];
}

-(void)_destroy
{
	if (request!=nil && connected)
	{
		[request clearDelegatesAndCancel];
	}
	RELEASE_TO_NIL(url);
	RELEASE_TO_NIL(request);
	RELEASE_TO_NIL(autoRedirect);
    RELEASE_TO_NIL(timeout);
    RELEASE_TO_NIL(validatesSecureCertificate);
	[super _destroy];
}


-(id)description
{
	return @"[object TiNetworkClient]";
}

-(NSInteger)status
{
	if (request!=nil)
	{
		return [request responseStatusCode];
	}
	return -1;
}

-(NSString *)statusText
{
	//In the event request is nil, we get nil back anyways.
	return [request responseStatusMessage];
}

-(NSInteger)readyState
{
	return readyState;
}

-(BOOL)connected
{
	return connected;
}

-(NSString*)responseText
{
	if (request!=nil)
	{
		NSData *data = [request responseData];
		if (data==nil || [data length]==0) 
		{
			return (id)[NSNull null];
		}
		[[data retain] autorelease];
		NSString * result = [[[NSString alloc] initWithBytes:[data bytes] length:[data length] encoding:[request responseEncoding]] autorelease];
		if (result==nil)
		{
			// encoding failed, probably a bad webserver or content we have to deal
			// with in a _special_ way
            NSStringEncoding encoding = NSUTF8StringEncoding;
            BOOL didExtractEncoding = ExtractEncodingFromData(data, &encoding);
            if (didExtractEncoding) {
                //If I did extract encoding use that
                result = [[[NSString alloc] initWithBytes:[data bytes] length:[data length] encoding:encoding] autorelease];
            }
            else {
                //If the encoding was not extracted correctly, try UTF 8. If it fails try ISO-8859-1 (HTTP.DEFAULT_CONTENT_CHARSET)
                result = [[[NSString alloc] initWithBytes:[data bytes] length:[data length] encoding:NSUTF8StringEncoding] autorelease];
                if (result == nil) {
                    result = [[[NSString alloc] initWithBytes:[data bytes] length:[data length] encoding:NSISOLatin1StringEncoding] autorelease];
                }
            }
			
		}
		if (result!=nil)
		{
			return result;
		}
	}
	return (id)[NSNull null];
}

-(TiProxy*)responseXML
{
	NSString *responseText = [self responseText];
	if (responseText != nil && (![responseText isEqual:(id)[NSNull null]]))
	{
		TiDOMDocumentProxy *dom = [[[TiDOMDocumentProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
		[dom parseString:responseText];
		return dom;
	}
	return (id)[NSNull null];
}

-(TiBlob*)responseData
{
	if (request!=nil && [request error]==nil)
	{
		NSString *contentType = [[request responseHeaders] objectForKey:@"Content-Type"];
		return [[[TiBlob alloc] initWithData:[request responseData] mimetype:contentType] autorelease];
	}
	return (id)[NSNull null];
}

-(NSString*)connectionType
{
	//get or post
	return [request requestMethod];
}

-(NSString*)location
{
	return [[request url] absoluteString];
}

-(NSInteger)UNSENT
{
	return NetworkClientStateUnsent;
}

-(NSInteger)OPENED
{
	return NetworkClientStateOpened;
}

-(NSInteger)HEADERS_RECEIVED
{
	return NetworkClientStateHeaders;
}

-(NSInteger)LOADING
{
	return NetworkClientStateLoading;
}

-(NSInteger)DONE
{
	return NetworkClientStateDone;
}

-(void)_fireReadyStateChange:(NetworkClientState)state failed:(BOOL)failed
{
	readyState = state;
	TiNetworkHTTPClientResultProxy *thisPointer; 
	if (hasOnreadystatechange)
	{
		thisPointer = [[[TiNetworkHTTPClientResultProxy alloc] initWithDelegate:self] autorelease];
		[self fireCallback:@"onreadystatechange" withArg:[NSDictionary dictionaryWithObject:@"readystatechange" forKey:@"type"] withSource:thisPointer];
	}
	if (state==NetworkClientStateDone && !failed)
	{
		thisPointer = [[[TiNetworkHTTPClientResultProxy alloc] initWithDelegate:self] autorelease];		
		if (hasOndatastream && downloadProgress>0)
		{
			CGFloat progress = (CGFloat)((CGFloat)downloadProgress/(CGFloat)downloadLength);
			if (progress < 1.0)
			{
				// seems to be a problem in ASI where we'll get .999999 but never 1.0
				// so we need to synthesize this
				progress = 1.0;
				TiNetworkHTTPClientResultProxy *thisPointer = [[TiNetworkHTTPClientResultProxy alloc] initWithDelegate:self];
				NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:[NSNumber numberWithFloat:progress],@"progress",@"datastream",@"type",nil];
				[self fireCallback:@"ondatastream" withArg:event withSource:thisPointer];
				[thisPointer release];
			}
		}
		else if (hasOnsendstream && uploadProgress>0)
		{
			CGFloat progress = (CGFloat)((CGFloat)uploadProgress/(CGFloat)uploadLength);
			if (progress < 1.0)
			{
				// seems to be a problem in ASI where we'll get .999999 but never 1.0
				// so we need to synthesize this
				progress = 1.0;
				TiNetworkHTTPClientResultProxy *thisPointer = [[TiNetworkHTTPClientResultProxy alloc] initWithDelegate:self];
				NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:[NSNumber numberWithFloat:progress],@"progress",@"sendstream",@"type",nil];
				[self fireCallback:@"onsendstream" withArg:event withSource:thisPointer];
				[thisPointer release];
			}
		}
		
		/**
		 *	Per customer request, successful communications that resulted in an
		 *	4xx or 5xx response is treated as an error instead of an onload.
		 *	For backwards compatibility, if no error handler is provided, even
		 *	an 4xx or 5xx response will fall back onto an onload.
		 */
		int responseCode = [request responseStatusCode];
		if (hasOnerror && (responseCode >= 400) && (responseCode <= 599))
		{
			NSMutableDictionary * event = [TiUtils dictionaryWithCode:responseCode message:@"HTTP error"];
			[event setObject:@"error" forKey:@"type"];
			[self fireCallback:@"onerror" withArg:event withSource:thisPointer];
		}
		else if(hasOnload)
		{
			NSMutableDictionary * event = [TiUtils dictionaryWithCode:0 message:nil];
			[event setObject:@"load" forKey:@"type"];
			[self fireCallback:@"onload" withArg:event withSource:thisPointer];
		}		
	}
}

-(void)abort:(id)args
{
	if (request!=nil && connected)
	{
		connected = NO;
		[[TiApp app] stopNetwork];
		[request clearDelegatesAndCancel];
		[self forgetSelf];
	}
}

-(void)open:(id)args
{
	RELEASE_TO_NIL(request);
	
	NSString *method = [TiUtils stringValue:[args objectAtIndex:0]];
	[url release];
	url = [[TiUtils toURL:[args objectAtIndex:1] proxy:self] retain];
	
	if ([args count]>2)
	{
		async = [TiUtils boolValue:[args objectAtIndex:2]];
	}
	else 
	{
		async = YES;
	}
	
	request = [[ASIFormDataRequest requestWithURL:url] retain];	
    if ([TiUtils boolValue:[self valueForUndefinedKey:@"cache"] def:NO]) {
        [request setDownloadCache:[ASIDownloadCache sharedCache]];
    }
    else {
        [request setDownloadCache:nil];
    }
	[request setDelegate:self];
    if (timeout) {
        NSTimeInterval timeoutVal = [timeout doubleValue] / 1000;
        [request setTimeOutSeconds:timeoutVal];
    }
	
	if (hasOnsendstream)
	{
		[request setUploadProgressDelegate:self];
	}
	if (hasOndatastream)
	{
		[request setDownloadProgressDelegate:self];
	}
	
	[request addRequestHeader:@"User-Agent" value:[[TiApp app] userAgent]];
	
    [request addRequestHeader:[NSString stringWithFormat:@"%s-%s%s-%s", "X","Tita","nium","Id"] value:TI_APPLICATION_GUID];
    
	// twitter specifically disallows X-Requested-With so we only add this normal
	// XHR header if not going to twitter. however, other services generally expect
	// this header to indicate an XHR request (such as RoR)
	if ([[url host] rangeOfString:@"twitter.com"].location==NSNotFound)
	{
		[request addRequestHeader:@"X-Requested-With" value:@"XMLHttpRequest"];
	}
	[request setRequestMethod:method];
	[request setDefaultResponseEncoding:NSUTF8StringEncoding];
	// don't cache credentials, session etc since each request might be to
	// different URI and cause security compromises if we do 
	[request setUseSessionPersistence:NO];
	[request setUseKeychainPersistence:NO];
	[request setUseCookiePersistence:YES];
	[request setShowAccurateProgress:YES];
	[request setShouldUseRFC2616RedirectBehaviour:YES];
	BOOL keepAlive = [TiUtils boolValue:[self valueForKey:@"enableKeepAlive"] def:NO];
	[request setShouldAttemptPersistentConnection:keepAlive];
	//handled in send, as now optional
	//[request setShouldRedirect:YES];
    
    //TIMOB-11728. Expose setClientCertificates and setClientCertificateIdentity for HTTPClient
    id clientCerts = [self valueForKey:@"clientCertificates"];
    ENSURE_TYPE_OR_NIL(clientCerts, NSArray);
    if (clientCerts != nil) {
        [request setClientCertificates:clientCerts];
    }
    id certIdentity = [self valueForKey:@"clientCertificateIdentity"];
    ENSURE_SINGLE_ARG_OR_NIL(certIdentity,NSObject);
    if (certIdentity != nil) {
        if ([certIdentity isKindOfClass:[NSArray class]]) {
            [request setClientCertificateIdentity:(SecIdentityRef)[certIdentity objectAtIndex:0]];
        }
        else {
            [request setClientCertificateIdentity:(SecIdentityRef)certIdentity];
        }
    }
	//TIMOB-5435 NTLM support
	[request setUsername:[TiUtils stringValue:[self valueForKey:@"username"]]];
	[request setPassword:[TiUtils stringValue:[self valueForKey:@"password"]]];
	[request setDomain:[TiUtils stringValue:[self valueForKey:@"domain"]]];
    
	[self _fireReadyStateChange:NetworkClientStateOpened failed:NO];
	[self _fireReadyStateChange:NetworkClientStateHeaders failed:NO];
}
-(void)clearCookies:(id)args
{
    ENSURE_ARG_COUNT(args,1);

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
-(void)setRequestHeader:(id)args
{
	ENSURE_ARG_COUNT(args,2);
	
	NSString *key = [TiUtils stringValue:[args objectAtIndex:0]];
	NSString *value = [TiUtils stringValue:[args objectAtIndex:1]];
	
	// allow setting of cookies - even though the XHR spec specifically
	// disallows this from a security standpoint, we're going to allow
	// it since we assume that the app is "trusted" (thus, cross domain ,etc)
	if ([key isEqualToString:@"Cookie"])
	{
		NSMutableArray* cookies = [request requestCookies];
		if (value == nil) {
			[cookies removeAllObjects];
			return;
		}
		
		NSArray *tok = [value componentsSeparatedByString:@"="];
		if ([tok count]!=2)
		{
			[self throwException:@"invalid arguments for setting cookie. value should be in the format 'name=value'" subreason:nil location:CODELOCATION];
		}
		NSString* name = [tok objectAtIndex:0];
		id cookieValue = [tok objectAtIndex:1];
		
		for (NSHTTPCookie* cookie in cookies) {
			if ([name isEqualToString:[cookie name]])
			{
				[cookies removeObject:cookie];
				break;
			}
		}
		
		NSHTTPCookie *cookie = [NSHTTPCookie cookieWithProperties:[NSDictionary dictionaryWithObjectsAndKeys:name,NSHTTPCookieName,cookieValue,NSHTTPCookieValue,@"/",NSHTTPCookiePath,[url host],NSHTTPCookieDomain,url,NSHTTPCookieOriginURL,nil]];
		[cookies addObject:cookie];
	}
	else 
	{
		[request addRequestHeader:key value:value];
	}
}

-(void)send:(id)args
{
	[self rememberSelf];
	// HACK: We are never actually in the "OPENED" state.  Needs to be fixed with XHR refactor.
	if (readyState != NetworkClientStateHeaders && readyState != NetworkClientStateOpened) {
		// TODO: Throw an exception here as per XHR standard
		DebugLog(@"[ERROR] Must set a connection to OPENED before send()");
		return;
	}
	
	// args are optional
	if (args!=nil)
	{
		for (id arg in args)
		{
			if ([arg isKindOfClass:[NSString class]])
			{
				//body of request
				[request appendPostData:[arg dataUsingEncoding:NSUTF8StringEncoding]];
			}
			else if ([arg isKindOfClass:[NSDictionary class]])
			{
				for (id key in arg)
				{
					id value = [arg objectForKey:key];
					if ([value isKindOfClass:[TiBlob class]])
					{
						TiBlob *blob = (TiBlob*)value;
						if ([blob type] == TiBlobTypeFile)
						{
							// could be large if file so let's tell the 
							// ASI request dude to stream the content
							NSString *filename = [[blob path] lastPathComponent];
							[request setFile:[blob path] withFileName:filename andContentType:[blob mimeType] forKey:key];
						}
						else
						{
							NSData *data = [blob data];
							// give it a generated file name for the attachment so you can look at the extension at least to 
							// attempt to figure out what it is (as well as mime)
							NSString *filename = [NSString stringWithFormat:@"%x.%@",data,[Mimetypes extensionForMimeType:[blob mimeType]]];
							[request setData:data withFileName:filename andContentType:[blob mimeType] forKey:key];
						}
					}
					else
					{
						value = [TiUtils stringValue:value];
						[request setPostValue:(NSString*)value forKey:(NSString*)key];
					}
				}
			}
			else if ([arg isKindOfClass:[TiBlob class]]
					 || [arg isKindOfClass:[TiFile class]])
			{
				TiBlob *blob = [arg isKindOfClass:[TiBlob class]] ? (TiBlob *)arg : [(TiFile *)arg blob];
				if ([blob type] == TiBlobTypeFile)
				{
					// could be large if file so let's tell the 
					// ASI request dude to stream the content
					[request appendPostDataFromFile:[blob path]];
				}
				else
				{
					NSData *data = [blob data];
					[request appendPostData:data];
				}
			}
		}
	}
	
	connected = YES;
	downloadProgress = 0;
	uploadProgress = 0;
	[[TiApp app] startNetwork];
	[self _fireReadyStateChange:NetworkClientStateLoading failed:NO];
	[request setAllowCompressedResponse:YES];
	
	// should it automatically redirect
	[request setShouldRedirect:[autoRedirect boolValue]];
	
	// allow self-signed certs (NO) or required valid SSL (YES)    
	[request setValidatesSecureCertificate:[validatesSecureCertificate boolValue]];
    
    // set the TLS version if needed
    [request setTlsVersion:[TiUtils intValue:[self valueForUndefinedKey:@"tlsVersion"]]];
	
	if (async)
	{
		[NSThread detachNewThreadSelector:@selector(startAsynchronous) toTarget:request withObject:nil];
	}
	else
	{
		[[TiApp app] startNetwork];
		[request startSynchronous];
		[[TiApp app] stopNetwork];
	}
}

// Checked with Apache project to see if this is a known bug for them; it's
// not, so this must be a client-side issue with Apple.
//
// Turns out Apple has a bug where they seem to case-correct headers;
// this turns WWW-Authenticate into Www-Authenticate. We don't have complete
// information on how response headers are mangled, but assume that
// they are all case-corrected like this.
//
// This occurs in iOS 4 only.

-(id)getResponseHeader:(id)args
{
    ENSURE_SINGLE_ARG(args, NSString);
    
	if (request!=nil)
	{
        return [TiUtils getResponseHeader:args fromHeaders:[request responseHeaders]];
	}
	return nil;
}

-(NSString*)file
{
	return [request downloadDestinationPath];
}

-(void)setFile:(id)file
{
	if ([file isKindOfClass:[NSString class]]) {
		[request setDownloadDestinationPath:file];
	}
	else if ([file isKindOfClass:[TiFile class]]) {
		[request setDownloadDestinationPath:[file path]];
	}
	else {
		[self throwException:[NSString stringWithFormat:@"Invalid class %@ for file: Expected string or file",[file class]]
				   subreason:nil
					location:CODELOCATION];
	}
}

-(NSDictionary*)responseHeaders
{
	return [request responseHeaders];
}

#pragma mark Delegates

-(void)requestFinished:(ASIHTTPRequest *)request_
{
	[self _fireReadyStateChange:NetworkClientStateDone failed:NO];
	connected = NO;
	[self forgetSelf];
	[[TiApp app] stopNetwork];
}

-(void)requestFailed:(ASIHTTPRequest *)request_
{
	[[TiApp app] stopNetwork];
	connected=NO;
	
	NSError *error = [request error];
	
	// TODO: Conform to XHR 'DONE' on error
	[self _fireReadyStateChange:NetworkClientStateDone failed:YES];
	
	if (hasOnerror)
	{
		TiNetworkHTTPClientResultProxy *thisPointer = [[[TiNetworkHTTPClientResultProxy alloc] initWithDelegate:self] autorelease];
		NSMutableDictionary * event = [TiUtils dictionaryWithCode:[error code] message:[TiUtils messageFromError:error]];
		[event setObject:@"error" forKey:@"type"];
		[self fireCallback:@"onerror" withArg:event withSource:thisPointer];
	}
	[self forgetSelf];
}

// Called when the request receives some data - bytes is the length of that data
- (void)request:(ASIHTTPRequest *)request didReceiveBytes:(long long)bytes
{
	downloadProgress += bytes;
	if (hasOndatastream)
	{
		CGFloat progress = (CGFloat)((CGFloat)downloadProgress/(CGFloat)downloadLength);
		progress = progress == INFINITY ? 1.0 : progress;
		TiNetworkHTTPClientResultProxy *thisPointer = [[TiNetworkHTTPClientResultProxy alloc] initWithDelegate:self];
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:[NSNumber numberWithFloat:progress],@"progress",@"datastream",@"type",nil];
		[self fireCallback:@"ondatastream" withArg:event withSource:thisPointer];
		[thisPointer release];
	}
}

// Called when the request sends some data
// The first 32KB (128KB on older platforms) of data sent is not included in this amount because of limitations with the CFNetwork API
// bytes may be less than zero if a request needs to remove upload progress (probably because the request needs to run again)
- (void)request:(ASIHTTPRequest *)request didSendBytes:(long long)bytes
{
	uploadProgress += bytes;
	if (hasOnsendstream)
	{
		CGFloat progress = (CGFloat)((CGFloat)uploadProgress/(CGFloat)uploadLength);
		TiNetworkHTTPClientResultProxy *thisPointer = [[TiNetworkHTTPClientResultProxy alloc] initWithDelegate:self];
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:[NSNumber numberWithFloat:progress],@"progress",@"sendstream",@"type",nil];
		[self fireCallback:@"onsendstream" withArg:event withSource:thisPointer];
		[thisPointer release];
	}
}

// Called when a request needs to change the length of the content to download
- (void)request:(ASIHTTPRequest *)request incrementDownloadSizeBy:(long long)newLength
{
	if (newLength>0)
	{
		downloadLength = newLength;
	}
}

// Called when a request needs to change the length of the content to upload
// newLength may be less than zero when a request needs to remove the size of the internal buffer from progress tracking
- (void)request:(ASIHTTPRequest *)request incrementUploadSizeBy:(long long)newLength
{
	if (newLength>0)
	{
		uploadLength = newLength;
	}
}

@end

#endif
