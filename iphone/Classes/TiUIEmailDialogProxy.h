/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"
#import <MessageUI/MessageUI.h>

@interface TiUIEmailDialogProxy : TiProxy<MFMailComposeViewControllerDelegate> {
	NSMutableArray * attachments;
	//Because of addAttachment, we have to make this mutable and controlled.
}

- (void)open:(id)args;

- (void)addAttachment:(id)args;
@property(nonatomic,copy)	NSArray * attachments;

@end
