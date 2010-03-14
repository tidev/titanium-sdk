/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

@interface TiUITableViewTitle : UIView 
{
	NSString * text;
	UIColor * textColor;
	UIFont * font;
	UITextAlignment textAlignment;	
}

@property(nonatomic,readwrite,retain)	UIFont	 * font;
@property(nonatomic,readwrite,retain)	UIColor  * textColor;
@property(nonatomic,readwrite,retain)	NSString * text;
@property(nonatomic)					UITextAlignment textAlignment;    // default is UITextAlignmentLeft

@end
