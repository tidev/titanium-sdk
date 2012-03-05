/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UISCROLLVIEW

#import "TiViewProxy.h"

@interface TiUIScrollViewProxy : TiViewProxy<UIScrollViewDelegate> 
{
    TiPoint * contentOffset;
}
-(void) setContentOffset:(id)value withObject:(id)animated;

@end

#endif