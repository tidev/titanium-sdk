/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>
#import "LayoutConstraint.h"

@class WebFont;
typedef enum {
	LayoutEntryText,
	LayoutEntryImage,
	LayoutEntryButton,
	LayoutEntryHTML,
	LayoutEntryInput,
} LayoutEntryType;

@interface LayoutEntry : NSObject
{
	LayoutEntryType type;
	LayoutConstraint constraint;
	WebFont* labelFont;
	UIColor * textColor;
	UIColor * selectedTextColor;
	NSString * nameString;
	UITextAlignment textAlign;
}

- (id) initWithDictionary: (NSDictionary *) inputDict inheriting: (LayoutEntry *) inheritance;

@property(nonatomic,readwrite,assign)	LayoutEntryType type;
@property(nonatomic,readwrite,assign)	LayoutConstraint constraint;
@property(nonatomic,readwrite,retain)	WebFont * labelFont;
@property(nonatomic,readwrite,retain)	UIColor * textColor;
@property(nonatomic,readwrite,retain)	UIColor * selectedTextColor;
@property(nonatomic,readwrite,copy)		NSString * nameString;

@property(nonatomic,readonly)			LayoutConstraint * constraintPointer;
@property(nonatomic,readwrite,assign)	UITextAlignment textAlign;

@end
