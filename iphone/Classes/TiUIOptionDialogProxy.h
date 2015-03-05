/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIOPTIONDIALOG

#import "TiProxy.h"
@class TiViewProxy;

@interface TiUIOptionDialogProxy : TiProxy<UIActionSheetDelegate,UIPopoverPresentationControllerDelegate> {

    UIActionSheet *actionSheet;
    UIAlertController* alertController;
    TiViewProxy *dialogView;
    CGRect dialogRect;
    BOOL animated;
    NSUInteger accumulatedOrientationChanges;
    BOOL showDialog;
    BOOL persistentFlag;
    BOOL forceOpaqueBackground;
    int cancelButtonIndex;
    int destructiveButtonIndex;
}

@property(nonatomic,retain,readwrite)	TiViewProxy *dialogView;

-(void)deviceRotationBegan:(NSNotification *)notification;
-(void)updateOptionDialogNow;

@end

#endif
