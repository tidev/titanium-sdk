/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_NETWORK

#import "NetworkModule.h"

#import <ifaddrs.h>
#import <sys/socket.h>
#import <netinet/in.h>
#import <netinet6/in6.h>
#import <arpa/inet.h>
#import <ifaddrs.h>

#import "TitaniumJSCode.h"
#import "TitaniumBlobWrapper.h"

typedef enum {
	clientStateUnsent = 0,
	clientStateOpened = 1,
	clientStateHeadersReceived = 2,
	clientStateLoading = 3,
	clientStateDone = 4,
} NetHTTPClientState;

NSString * const MultiPartBoundaryString = @"XxX~Titanium~HTTPClient~Boundary~XxX";
const char MultiPartEntryPrelude[] = "--XxX~Titanium~HTTPClient~Boundary~XxX\r\nContent-Disposition: form-data; name=\"";
const char MultiPartKeyValueGlue[] = "\"\r\n\r\n";
const char MultiPartFilenameGlue[] = "\"; filename=\"";
const char MultiPartBlobGlue[] = "\"\r\nContent-Type: %@\r\n\r\n";
const char MultiPartEntryEpilogue[] = "\r\n";
const char MultiPartFormEpilogue[] = "--XxX~Titanium~HTTPClient~Boundary~XxX--\r\n";

void appendDictToData(NSDictionary * keyValueDict, NSMutableData * destData)
{
	for(NSString * keyString in keyValueDict){
		id valueObject = [keyValueDict objectForKey:keyString];
		if ([valueObject isKindOfClass:[NSNull class]]) continue;

		[destData appendBytes:MultiPartEntryPrelude length:sizeof(MultiPartEntryPrelude)-1];
		[destData appendData:[keyString dataUsingEncoding:NSUTF8StringEncoding]];

		NSString *glue = [NSString stringWithCString:MultiPartBlobGlue];

		if([valueObject isKindOfClass:[TitaniumBlobWrapper class]]){
			TitaniumBlobWrapper *w = (TitaniumBlobWrapper*)valueObject;
			[destData appendBytes:MultiPartFilenameGlue length:sizeof(MultiPartFilenameGlue)-1];
			[destData appendData:[[valueObject virtualFileName] dataUsingEncoding:NSUTF8StringEncoding]];
			NSString *ct = [NSString stringWithFormat:glue,[w mimeType]];
			[destData appendData:[ct dataUsingEncoding:NSUTF8StringEncoding]];
			[destData appendData:[valueObject dataBlob]];
		} else if ([valueObject isKindOfClass:[NSString class]]){
			[destData appendBytes:MultiPartKeyValueGlue length:sizeof(MultiPartKeyValueGlue)-1];
			[destData appendData:[valueObject dataUsingEncoding:NSUTF8StringEncoding]];
		} else if ([valueObject respondsToSelector:@selector(stringValue)]){
			[destData appendBytes:MultiPartKeyValueGlue length:sizeof(MultiPartKeyValueGlue)-1];
			[destData appendData:[[valueObject stringValue] dataUsingEncoding:NSUTF8StringEncoding]];
		} else {
			[destData appendBytes:MultiPartKeyValueGlue length:sizeof(MultiPartKeyValueGlue)-1];
			[destData appendData:[[valueObject description] dataUsingEncoding:NSUTF8StringEncoding]];
		}
		
		[destData appendBytes:MultiPartEntryEpilogue length:sizeof(MultiPartEntryEpilogue)-1];
	}
}


@interface NetHTTPClient : TitaniumProxyObject
{
//Connections to the intarwebs
	NSMutableURLRequest * urlRequest;
	NSURLConnection * urlConnection;
	NSURLResponse * urlResponse;
	NSMutableData * loadedData;
	
	
	NetHTTPClientState readyState;
	NSInteger currentStatus;
	BOOL connected;

}

@property(nonatomic,readwrite,retain)	NSMutableURLRequest * urlRequest;
@property(nonatomic,readwrite,retain)	NSURLConnection * urlConnection;
@property(nonatomic,readwrite,retain)	NSURLResponse * urlResponse;
@property(nonatomic,readwrite,retain)	NSMutableData * loadedData;

@property(nonatomic,readwrite,assign)	NetHTTPClientState readyState;
@property(nonatomic,readwrite,assign)	NSInteger currentStatus;
@property(nonatomic,readwrite,assign)	BOOL connected;

- (id) runFunctionNamed: (NSString *) functionName withObject: (id) objectValue error: (NSError **) error;

@end

@implementation NetHTTPClient
@synthesize urlRequest, urlConnection, urlResponse, loadedData;
@synthesize readyState, currentStatus, connected;

- (void) dealloc;
{
	[urlRequest release];
	[urlConnection release];
	[urlResponse release];
	[loadedData release];
	[super dealloc];
}

- (void) setReadyState: (NetHTTPClientState) newState;
{
	if (newState == readyState) return;
	readyState = newState;
	[[TitaniumHost sharedHost] sendJavascript:[javaScriptPath stringByAppendingString:@".onreadystatechange()"] toPageWithToken:parentPageToken];
}

- (void) runSend;
{
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	[self setUrlConnection:[NSURLConnection connectionWithRequest:urlRequest delegate:self]];
	[self setReadyState:clientStateOpened];
	[pool release];
}


- (id) runFunctionNamed: (NSString *) functionName withObject: (id) objectValue error: (NSError **) error;
{
//	NSLog(@"%@ Got function named: %@ with object %@",self,functionName,objectValue);

	if ([functionName isEqualToString:@"open"]){
		NSUInteger arrayCount = [objectValue count];
		//Prepares the URLRequest, but despite the name, it doesn't actually open until send*.
		if (arrayCount < 2) return nil;
		if (connected) return nil;
		
		NSString * destString = [objectValue objectAtIndex:1];
		if (![destString isKindOfClass:[NSString class]])return nil;
		NSURL * destUrl = [NSURL URLWithString:destString];
		
		[self setUrlRequest:[NSMutableURLRequest requestWithURL:destUrl]];
		[urlRequest setHTTPMethod:[objectValue objectAtIndex:0]];
		
		// set the titanium user agent
		NSString *userAgent = [NSString stringWithFormat:@"%@ Titanium/%s",
			[urlRequest valueForHTTPHeaderField:@"User-Agent"],STRING(TI_VERSION)];
		
		[urlRequest setValue:userAgent forHTTPHeaderField:@"User-Agent"];
		
		//TODO: Password, username, synchronous.

	} else if ([functionName isEqualToString:@"abort"]) { //Drops information if running, or 
		[urlConnection cancel];
		[self setConnected:NO];
		[self setReadyState:clientStateDone];
		[[TitaniumHost sharedHost] decrementActivityIndicator];
		//TODO: cleanup

	} else if ([functionName isEqualToString:@"setRequestHeader"]) {
		NSUInteger arrayCount = [objectValue count];
		if (arrayCount < 2) return nil;
		NSString * keyString = [objectValue objectAtIndex:0];
		if (![keyString isKindOfClass:[NSString class]]){
			return nil;
		}
		
		NSString * valueString = [objectValue objectAtIndex:1];
		if (![valueString isKindOfClass:[NSString class]]){
			if([valueString respondsToSelector:@selector(stringValue:)]){
				valueString = [(id)valueString stringValue];
			} else {
				return nil;
			}
		}
		
		[urlRequest setValue:valueString forHTTPHeaderField:keyString];
		//Todo: error handling?

	} else if ([functionName isEqualToString:@"send"]) {
		NSUInteger arrayCount = [objectValue count];
		if (arrayCount > 0) {
			BOOL goPost = NO;
			NSMutableData * resultData = [[NSMutableData alloc] init];
			for(id thisObject in objectValue){
				if ([thisObject isKindOfClass:[NSDictionary class]]){
					goPost=YES;
					appendDictToData(thisObject, resultData);
				} else if([thisObject isKindOfClass:[NSString class]]){
					[resultData appendData:[thisObject dataUsingEncoding:NSUTF8StringEncoding]];
				}
			}
			if (goPost){
				[urlRequest setHTTPMethod:@"POST"];
				NSString *contentType = [@"multipart/form-data; boundary=" stringByAppendingString: MultiPartBoundaryString];
				[urlRequest addValue:contentType forHTTPHeaderField: @"Content-Type"];
				[resultData appendBytes:MultiPartFormEpilogue length:sizeof(MultiPartFormEpilogue)-1];
			}

			[urlRequest setHTTPBody:resultData];
			[resultData release];
		}
		
		[self performSelectorOnMainThread:@selector(runSend) withObject:nil waitUntilDone:NO];
		[[TitaniumHost sharedHost] incrementActivityIndicator];

	} else if ([functionName isEqualToString:@"responseHeader"]) {
		if ([objectValue count]<=0) return nil;

		NSString * keyString = [objectValue objectAtIndex:0];
		if ((![keyString isKindOfClass:[NSString class]]) ||
				(![urlResponse isKindOfClass:[NSHTTPURLResponse class]])) return nil;

		return [[(NSHTTPURLResponse *)urlResponse allHeaderFields] objectForKey:keyString];

	} else if ([functionName isEqualToString:@"responseHeaders"]) {
		if ([urlResponse isKindOfClass:[NSHTTPURLResponse class]]){
			return [(NSHTTPURLResponse *)urlResponse allHeaderFields];
		}

	} else if ([functionName isEqualToString:@"readyState"]) {
		return [NSNumber numberWithInt:readyState];
		
	} else if ([functionName isEqualToString:@"responseText"]) {
		NSString * result = [[NSString alloc] initWithData:loadedData encoding:NSUTF8StringEncoding];
		return [result autorelease];

	} else if ([functionName isEqualToString:@"responseXML"]) {
		
		
	} else if ([functionName isEqualToString:@"status"]) {
		return [NSNumber numberWithInt:currentStatus];

	} else if ([functionName isEqualToString:@"connected"]) {
		return [NSNumber numberWithBool:connected];

	}
	return nil;
}

- (NSURLRequest *)connection:(NSURLConnection *)connection willSendRequest:(NSURLRequest *)request redirectResponse:(NSURLResponse *)response;
{
	[self setConnected:YES];
//	[[TitaniumHost sharedHost] sendJavascript:[javaScriptPath stringByAppendingString:@".onsendstream()"] toPageWithToken:parentPageToken];
	return request;
}

//- (void)connection:(NSURLConnection *)connection didReceiveAuthenticationChallenge:(NSURLAuthenticationChallenge *)challenge;
//- (void)connection:(NSURLConnection *)connection didCancelAuthenticationChallenge:(NSURLAuthenticationChallenge *)challenge;
- (void)connection:(NSURLConnection *)connection didReceiveResponse:(NSURLResponse *)response;
{
	[self setConnected:YES];
	[self setUrlResponse:response];
	if (loadedData == nil) {
		loadedData = [[NSMutableData alloc] init];
	} else {
		[loadedData setLength:0];
	}
	[self setReadyState:clientStateHeadersReceived];
}

- (void)connection:(NSURLConnection *)connection didReceiveData:(NSData *)data;
{
	[loadedData appendData:data];
}

- (void)connectionDidFinishLoading:(NSURLConnection *)connection;
{
	[self setConnected:NO];
	[self setReadyState:clientStateDone];
	[[TitaniumHost sharedHost] sendJavascript:[javaScriptPath stringByAppendingString:@".ondatastream()"] toPageWithToken:parentPageToken];
	[[TitaniumHost sharedHost] decrementActivityIndicator];
}

- (void)connection:(NSURLConnection *)connection didFailWithError:(NSError *)error;
{
	[self setConnected:NO];
	[self setReadyState:clientStateDone];
	[[TitaniumHost sharedHost] decrementActivityIndicator];

}

//- (NSCachedURLResponse *)connection:(NSURLConnection *)connection willCacheResponse:(NSCachedURLResponse *)cachedResponse;

@end



NetworkModuleConnectionState stateForReachabilityFlags(SCNetworkReachabilityFlags flags)
{
	if (!(flags & kSCNetworkReachabilityFlagsReachable)) return NetworkModuleConnectionStateNone;
	if (!(flags & kSCNetworkReachabilityFlagsConnectionRequired)) return NetworkModuleConnectionStateWifi;
	if (flags & kSCNetworkReachabilityFlagsIsWWAN) return NetworkModuleConnectionStateMobile;
	return NetworkModuleConnectionStateNone;
}


@implementation NetworkModule

- (TitaniumJSCode *) createHTTPClient;
{
	NSString * clientToken = [NSString stringWithFormat:@"client%X",nextToken];
	nextToken ++;
	NSString * tiObjectPath = [@"Network._CONN." stringByAppendingString:clientToken];
	NSString * jsPath = [@"Titanium." stringByAppendingString:tiObjectPath];
	
	//FIXME - set the user agent header

	NetHTTPClient * nativeClient = [[NetHTTPClient alloc] init];
	[nativeClient setToken:clientToken];
	[nativeClient setJavaScriptPath:jsPath];

	NSString * generatorCode = [NSString stringWithFormat:netHTTPClientGeneratorFormat,
			tiObjectPath,tiObjectPath,tiObjectPath,tiObjectPath,tiObjectPath,tiObjectPath,
			tiObjectPath,tiObjectPath,tiObjectPath,tiObjectPath,tiObjectPath,tiObjectPath,
			tiObjectPath,tiObjectPath,tiObjectPath,tiObjectPath,tiObjectPath,tiObjectPath];

	if ([pendingConnnections count] == 0) {
		generatorCode = [@"delete Titanium.Network._CONN;Titanium.Network._CONN={};" stringByAppendingString:generatorCode];
	}
	[pendingConnnections setObject:nativeClient forKey:clientToken];
	[nativeClient release];

	TitaniumJSCode * result = [TitaniumJSCode codeWithString:jsPath];
	[result setPreludeCode:generatorCode];
	return result;
}

- (SCNetworkReachabilityRef) defaultRouteReachability;
{
    if (defaultRouteReachability == NULL) {
		
        struct sockaddr_in zeroAddress;
        bzero(&zeroAddress, sizeof(zeroAddress));
        zeroAddress.sin_len = sizeof(zeroAddress);
        zeroAddress.sin_family = AF_INET;
        
        defaultRouteReachability = SCNetworkReachabilityCreateWithAddress(NULL, (struct sockaddr *)&zeroAddress);
    }
	return defaultRouteReachability;
}

- (NSNumber *) online;
{
	SCNetworkReachabilityFlags flags;
	BOOL gotFlags = SCNetworkReachabilityGetFlags([self defaultRouteReachability], &flags);
	BOOL result;

	if (!gotFlags) {	//Didn't even check?
		result = NO;
	} else {
		result = stateForReachabilityFlags(flags) != NetworkModuleConnectionStateNone;
	}
	return [NSNumber numberWithBool:result];
}

- (void) handleNetworkChange:(SCNetworkReachabilityRef) target flags: (SCNetworkReachabilityFlags) flags;
{
	TitaniumHost * theTH = [TitaniumHost sharedHost];
	NetworkModuleConnectionState connectionState = stateForReachabilityFlags(flags);
	
	for(NSString * tokenString in connectivityListeners){
		NSString * parentPageToken = [connectivityListeners objectForKey:tokenString];
		NSString * commandString = [NSString stringWithFormat:@"Ti.Network._LISTEN.%@(%d)",tokenString,connectionState];
		[theTH sendJavascript:commandString toPageWithToken:parentPageToken];
	}
}

static void ReachabilityCallback(SCNetworkReachabilityRef target, SCNetworkReachabilityFlags flags, void *context)
{
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	NetworkModule * selfModule = (NetworkModule *)context;
    [selfModule handleNetworkChange:target flags:flags];
	[pool release];
}

- (void) startListening;
{
	if(isListening) return;
	
	SCNetworkReachabilityRef ourReachability = [self defaultRouteReachability];
	SCNetworkReachabilityContext contextPackage = {0, self, NULL, NULL, NULL};
	SCNetworkReachabilitySetCallback(ourReachability, ReachabilityCallback, &contextPackage);
	SCNetworkReachabilityScheduleWithRunLoop(ourReachability, CFRunLoopGetMain(), kCFRunLoopDefaultMode);
	isListening = YES;
}

- (void) stopListening;
{
	if(!isListening) return;
	SCNetworkReachabilityUnscheduleFromRunLoop(defaultRouteReachability, CFRunLoopGetMain(), kCFRunLoopDefaultMode);	
	isListening = NO;
}

- (NSNumber *) networkType;
{
	SCNetworkReachabilityFlags flags;
	BOOL gotFlags = SCNetworkReachabilityGetFlags([self defaultRouteReachability], &flags);
	NetworkModuleConnectionState result;
	
	if (!gotFlags) {	//Didn't even check?
		result = NetworkModuleConnectionStateNone;
	} else {
		result = stateForReachabilityFlags(flags);
	}
	return [NSNumber numberWithInt:result];
}

- (NSString *) networkTypeName;
{
	switch ([[self networkType] intValue]) {
		case NetworkModuleConnectionStateNone:
			return @"NONE";
		case NetworkModuleConnectionStateWifi:
			return @"WIFI";
		case NetworkModuleConnectionStateMobile:
			return @"MOBILE";
		case NetworkModuleConnectionStateLan:
			return @"LAN";
	}
	return @"UNKNOWN";
}

- (NSString *) genConnectivityListenerToken;
{
	NSString * newToken = [NSString stringWithFormat:@"CON%d",nextConnectivityListenerToken++];
	NSString * parentPageToken = [[[TitaniumHost sharedHost] currentThread] magicToken];
	[connectivityListeners setObject:parentPageToken forKey:newToken];
	if (!isListening) [self startListening];
	
	return newToken;
}

- (void) removeConnectivityListenerToken: (NSString *) doomedToken;
{
	if (![doomedToken isKindOfClass:[NSString class]]){
		return;
	}
	[connectivityListeners removeObjectForKey:doomedToken];
	if ([connectivityListeners count] == 0) [self stopListening];
}

- (BOOL) startModule;
{
	TitaniumAccessorTuple * onlineAcessor = [TitaniumAccessorTuple tupleForObject:self Key:@"online"];
	[onlineAcessor setSetterSelector:NULL];

	TitaniumAccessorTuple * networkTypeAcessor = [TitaniumAccessorTuple tupleForObject:self Key:@"networkType"];
	[networkTypeAcessor setSetterSelector:NULL];

	TitaniumAccessorTuple * networkTypeNameAcessor = [TitaniumAccessorTuple tupleForObject:self Key:@"networkTypeName"];
	[networkTypeNameAcessor setSetterSelector:NULL];
	
	TitaniumInvocationGenerator * ourInvocGen = [TitaniumInvocationGenerator generatorWithTarget:self];

	[(NetworkModule *)ourInvocGen createHTTPClient];
	NSInvocation * createHTTPClientInvoc = [ourInvocGen invocation];

	[(NetworkModule *)ourInvocGen genConnectivityListenerToken];
	NSInvocation * newListenerInvoc = [ourInvocGen invocation];

	[(NetworkModule *)ourInvocGen removeConnectivityListenerToken:nil];
	NSInvocation * removeListenerInvoc = [ourInvocGen invocation];
	
	
	if (pendingConnnections == nil) {
		pendingConnnections = [[NSMutableDictionary alloc] init];
	}
	
	if (connectivityListeners == nil) {
		connectivityListeners = [[NSMutableDictionary alloc] init];
	}
	
	NSString * addListenerString = @"function(newFun){if(newFun){var result=Ti.Network._ADDL();Ti.Network._LISTEN[result]=newFun;return result;}}";
	NSString * removeListenerString = @"function(tok){if(tok){delete Ti.Network._LISTEN[tok];Ti.Network._REML(tok);}}";
	
	// FIXME: map Titanium.Network.addConnectivityListener and removeConnectivityListener
	// should also map to Titanium.Network.addEventListener('connectivity')
	// (we can deprecate the other but leave it in place until GA)
	
	NSDictionary * moduleDict = [NSDictionary dictionaryWithObjectsAndKeys:
								 onlineAcessor, @"online",
								 networkTypeAcessor, @"networkType",
								 networkTypeNameAcessor, @"networkTypeName",
								 
								 createHTTPClientInvoc, @"createHTTPClient",
								 
								 pendingConnnections, @"_CONN",
								 connectivityListeners, @"_LISTEN",
								 newListenerInvoc,@"_ADDL",
								 removeListenerInvoc,@"_REML",
								 
								 [TitaniumJSCode codeWithString:@"window.encodeURIComponent"],@"encodeURIComponent",
								 [TitaniumJSCode codeWithString:@"window.decodeURIComponent"],@"decodeURIComponent",
								 
								 [TitaniumJSCode codeWithString:addListenerString],@"addConnectivityListener",
								 [TitaniumJSCode codeWithString:removeListenerString],@"removeConnectivityListner",
								 
								 [NSNumber numberWithInt:NetworkModuleConnectionStateNone],@"NETWORK_NONE",
								 [NSNumber numberWithInt:NetworkModuleConnectionStateWifi],@"NETWORK_WIFI",
								 [NSNumber numberWithInt:NetworkModuleConnectionStateMobile],@"NETWORK_MOBILE",
								 [NSNumber numberWithInt:NetworkModuleConnectionStateLan],@"NETWORK_LAN",
								 [NSNumber numberWithInt:NetworkModuleConnectionStateUnknown],@"NETWORK_UNKNOWN",
								 
								 
								 
								 nil];
	
	NSMutableDictionary * titaniumObject = [[TitaniumHost sharedHost] titaniumObject];
	
	[titaniumObject setObject:moduleDict forKey:@"Network"];
	[titaniumObject setObject:[TitaniumJSCode codeWithString:@"Ti.Network"] forKey:@"Net"];
	
	return YES;	
}

- (void) dealloc
{
	[pendingConnnections release];
	[connectivityListeners release];
	[super dealloc];
}


@end

#endif