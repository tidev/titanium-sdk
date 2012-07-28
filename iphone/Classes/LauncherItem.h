/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */


// A good bit of this code was derived from the Three20 project
// and was customized to work inside Titanium
//
// All modifications by Appcelerator are licensed under 
// the Apache License, Version 2.0
//
//
// Copyright 2009 Facebook
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
#ifdef USE_TI_UIDASHBOARDVIEW

#import <Foundation/Foundation.h>

@class LauncherButton;

@interface LauncherItem : NSObject {
	NSString *title;
	UIImage *image;
	UIImage *selectedImage;
	NSInteger badgeValue;
	BOOL canDelete;
	LauncherButton *button;
	UIView *view;
	id userData;
}

@property(nonatomic,readwrite,retain) NSString *title;
@property(nonatomic,readwrite,retain) UIImage *image;
@property(nonatomic,readwrite,retain) UIImage *selectedImage;
@property(nonatomic,readwrite,retain) UIView *view;
@property(nonatomic,assign) LauncherButton *button;


@property(nonatomic,readwrite,assign) id userData;


@property(nonatomic) BOOL canDelete;
@property(nonatomic) NSInteger badgeValue;

@end

#endif