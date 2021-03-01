//
// Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
//
// This code is proprietary and confidential to Appcelerator
// and not for redistribution.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface TiVerifyErrorController : UIViewController {
  NSString *message;
}

- (id)initWithMessage:(NSString *)message;

@end
