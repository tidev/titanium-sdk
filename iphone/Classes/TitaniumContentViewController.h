/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */


#import <UIKit/UIKit.h>
#import "TitaniumViewController.h"

@class TitaniumViewController;
@interface TitaniumContentViewController : UIViewController<TitaniumWindowDelegate> {
	NSString * primaryToken;
	NSString * nameString;
	CGSize preferredViewSize;
	
	NSMutableSet * listeningWebContextTokens;
	NSString * titaniumWindowToken;
	
}

@property(nonatomic,readwrite,copy)	NSString * titaniumWindowToken;	//Does not retain the parent, just the token.
@property (nonatomic,copy)	NSString * primaryToken;
@property (nonatomic,copy)	NSString * nameString;
@property(nonatomic,readwrite,assign)	CGSize preferredViewSize;

+ (NSString *) requestToken;
+ (TitaniumContentViewController *) viewControllerForState: (id) inputState relativeToUrl: (NSURL *) baseUrl;
+ (void)registerContentViewController: (Class)controller forToken:(NSString*)token;
- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;

- (BOOL) hasToken: (NSString *) tokenString;
- (void)updateLayout: (BOOL)animated;
- (NSDictionary *) stateValue;
- (BOOL) isShowingView: (TitaniumContentViewController *) contentView;

- (NSString *) javaScriptPath;
- (void) addListeningWebContextToken: (NSString *)newContext;
- (void) removeListeningWebContextToken: (NSString *)oldContext;

@end
