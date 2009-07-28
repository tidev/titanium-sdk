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
	CGSize preferredViewSize;
	
	TitaniumViewController * titaniumWindowController;
}

@property(nonatomic,readwrite,assign)	TitaniumViewController * titaniumWindowController;	//Does not retain the parent.
@property (nonatomic,retain)	NSString * primaryToken;
@property(nonatomic,readwrite,assign)	CGSize preferredViewSize;

+ (NSString *) requestToken;
+ (TitaniumContentViewController *) viewControllerForState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;

- (BOOL) hasToken: (NSString *) tokenString;
- (void)updateLayout: (BOOL)animated;
- (NSDictionary *) stateValue;

@end
