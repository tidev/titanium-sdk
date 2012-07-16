//
//  ASIFormDataRequest.h
//  Part of ASIHTTPRequest -> http://allseeing-i.com/ASIHTTPRequest
//
//  Created by Ben Copsey on 07/11/2008.
//  Copyright 2008-2009 All-Seeing Interactive. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "ASIHTTPRequest.h"
#import "ASIHTTPRequestConfig.h"

typedef enum TI__ASIPostFormat {
    TI_ASIMultipartFormDataPostFormat = 0,
    TI_ASIURLEncodedPostFormat = 1
	
} TI_ASIPostFormat;

@interface TI_ASIFormDataRequest : ASIHTTPRequest <NSCopying> {

	// Parameters that will be POSTed to the url
	NSMutableArray *postData;
	
	// Files that will be POSTed to the url
	NSMutableArray *fileData;
	
	TI_ASIPostFormat postFormat;
	
	NSStringEncoding stringEncoding;
	
#if DEBUG_FORM_DATA_REQUEST
	// Will store a string version of the request body that will be printed to the console when ASIHTTPREQUEST_DEBUG is set in GCC_PREPROCESSOR_DEFINITIONS
	NSString *debugBodyString;
#endif
	
}

#pragma mark utilities 
- (NSString*)encodeURL:(NSString *)string; 
 
#pragma mark setup request

// Add a POST variable to the request
- (void)addPostValue:(id <NSObject>)value forKey:(NSString *)key;

// Set a POST variable for this request, clearing any others with the same key
- (void)setPostValue:(id <NSObject>)value forKey:(NSString *)key;

// Add the contents of a local file to the request
- (void)addFile:(NSString *)filePath forKey:(NSString *)key;

// Same as above, but you can specify the content-type and file name
- (void)addFile:(NSString *)filePath withFileName:(NSString *)fileName andContentType:(NSString *)contentType forKey:(NSString *)key;

// Add the contents of a local file to the request, clearing any others with the same key
- (void)setFile:(NSString *)filePath forKey:(NSString *)key;

// Same as above, but you can specify the content-type and file name
- (void)setFile:(NSString *)filePath withFileName:(NSString *)fileName andContentType:(NSString *)contentType forKey:(NSString *)key;

// Add the contents of an NSData object to the request
- (void)addData:(NSData *)data forKey:(NSString *)key;

// Same as above, but you can specify the content-type and file name
- (void)addData:(id)data withFileName:(NSString *)fileName andContentType:(NSString *)contentType forKey:(NSString *)key;

// Add the contents of an NSData object to the request, clearing any others with the same key
- (void)setData:(NSData *)data forKey:(NSString *)key;

// Same as above, but you can specify the content-type and file name
- (void)setData:(id)data withFileName:(NSString *)fileName andContentType:(NSString *)contentType forKey:(NSString *)key;


@property (assign) TI_ASIPostFormat postFormat;
@property (assign) NSStringEncoding stringEncoding;
@end

@compatibility_alias ASIFormDataRequest TI_ASIFormDataRequest;
