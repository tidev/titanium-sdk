/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIWidgetProxy.h"

@interface TiUISearchBarProxy : TiUIWidgetProxy<UISearchBarDelegate> {
	id<UISearchBarDelegate> delegate;	//Yes, we subdelegate. No, the delegate is not retained.
}

@property(nonatomic,readwrite,assign)	id<UISearchBarDelegate> delegate;

@end
