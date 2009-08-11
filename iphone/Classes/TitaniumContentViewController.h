//
//  TitaniumContentViewController.h
//  Titanium
//
//  Created by Blain Hamon on 7/17/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "TitaniumViewController.h"

@class TitaniumViewController;
@interface TitaniumContentViewController : UIViewController<TitaniumWindowDelegate> {
	NSString * primaryToken;
	NSString * nameString;
	CGSize preferredViewSize;
	
	NSString * titaniumWindowToken;
}

@property(nonatomic,readwrite,copy)	NSString * titaniumWindowToken;	//Does not retain the parent, just the token.
@property (nonatomic,copy)	NSString * primaryToken;
@property (nonatomic,copy)	NSString * nameString;
@property(nonatomic,readwrite,assign)	CGSize preferredViewSize;

+ (NSString *) requestToken;
+ (TitaniumContentViewController *) viewControllerForState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;

- (BOOL) hasToken: (NSString *) tokenString;
- (void)updateLayout: (BOOL)animated;
- (NSDictionary *) stateValue;

@end
