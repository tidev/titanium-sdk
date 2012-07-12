//
//  ASIInputStream.h
//  Part of ASIHTTPRequest -> http://allseeing-i.com/ASIHTTPRequest
//
//  Created by Ben Copsey on 10/08/2009.
//  Copyright 2009 All-Seeing Interactive. All rights reserved.
//

#import <Foundation/Foundation.h>

@class TI_ASIHTTPRequest;

// This is a wrapper for NSInputStream that pretends to be an NSInputStream itself
// Subclassing NSInputStream seems to be tricky, and may involve overriding undocumented methods, so we'll cheat instead.
// It is used by ASIHTTPRequest whenever we have a request body, and handles measuring and throttling the bandwidth used for uploading

@interface TI_ASIInputStream : NSObject {
	NSInputStream *stream;
	TI_ASIHTTPRequest *request;
}
+ (id)inputStreamWithFileAtPath:(NSString *)path request:(TI_ASIHTTPRequest *)request;
+ (id)inputStreamWithData:(NSData *)data request:(TI_ASIHTTPRequest *)request;

@property (retain, nonatomic) NSInputStream *stream;
@property (assign, nonatomic) TI_ASIHTTPRequest *request;
@end

@compatibility_alias ASIInputStream TI_ASIInputStream;