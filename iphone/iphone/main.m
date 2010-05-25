/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <UIKit/UIKit.h>

//NOTE: this main is only used inside XCode. In the real SDK, it's 
//automatically replaced and built on the fly - when running in 
//XCode give some reasonable values

NSString * const TI_APPLICATION_DEPLOYTYPE = @"development";
NSString * const TI_APPLICATION_ID = @"com.appcelerator.kitchensink.xcode";
NSString * const TI_APPLICATION_PUBLISHER = @"Appcelerator";
NSString * const TI_APPLICATION_URL = @"http://www.appcelerator.com";
NSString * const TI_APPLICATION_NAME = @"Kitchen Sink (XCode)";
NSString * const TI_APPLICATION_VERSION = @"1.0";
NSString * const TI_APPLICATION_DESCRIPTION = @"Kitchen Sink from XCode";
NSString * const TI_APPLICATION_COPYRIGHT = @"Appcelerator";
NSString * const TI_APPLICATION_GUID = @"25FE4B6E-7DA9-4344-B55B-25195570860F";
BOOL const TI_APPLICATION_ANALYTICS = YES;
NSString * const TI_APPLICATION_RESOURCE_DIR = nil;

int main(int argc, char *argv[]) {
    
    NSAutoreleasePool * pool = [[NSAutoreleasePool alloc] init];
    int retVal = UIApplicationMain(argc, argv, nil, @"TiApp");
    [pool release];
    return retVal;
}
