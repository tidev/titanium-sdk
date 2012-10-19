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

#import <QuartzCore/QuartzCore.h>
#import "LauncherButton.h"
#import "LauncherItem.h"
#import "TiUtils.h"
#import "TiUIView.h"
#import "TiViewProxy.h"


@implementation LauncherButton

@synthesize dragging, editing, item;

-(id)initWithFrame:(CGRect)frame
{
    if (self = [super initWithFrame:frame])
    {
        self.backgroundColor = [UIColor clearColor];
        button = [[UIButton buttonWithType:UIButtonTypeCustom] retain];
        button.backgroundColor = [UIColor clearColor];
        button.userInteractionEnabled = NO;
        [self addSubview:button];
    }
    return self;
}

-(void)dealloc
{
	[button release];
	[closeButton release];
	[badge release];
	[item release];
	item = nil;
	[super dealloc];
}

-(UIView *) hitTest:(CGPoint)point withEvent:(UIEvent *)event {
    UIView *superResult = [super hitTest:point withEvent:event];
    if (!editing && (superResult == self)) {
        //TIMOB-11275 Ignore all touches if not in button frame and not editing
        CGRect buttonFrame = [button frame];
        if (CGRectContainsPoint(buttonFrame, point)) {
            return superResult;
        }
        if (badge != nil) {
            buttonFrame = [badge frame];
            if (CGRectContainsPoint(buttonFrame, point)) {
                return superResult;
            }
        }
        return nil;
    }
    else {
        return superResult;
    }
}

-(void)setFrame:(CGRect)frame
{
	[super setFrame:frame];
	
	if (item.view!=nil)
	{
		TiUIView *v = (TiUIView*)item.view;
		TiViewProxy *p =(TiViewProxy*) v.proxy;
		[p windowWillOpen];
		[p windowDidOpen];
		[p reposition];
		[p layoutChildren:NO];
	}
}

-(void)setItem:(LauncherItem *)item_
{
	if (item!=nil)
	{
		item.button = nil;
		[item release];
		item = nil;
	}

	if (item_!=nil)
	{
		item = [item_ retain];
		item.button = self;
		
		if (item.view!=nil)
		{
			item.view.userInteractionEnabled = NO;
			[self addSubview:item.view];
		}
		else
		{
			[button setTitle:item.title forState:UIControlStateNormal];
			[button setImage:item.image forState:UIControlStateNormal];
			if (item.selectedImage!=nil)
			{
				[button setImage:item.selectedImage forState:UIControlStateHighlighted];
			}
		}
	}
	[self setNeedsLayout];
}

- (void)touchesBegan:(NSSet*)touches withEvent:(UIEvent *)event 
{
    [super touchesBegan:touches withEvent:event];
    [[self nextResponder]touchesBegan:touches withEvent:event];
}

- (void)touchesMoved:(NSSet*)touches withEvent:(UIEvent *)event 
{
    [super touchesMoved:touches withEvent:event];
    [[self nextResponder]touchesMoved:touches withEvent:event];
}

- (void)touchesEnded:(NSSet*)touches withEvent:(UIEvent *)event 
{
    [super touchesEnded:touches withEvent:event];
    [[self nextResponder]touchesEnded:touches withEvent:event];
}

-(void) setSelected:(BOOL)yn {
    [super setSelected:yn];
    [button setSelected:yn];
}

-(void) setHighlighted:(BOOL)yn {
    [super setHighlighted:yn];
    [button setHighlighted:yn];
}

- (BOOL)isHighlighted 
{
	return !dragging && [super isHighlighted];
}

- (BOOL)isSelected 
{
	return !dragging && [super isSelected];
}

- (UIButton*)closeButton 
{
	if (!closeButton && item.canDelete) 
	{
		UIImage *image = [UIImage imageNamed:@"modules/ui/images/closeButton.png"];
		UIButton *cbutton = [UIButton buttonWithType:UIButtonTypeCustom];
		[cbutton setImage:image forState:UIControlStateNormal];
		[cbutton setImageEdgeInsets:UIEdgeInsetsMake(1,1,1,1)];
		[cbutton setBackgroundColor:[UIColor blackColor]];
		[cbutton.layer setCornerRadius:13];
		[cbutton.layer setBorderColor:[UIColor whiteColor].CGColor];
		[cbutton.layer setBorderWidth:2];
		cbutton.frame = CGRectMake(0,0,24,24);
		closeButton = [cbutton retain];
	}
	return closeButton;
}

- (void)setDragging:(BOOL)dragging_ 
{
	if (dragging != dragging_) 
	{
		dragging = dragging_;
		
		if (dragging) 
		{
			self.transform = CGAffineTransformMakeScale(1.3, 1.3);
			self.alpha = 0.7;
		} 
		else 
		{
			self.transform = CGAffineTransformIdentity;
			self.alpha = 1;
		}
	}
}

- (void)setEditing:(BOOL)editing_ 
{
	if (editing != editing_) 
	{
		editing = editing_;
		if (editing) 
		{
			if (badge!=nil)
			{
				[badge setHidden:YES];
			}
			[self addSubview:[self closeButton]];
		} 
		else 
		{
			if (badge!=nil && dragging==NO)
			{
				[badge setHidden:item.badgeValue==0];
			}
			[closeButton removeFromSuperview];
			[closeButton release];
			closeButton = nil;
		}
	}
}

- (void)layoutSubviews 
{
	[super layoutSubviews];
    [button sizeToFit];
    CGRect viewBounds = [self bounds];
    CGRect buttonBounds = [button bounds];
    if (buttonBounds.size.width > viewBounds.size.width) {
        buttonBounds.size.width = viewBounds.size.width;
        buttonBounds.origin.x = 0;
    }
    else {
        buttonBounds.origin.x = (viewBounds.size.width - buttonBounds.size.width)/2;
    }
    if (buttonBounds.size.height > viewBounds.size.height) {
        buttonBounds.size.height = viewBounds.size.height;
        buttonBounds.origin.y = 0;
    }
    else {
        buttonBounds.origin.y = (viewBounds.size.height - buttonBounds.size.height)/2;
    }
    [button setFrame:buttonBounds];
	if (item.badgeValue > 0)
	{
		if (badge==nil)
		{
			UIImage *badgeImage = [UIImage imageNamed:@"modules/ui/images/badge.png"];
			UIImage *stretchImage = [badgeImage stretchableImageWithLeftCapWidth:badgeImage.size.width/2 topCapHeight:badgeImage.size.height/2];
			
			UIButton *cbutton = [UIButton buttonWithType:UIButtonTypeCustom];
			[cbutton setBackgroundImage:stretchImage forState:UIControlStateNormal];
			cbutton.frame = CGRectMake(0,0,29,29);
			cbutton.titleLabel.font = [UIFont boldSystemFontOfSize:12];
			badge = [cbutton retain];
			[self addSubview:badge];
			badge.userInteractionEnabled = NO;
		}
		
		NSInteger value = item.badgeValue;
		NSString *title = [NSString stringWithFormat:@"%d",value];
		if (value>99)
		{
			title = @"99+";
		}
		if (value > 0 && value < 100)
		{
			badge.frame = CGRectMake(0,0,29,29);
		}
		else
		{
			badge.frame = CGRectMake(0,0,36,29);
		}
		[badge setTitle:title forState:UIControlStateNormal];
		if (dragging==NO && editing==NO)
		{
			[badge setHidden:NO];
		}
	}
	else if (badge!=nil)
	{
		[badge setHidden:YES];
	}
	
	if (badge || closeButton) 
	{
        if(self.bounds.size.width > 0 && self.bounds.size.height > 0)
        {
            if (badge) 
            {
                CGPoint point = CGPointMake((buttonBounds.origin.x + buttonBounds.size.width) - (badge.bounds.size.width/2),buttonBounds.origin.y-(4*badge.bounds.size.height/5));
                if ((point.x + badge.bounds.size.width) >  viewBounds.size.width ){
                    point.x = viewBounds.size.width - badge.bounds.size.width;
                }
                if (point.y < 0) {
                    point.y = 0;
                }
                badge.frame = CGRectMake(point.x, point.y, badge.bounds.size.width, badge.bounds.size.height);
            }
            if (closeButton) 
            {
                CGPoint point = CGPointMake(buttonBounds.origin.x-(closeButton.bounds.size.width/3),buttonBounds.origin.y-(closeButton.bounds.size.height/3));
                if (point.x < 0) {
                    point.x = 0;
                }
                if (point.y < 0) {
                    point.y = 0;
                }
                closeButton.frame = CGRectMake(point.x,point.y, closeButton.bounds.size.width, closeButton.bounds.size.height);
            }
        }
    }
}

@end

#endif