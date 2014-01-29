//
//  TiResponse.h
//  HTTPClient
//
//  Created by Pedro Enrique on 1/16/14.
//  Copyright (c) 2014 Pedro Enrique. All rights reserved.
//

#import <Foundation/Foundation.h>

#ifndef PELog
#define PELog(...) {\
/*NSLog(__VA_ARGS__);*/\
}
#endif
#ifndef RELEASE_TO_NIL
#define RELEASE_TO_NIL(x) { if (x!=nil) { [x release]; x = nil; } }
#endif

typedef enum {
	TiResponseStateUnsent = 0,
	TiResponseStateOpened = 1,
    TiResponseStateHeaders = 2,
    TiResponseStateLoading = 3,
    TiResponseStateDone = 4
} TiResponseState;

@interface TiHTTPResponse : NSObject
{
    NSMutableData *_data;
}
@property(nonatomic, readonly) NSURL *url;
@property(nonatomic, readonly) NSInteger status;
@property(nonatomic, readonly) NSDictionary *headers;
@property(nonatomic, readonly) NSString *connectionType;
@property(nonatomic, readonly) NSString *location;
@property(nonatomic, retain) NSError *error;
@property(nonatomic) float downloadProgress;
@property(nonatomic) float uploadProgress;


@property(nonatomic, readonly) NSData* responseData;
@property(nonatomic, readonly) NSString*responseString;
@property(nonatomic, readonly) NSDictionary*responseDictionary;
@property(nonatomic, readonly) NSArray* responseArray;

@property(nonatomic) BOOL connected;
@property(nonatomic) TiResponseState readyState;


-(void)appenData:(NSData*)data;
-(void)setResponse:(NSURLResponse*) response;
-(void)setRequest:(NSURLRequest*) request;
@end
