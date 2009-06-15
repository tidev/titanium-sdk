/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "TitaniumHost.h"

extern const NSString * htmlMimeType;
extern const NSString * textMimeType;
extern const NSString * jpegMimeType;


@protocol TitaniumAppAssetResolver
- (NSData*) resolveAppAsset:(NSURL*)url;
- (void)release;
- (void)retain;
@end

@interface TitaniumAppProtocol : NSURLProtocol {
}

+ (NSString *)mimeTypeFromExtension:(NSString *)ext;
+ (NSString*)specialProtocolScheme;
+ (void) registerSpecialProtocol;
+ (NSString*) getPath:(NSURL*)url;
+ (void) registerAppAssetResolver:(id<TitaniumAppAssetResolver>)resolver;
@end
