/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIEMAILDIALOG

#import "TiProxy.h"
#import <MessageUI/MessageUI.h>

@interface TiUIEmailDialogProxy : TiProxy<MFMailComposeViewControllerDelegate> 
{
	NSMutableArray * attachments;
}

- (void)open:(id)args;
- (void)addAttachment:(id)args;

@property(nonatomic,readonly)	NSArray * attachments;

@property(nonatomic,readonly)	NSNumber *SENT;
@property(nonatomic,readonly)	NSNumber *SAVED;
@property(nonatomic,readonly)	NSNumber *CANCELLED;
@property(nonatomic,readonly)	NSNumber *FAILED;

@end

#endif