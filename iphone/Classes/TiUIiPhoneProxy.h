/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

@interface TiUIiPhoneProxy : TiProxy {
@private
	TiProxy *animationStyle;
	TiProxy *statusBar;
	TiProxy *rowAnimationStyle;
	TiProxy *systemButtonStyle;
	TiProxy *systemButton;
	TiProxy *progressBarStyle;
	TiProxy *activityIndicatorStyle;
	TiProxy *systemIcon;
	TiProxy *scrollIndicatorStyle;
	TiProxy *tableViewStyle;
	TiProxy *tableViewSeparatorStyle;
}

@property(nonatomic,readonly) TiProxy* AnimationStyle;
@property(nonatomic,readonly) TiProxy* StatusBar;
@property(nonatomic,readonly) TiProxy* RowAnimationStyle;
@property(nonatomic,readonly) TiProxy* SystemButtonStyle;
@property(nonatomic,readonly) TiProxy* SystemButton;
@property(nonatomic,readonly) TiProxy* ProgressBarStyle;
@property(nonatomic,readonly) TiProxy* ActivityIndicatorStyle;
@property(nonatomic,readonly) TiProxy* SystemIcon;
@property(nonatomic,readonly) TiProxy* ScrollIndicatorStyle;
@property(nonatomic,readonly) TiProxy* TableViewStyle;
@property(nonatomic,readonly) TiProxy* TableViewSeparatorStyle;


@property(nonatomic,readwrite,assign)	NSNumber *statusBarHidden;
@property(nonatomic,readwrite,assign)	NSNumber *statusBarStyle;
@property(nonatomic,readwrite,assign)	NSNumber *appBadge;
@property(nonatomic,readwrite,assign)	NSNumber *appSupportsShakeToEdit;

-(void)hideStatusBar:(id)args;
-(void)showStatusBar:(id)args;



@end
