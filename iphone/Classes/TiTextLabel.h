/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>


@interface TiTextLabel : UIView
{
	UIFont * font;
	UIColor * textColor;
	UIColor * highlightedTextColor;
	BOOL highlighted;
	NSString * text;
	UITextAlignment textAlignment;
}

@property(nonatomic,readwrite,retain)	UIFont * font;
@property(nonatomic,readwrite,retain)	UIColor * textColor;
@property(nonatomic,readwrite,retain)	NSString * text;

@property(nonatomic,retain)               UIColor *highlightedTextColor; // default is nil
@property(nonatomic,getter=isHighlighted) BOOL     highlighted;          // default is NO
@property(nonatomic)        UITextAlignment textAlignment;   // default is UITextAlignmentLeft

@end
