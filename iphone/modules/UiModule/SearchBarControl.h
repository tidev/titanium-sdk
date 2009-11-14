/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>
#import "NativeControlProxy.h"

@interface SearchBarControl : NativeControlProxy<UISearchBarDelegate> {
	UISearchBar * searchView;
//	NSString * stringValue;
	UIColor * barColor;
	BOOL showCancel;
	
	id<UISearchBarDelegate> delegate;	//Yes, we subdelegate.
}

@property(nonatomic,readwrite,copy)	NSString * stringValue;
@property(nonatomic,readwrite,assign)	id<UISearchBarDelegate> delegate;

@end

extern NSString * const createSearchBarString;
