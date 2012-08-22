/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

@interface TiUIAlertDialogProxy : TiProxy<UIAlertViewDelegate> {
@private
	UIAlertView *alert;
    BOOL persistentFlag;
}

-(void)show:(id)args;

@end
