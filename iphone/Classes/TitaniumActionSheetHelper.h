/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>


@interface TitaniumActionSheetHelper : NSObject<UIActionSheetDelegate> {
	UIActionSheet * subjectSheet;
	NSMutableDictionary * invocationDictionary;
}

@property(nonatomic,readwrite,retain)	UIActionSheet * subjectSheet;
@property(nonatomic,readwrite,retain)	NSMutableDictionary * invocationDictionary;

- (NSInteger) addButton:(NSInvocation *) newInvocation title: (NSString *) newTitle;
- (NSInteger) addDestructiveButton:(NSInvocation *) newInvocation title: (NSString *) newTitle;
- (NSInteger) addCancelButton:(NSInvocation *) newInvocation title: (NSString *) newTitle;
- (NSInteger) addCancelButton:(NSInvocation *) newInvocation;
- (NSInteger) addCancelButton;

- (void) showSheet;
- (void) showSheetInMainThread;

@end
