/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_NETWORK

#import "TiNetworkPersistentHTTPClientProxy.h"

-(void)setResponseHandlersFroRequest:(ASIFormDataRequest*)request
{
	if (hasOnsendstream)
	{
		[request setUploadProgressDelegate:self];
	}
	if (hasOndatastream)
	{
		[request setDidReceiveDataSelector:@selector(request:receivedData:)];
	}
}

// Called when the request receives some data - bytes is the length of that data
- (void)request:(ASIHTTPRequest *)request receivedData:(NSData *)data
{
	if (hasOndatastream)
	{
		NSString *dataToString = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
		TiNetworkHTTPClientResultProxy *thisPointer = [[TiNetworkHTTPClientResultProxy alloc] initWithDelegate:self];
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding],@"data",@"datastream",@"type",nil];
		[self fireCallback:@"ondatastream" withArg:event withSource:thisPointer];
		[thisPointer release];
	}
}

@end

#endif
