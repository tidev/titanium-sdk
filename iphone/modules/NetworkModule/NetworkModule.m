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
#import "AnalyticsModule.h"

#import "Logging.h"

typedef enum {
	clientStateUnsent = 0,
	clientStateOpened = 1,
	clientStateHeadersReceived = 2,
	clientStateLoading = 3,
	clientStateDone = 4,
} NetHTTPClientState;

NSString * const netHTTPClientGeneratorFormat = @"Ti.%@ = {"
"abort:function(){return Ti._TICMD('%@','abort',arguments);},"
"open:function(){return Ti._TICMD('%@','open',arguments);},"
"setRequestHeader:function(){return Ti._TICMD('%@','setRequestHeader',arguments);},"
"send:function(){return Ti._TICMD('%@','send',arguments);},"
"getResponseHeader:function(){return Ti._TICMD('%@','responseHeader',arguments);},"
"getAllResponseHeaders:function(){return Ti._TICMD('%@','responseHeaders',arguments);},"
"UNSENT:0,OPENED:1,HEADERS_RECEIVED:2,LOADING:3,DONE:4,"
"setOnReadyStateChange:function(newFun){this.onreadystatechange=newFun;},"
"onreadystatechange:null,ondatastream:null,onsendstream:null,onload:null,readyState:-1,"
"_changestate:function(newstate){this.readyState = newstate;"
" if(this.onreadystatechange){"
"  this.onreadystatechange();"
" }"
" if(this.onload && newstate==4){"
"  this.onload();"
" }"
"}"
"};"
"Ti.%@.__defineGetter__('responseText',function(){return Ti._TICMD('%@','responseText',[])});"
"Ti.%@.__defineGetter__('responseData',function(){return Ti._TICMD('%@','responseData',[])});"
"Ti.%@.__defineGetter__('responseXML',function(){var xml = Ti._TICMD('%@','responseText',[]); return new DOMParser().parseFromString(xml,'text/xml'); });"
"Ti.%@.__defineGetter__('status',function(){return Ti._TICMD('%@','status',[])});"
"Ti.%@.__defineGetter__('connected',function(){return Ti._TICMD('%@','connected',[])});";

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

		NSString *glue = [NSString stringWithCString:MultiPartBlobGlue encoding:NSUTF8StringEncoding];

		if([valueObject isKindOfClass:[TitaniumBlobWrapper class]]){
			TitaniumBlobWrapper *w = (TitaniumBlobWrapper*)valueObject;
			[destData appendBytes:MultiPartFilenameGlue length:sizeof(MultiPartFilenameGlue)-1];
			[destData appendData:[[valueObject virtualFileName] dataUsingEncoding:NSUTF8StringEncoding]];
			NSString *ct = [NSString stringWithFormat:glue,[w mimeType]];
			[destData appendData:[ct dataUsingEncoding:NSUTF8StringEncoding]];
			[destData appendData:[valueObject dataBlob]];
		} else if ([valueObject isKindOfClass:[NSString class]]){
			[destData appendBytes:MultiPartKeyValueGlue length:sizeof(MultiPartKeyValueGlue)-1];
			[destData appendData:[valueObject dataUsingEncoding:[valueObject fastestEncoding]]];
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

int CaselessCompare(const char * firstString, const char * secondString, int size){
	int index = 0;
	while(index < size){
		char firstChar = tolower(firstString[index]);
		char secondChar = secondString[index]; //Second string is always lowercase.
		index++;
		if(firstChar!=secondChar)return index; //Yes, this is one after the failure.
	}
	return 0;
}


#define TRYENCODING( encodingName, nameSize, returnValue )	\
	if((remainingSize > nameSize) && (0==CaselessCompare(data, encodingName, nameSize))) return returnValue;

NSStringEncoding ExtractEncodingFromData(NSData * inputData){
	int remainingSize = [inputData length];
	int unsearchableSize;
	if(remainingSize > 1008) unsearchableSize = remainingSize - 1000;
	else unsearchableSize = 8; //So that there's no chance of overrunning the buffer with 'charset='
	const char * data = [inputData bytes];
	
	while(remainingSize > unsearchableSize){
		int compareOffset = CaselessCompare(data, "charset=", 8);
		if(compareOffset != 0){
			data += compareOffset;
			remainingSize -= compareOffset;
			continue;
		}
		data += 8;
		remainingSize -= 8;

		TRYENCODING("windows-1252",12,NSWindowsCP1252StringEncoding);
		TRYENCODING("shift_jis",9,NSShiftJISStringEncoding);
		TRYENCODING("utf-8",5,NSUTF8StringEncoding);
//		TRYENCODING("utf-8",5,NSUTF8StringEncoding);
//		TRYENCODING("utf-8",5,NSUTF8StringEncoding);
//		TRYENCODING("utf-8",5,NSUTF8StringEncoding);
//		TRYENCODING("utf-8",5,NSUTF8StringEncoding);
//		TRYENCODING("utf-8",5,NSUTF8StringEncoding);
//		TRYENCODING("utf-8",5,NSUTF8StringEncoding);
		//TODO: Proper encoding translation here.
	}	
	return NSUTF8StringEncoding;
}





@interface NetHTTPClient : TitaniumProxyObject
{
//Connections to the intarwebs
	NSMutableURLRequest * urlRequest;
	NSURLConnection * urlConnection;
	NSURLResponse * urlResponse;
	NSMutableData * loadedData;
	NSStringEncoding returnedEncoding;
	
	NetHTTPClientState readyState;
	NSInteger currentStatus;
	BOOL connected;
	NSRecursiveLock *stateLock;
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

-(id) init; 
{
	if ((self = [super init])){
		stateLock = [[NSRecursiveLock alloc] init];
	}
	return self;
}
- (void) dealloc;
{
	[urlRequest release];
	[urlConnection release];
	[urlResponse release];
	[loadedData release];
	[stateLock release];
	[super dealloc];
}

+ (NSString *) stringForState: (NetHTTPClientState) ourState;
{
	switch (ourState) {
		case clientStateUnsent:
			return @"Unsent";
		case clientStateOpened:
			return @"Opened";
		case clientStateHeadersReceived:
			return @"Headers Received";
		case clientStateLoading:
			return @"Loading";
		case clientStateDone:
			return @"Done";
		default:
			return @"Unknown State";
	}
}

- (NSString *) description;
{
	return [NSString stringWithFormat:
			@"<NetHTTPClient: 0x%x Request:%@ Response:%@ Data:0x%x(%d bytes) ReadyState:%@>",
			self,urlRequest,urlResponse,loadedData,[loadedData length],[NetHTTPClient stringForState:readyState]
			];
	
}

- (void) setReadyState: (NetHTTPClientState) newState;
{
	[stateLock lock];
	VERBOSE_LOG(@"%@ changing state to %@. Message will be sent to %@ to page with token %@",self,[NetHTTPClient stringForState:newState],javaScriptPath,parentPageToken);
	
	if (newState == readyState)
	{
		[stateLock unlock];
		return;
	}
	readyState = newState;
	[stateLock unlock];
	
	// we call a change state method which sets the local object's readyState to prevent a race condition
	// since the callback usually calls back on readyState to get the state which calls back into this (and it's 
	// not efficient either anyway). this is faster and safer.
	NSString *jscode = [NSString stringWithFormat:@"._changestate(%d)",readyState];
	[[TitaniumHost sharedHost] sendJavascript:[javaScriptPath stringByAppendingString:jscode] toPageWithToken:parentPageToken];
}

- (void) runSend;
{
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	[self setReadyState:clientStateOpened]; // set state before we call open to prevent out of order state
	[self setUrlConnection:[NSURLConnection connectionWithRequest:urlRequest delegate:self]];
	[pool release];
}


- (id) runFunctionNamed: (NSString *) functionName withObject: (id) objectValue error: (NSError **) error;
{
	VERBOSE_LOG(@"%@ Got function named: %@ with object %@",self,functionName,objectValue);

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
		[urlRequest setValue:@"Accept-Charset" forHTTPHeaderField:@"utf-8"];
		
		// set the titanium user agent
		NSString *userAgent;
		NSString *webkit = [urlRequest valueForHTTPHeaderField:@"User-Agent"];
		if (webkit==nil) {
			// sometimes the above returns nil, in which case we need to fake it
			NSString * sysVersion = [[UIDevice currentDevice] systemVersion];
			userAgent = [NSString stringWithFormat:@"Mozilla/5.0 (iPhone; U; CPU iPhone OS %@ like Mac OS X; en-us) AppleWebKit/525.18 (KHTML, like Gecko) Version/%@ Titanium/%s",
						 sysVersion,([sysVersion hasPrefix:@"2."]?@"3.1.1":@"4.0"),STRING(TI_VERSION)];
		} else {
			userAgent = [webkit stringByAppendingFormat:@" Titanium/%s",STRING(TI_VERSION)];
		}
		
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

	} else if ([functionName isEqualToString:@"send"]) 
	{
		// if a string, just take it as-is
		if ([objectValue isKindOfClass:[NSString class]])
		{
			NSString *strValue = (NSString*)objectValue;
			[urlRequest setHTTPBody:[strValue dataUsingEncoding:NSUTF8StringEncoding]];
		}
		else
		{
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

	} else if ([functionName isEqualToString:@"responseText"]) {
		NSString * result = [[NSString alloc] initWithData:loadedData encoding:returnedEncoding];
		if(result == nil){
			returnedEncoding = ExtractEncodingFromData(loadedData);
			result = [[NSString alloc] initWithData:loadedData encoding:returnedEncoding];
		}
		VERBOSE_LOG(@"Returning %d bytes: %@",[loadedData length],result);

		return [result autorelease];

	} else if ([functionName isEqualToString:@"responseData"]) {
		if(loadedData == nil)return nil;
		
		return [[TitaniumHost sharedHost] blobForData:loadedData];
		
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
	
	if ([response textEncodingName]!=nil)
	{
		CFStringEncoding grabbedEncoding = CFStringConvertIANACharSetNameToEncoding((CFStringRef)[response textEncodingName]);
		returnedEncoding = CFStringConvertEncodingToNSStringEncoding(grabbedEncoding);
	}
	else
	{
		id encodingObject = [[(NSHTTPURLResponse *)response allHeaderFields] objectForKey:@"Content-Type"];
		returnedEncoding = NSUTF8StringEncoding;

		if(encodingObject != nil){
			encodingObject = [encodingObject lowercaseString];
			if([encodingObject hasSuffix:@"utf-8"]){

			} else if([encodingObject hasSuffix:@"windows-1252"]){
				returnedEncoding = NSWindowsCP1252StringEncoding;
			}
		}
	}
	
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
			tiObjectPath,tiObjectPath,tiObjectPath,tiObjectPath,tiObjectPath,tiObjectPath,tiObjectPath];

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

- (NetworkModuleConnectionState) currentNetworkConnectionState;
{
	SCNetworkReachabilityFlags flags;
	BOOL gotFlags = SCNetworkReachabilityGetFlags([self defaultRouteReachability], &flags);
	
	if (!gotFlags) {	//Didn't even check?
		return NetworkModuleConnectionStateNone;
	} else {
		return stateForReachabilityFlags(flags);
	}
}


- (NSNumber *) online;
{
	return [NSNumber numberWithBool:[self currentNetworkConnectionState]!=NetworkModuleConnectionStateNone];
}

- (void) handleNetworkChange:(SCNetworkReachabilityRef) target flags: (SCNetworkReachabilityFlags) flags;
{
	TitaniumHost * theTH = [TitaniumHost sharedHost];
	NetworkModuleConnectionState connectionState = stateForReachabilityFlags(flags);
	
	AnalyticsModule * ourAnalytics = (AnalyticsModule *)[theTH moduleNamed:@"Analytics"];
	if(ourAnalytics != nil){
		[ourAnalytics setConnectionState:connectionState];
	}
	
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
	return [NSNumber numberWithInt:[self currentNetworkConnectionState]];
}

- (NSString *) networkTypeName;
{
	switch ([self currentNetworkConnectionState]) {
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
	TitaniumJSCode * addListenerCode = [TitaniumJSCode codeWithString:addListenerString];
	
	[addListenerCode setEpilogueCode:@"window.XMLHttpRequest = function(){return new Titanium.Network.createHTTPClient()};"];
	
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
								 
								 addListenerCode,@"addConnectivityListener",
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
