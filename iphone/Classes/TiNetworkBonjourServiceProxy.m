/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Special thanks to Steve Tramer for implementing this.
 */
#ifdef USE_TI_NETWORK

#import "TiNetworkBonjourServiceProxy.h"
#import <sys/socket.h>
#import <netinet/in.h>
#import <netdb.h>
#import <arpa/inet.h>

const NSString* nameKey = @"name";
const NSString* typeKey = @"type";
const NSString* domainKey = @"domain";
const NSString* socketKey = @"socket";


@implementation TiNetworkBonjourServiceProxy

@synthesize socket;

#pragma mark Public

-(id)init
{
    if (self = [super init]) {
        local = YES;
        connectCondition = [[NSCondition alloc] init];
		
		domains = [[NSMutableArray alloc] init];
		domainBrowser = [[NSNetServiceBrowser alloc] init];
		
		[domainBrowser removeFromRunLoop:[NSRunLoop currentRunLoop] 
								 forMode:NSDefaultRunLoopMode];
		[domainBrowser scheduleInRunLoop:[NSRunLoop mainRunLoop] 
								 forMode:NSDefaultRunLoopMode];
		
		searchError = nil;
		searching = NO;
		searchCondition = [[NSCondition alloc] init];
    }
    
    return self;
}

-(id)initWithContext:(id<TiEvaluator>)context_ service:(NSNetService*)service_ local:(bool)local_
{
    if (self = [super _initWithPageContext:context_]) {
        // NOTE: We need to resolve the service to make sure that it's available before opening this socket,
        // and make sure it's available over IPv4.
        socket = nil;
        
        service = [service_ retain];
        local = local_;
        connectCondition = [[NSCondition alloc] init];
        
        [service removeFromRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
        [service scheduleInRunLoop:[NSRunLoop mainRunLoop] forMode:NSDefaultRunLoopMode];
        
        [service setDelegate:self];
    }
    
    return self;
}

-(void)_destroy
{
	[self stop:nil];
	
	if (socket!=nil && [[socket isValid] boolValue])
	{
		[socket close:nil];
	}
	
	RELEASE_TO_NIL(service);
	RELEASE_TO_NIL(socket);
	RELEASE_TO_NIL(connectCondition);
	RELEASE_TO_NIL(domains);
	RELEASE_TO_NIL(domainBrowser);
	RELEASE_TO_NIL(searchCondition);
	
    [super _destroy];
}

-(BOOL)isEqual:(id)obj
{
    if ([obj isKindOfClass:[TiNetworkBonjourServiceProxy class]]) {
        if ([[obj name] isEqual:[self name]] &&
            [[(TiNetworkBonjourServiceProxy*)obj type] isEqual:[self type]] &&
            [[obj domain] isEqual:[self domain]]) {
            return true;
        }
    }
    
    return false;
}

+(NSString*)stringForErrorCode:(NSNetServicesError)code
{
    switch (code) {
        case NSNetServicesUnknownError:
            return @"UnknownError";
            break;
        case NSNetServicesCollisionError:
            return @"NameCollisionError";
            break;
        case NSNetServicesNotFoundError:
            return @"NotFoundError";
            break;
        case  NSNetServicesActivityInProgress:
            return @"InProgress";
            break;
        case NSNetServicesBadArgumentError:
            return @"BadArgumentError";
            break;
        case NSNetServicesCancelledError:
            return @"Cancelled";
            break;
        case NSNetServicesInvalidError:
            return @"InvalidError";
            break;
        case NSNetServicesTimeoutError:
            return @"TimeoutError";
            break;
    }
    
    return @"";
}

-(NSString*)name
{
    return [service name];
}

-(NSString*)type
{
    return [service type];
}

-(NSString*)domain
{
    return [service domain];
}

-(NSNumber*)isLocal
{
    return [NSNumber numberWithBool:local];
}

-(NSNetService*)service
{
    return service;
}

-(void)publish:(id)arg
{
    RELEASE_TO_NIL(error);
	RELEASE_TO_NIL(service);
	RELEASE_TO_NIL(socket);
	
	ENSURE_SINGLE_ARG(arg,TiNetworkTCPSocketProxy);
    
	NSString *name = [self valueForUndefinedKey:@"name"];
	NSString *type = [self valueForUndefinedKey:@"type"];
	NSString *domain = [self valueForUndefinedKey:@"domain"];
	socket = [arg retain];
	
	if (domain==nil)
	{
		domain = @"local.";
	}
	
    service = [[NSNetService alloc] initWithDomain:domain 
                                              type:type
                                              name:name
                                              port:[[socket port] intValue]];
    
    [service removeFromRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
    [service scheduleInRunLoop:[NSRunLoop mainRunLoop] forMode:NSDefaultRunLoopMode];
    [service setDelegate:self];
	
    if (!local) {
        [self throwException:@"Attempt to republish discovered Bonjour service" 
                   subreason:nil
                    location:CODELOCATION];
    }
    if (published) {
        [self throwException:@"Attempt to republish service"
                   subreason:nil
                    location:CODELOCATION];
    }
    if (!socket) {
        [self throwException:@"Attempt to publish service with no associated socket"
                   subreason:nil
                    location:CODELOCATION];
    }
    
    RELEASE_TO_NIL(error);
    
    [service publish];
    
    if (!published && !error) {
        [connectCondition lock];
        [connectCondition wait];
        [connectCondition unlock];
    }
    
    if (error) {
        [self throwException:[@"Failed to publish: " stringByAppendingString:error]
                   subreason:nil
                    location:CODELOCATION];
    }
}

-(void)resolve:(id)args
{
    if (published) {
        [self throwException:@"Attempt to resolve published Bonjour service"
                   subreason:nil
                    location:CODELOCATION];
    }
    if (socket) {
        [self throwException:@"Attempt to re-resolve service"
                   subreason:nil
                    location:CODELOCATION];
    }
    
    RELEASE_TO_NIL(error);
    
    NSTimeInterval timeout = 120.0;
    if ([args count] != 0 && !IS_NULL_OR_NIL([args objectAtIndex:0])) {
        ENSURE_CLASS([args objectAtIndex:0], [NSNumber class])
        timeout = [[args objectAtIndex:0] doubleValue];
    }
    
    [service resolveWithTimeout:timeout];
    
    if (!socket && !error) {
        [connectCondition lock];
        [connectCondition wait];
        [connectCondition unlock];
    }
    
    if (error) {
        [self throwException:[@"Did not resolve: " stringByAppendingString:error]
                   subreason:nil
                    location:CODELOCATION];
    }
}

-(void)stop:(id)arg
{    
    [service stop];
    
    if (published) {
        [connectCondition lock];
        [connectCondition wait];
        [connectCondition unlock];
    }
}

#pragma mark Private

-(void)synthesizeService
{
    
}

-(void)setError:(NSString*)error_
{
    if (error != error_) {
        [error release];
        error = [error_ retain];
    }
}

-(void)setSocket:(TiNetworkTCPSocketProxy*)socket_
{
    if (socket != socket_) {
        [socket release];
        socket = [socket_ retain];
    }
}

#pragma mark Delegate methods

#pragma mark Publication

-(void)netService:(NSNetService*)service_ didNotPublish:(NSDictionary*)errorDict
{
    [self setError:[TiNetworkBonjourServiceProxy stringForErrorCode:[[errorDict valueForKey:NSNetServicesErrorCode] intValue]]];
    
    [connectCondition lock];
    [connectCondition signal];
    [connectCondition unlock];
}

-(void)netServiceDidPublish:(NSNetService *)service_
{
    published = YES;
    
    [connectCondition lock];
    [connectCondition signal];
    [connectCondition unlock];
}

#pragma mark Resolution

-(void)netService:(NSNetService*)service_ didNotResolve:(NSDictionary*)errorDict
{
    [self setError:[TiNetworkBonjourServiceProxy stringForErrorCode:[[errorDict valueForKey:NSNetServicesErrorCode] intValue]]];
}

-(void)netServiceDidResolveAddress:(NSNetService*)service_
{
    // TODO: Do we really need to only check IPv4?  Why not just resolve the first given address?
    NSData* addressData = nil;
    NSEnumerator* addressEnum = [[service addresses] objectEnumerator];
    while (addressData = [addressEnum nextObject]) {
        const struct sockaddr* address = [addressData bytes];
        if (address->sa_family == AF_INET) {
            [self setSocket:[[[TiNetworkTCPSocketProxy alloc] _initWithPageContext:[self pageContext]
                                                                       args:[NSArray arrayWithObject:[NSDictionary dictionaryWithObjectsAndKeys:
                                                                                                        [NSNumber numberWithInt:[service port]], @"port",
                                                                                                        [service hostName], @"hostName",
                                                                                                        [NSNumber numberWithInt:READ_WRITE_MODE], @"mode", nil]]]
                      autorelease]];
            
            [connectCondition lock];
            [connectCondition signal];
            [connectCondition unlock];
            break;
        }
    }
}

#pragma mark Stopping

-(void)netServiceDidStop:(NSNetService*)service_
{
    published = NO;
    
    [connectCondition lock];
    [connectCondition signal];
    [connectCondition unlock];
}

#pragma mark Bonjour 

-(void)searchDomains:(id)unused
{
    RELEASE_TO_NIL(searchError);
    [domainBrowser searchForBrowsableDomains];
    
    if (!searching && !searchError) {
        [searchCondition lock];
        [searchCondition wait];
        [searchCondition unlock];
    }
    
    if (searchError) {
        [self throwException:[@"Failed to search: " stringByAppendingString:searchError]
                   subreason:nil
                    location:CODELOCATION];        
    }
}

-(void)stopDomainSearch:(id)unused
{
    [domainBrowser stop];
    
    if (searching) {
        [searchCondition lock];
        [searchCondition wait];
        [searchCondition unlock];
    }
    
    [domains removeAllObjects];
}

-(NSNumber*)isSearching:(id)unused
{
    return [NSNumber numberWithBool:searching];
}

#pragma mark Private

-(void)setSearchError:(NSString*)error_
{
    if (searchError != error_) {
        [searchError release];
        searchError = [error_ retain];
    }
}

#pragma mark Delegate methods (NSNetServiceBrowser)

#pragma mark Domain management

-(void)fireDomainUpdateEvent
{
	NSDictionary * eventObject = [NSDictionary dictionaryWithObject:
								  [[domains copy] autorelease] forKey:@"domains"];
	[self fireEvent:@"updatedDomains" withObject:eventObject];	//TODO: Deprecate old event.
	[self fireEvent:@"updateddomains" withObject:eventObject];	
}

-(void)netServiceBrowser:(NSNetServiceBrowser*)browser didFindDomain:(NSString*)domain moreComing:(BOOL)more
{
    [domains addObject:domain];
    
    if (!more) {
		[self fireDomainUpdateEvent];
    }
}

-(void)netServiceBrowser:(NSNetServiceBrowser*)browser didRemoveDomain:(NSString*)domain moreComing:(BOOL)more
{
    [domains removeObject:domain];
    
    if (!more) {
		[self fireDomainUpdateEvent];
    }
}

#pragma mark Search management

-(void)netServiceBrowserWillSearch:(NSNetServiceBrowser*)browser
{
    searching = YES;
    
    [searchCondition lock];
    [searchCondition signal];
    [searchCondition unlock];
}

-(void)netServiceBrowser:(NSNetServiceBrowser *)browser didNotSearch:(NSDictionary *)errorDict
{
    [self setSearchError:[TiNetworkBonjourServiceProxy stringForErrorCode:[[errorDict objectForKey:NSNetServicesErrorCode] intValue]]];
    
    [searchCondition lock];
    [searchCondition signal];
    [searchCondition unlock];
}

-(void)netServiceBrowserDidStopSearch:(NSNetServiceBrowser*)browser
{
    searching = NO;
    
    [searchCondition lock];
    [searchCondition signal];
    [searchCondition unlock];
}

@end

#endif