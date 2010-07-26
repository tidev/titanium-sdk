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

#import "LauncherItem.h"
#import "LauncherButton.h"
#import "TiUIView.h"
#import "TiUIViewProxy.h"

@implementation LauncherItem

@synthesize title, canDelete, badgeValue, image, selectedImage, button, userData, view;

-(id)init
{
	if (self = [super init])
	{
		canDelete = YES;
		badgeValue = 0;
	}
	return self;
}

-(void)dealloc
{
	[title release];
	[image release];
	[selectedImage release];
	[userData release];
	[view release];
	[super dealloc];
}

-(void)repaint
{
	if (button!=nil)
	{
		[button performSelectorOnMainThread:@selector(setNeedsLayout) withObject:nil waitUntilDone:NO];
	}
}

-(void)setBadgeValue:(NSInteger)value
{
	badgeValue = value;
	[self repaint];
}

-(void)setImage:(UIImage*)image_
{
	[image release];
	image = [image_ retain];
	[self repaint];
}

-(void)setSelectedImage:(UIImage*)image_
{
	[selectedImage release];
	selectedImage = [image_ retain];
	[self repaint];
}

-(void)setButton:(LauncherButton *)button_
{
	button = button_;
	[self repaint];
}

-(void)setView:(UIView*)view_
{
	[view release];
	view = [view_ retain];
	[self repaint];
}


@end

#endif