/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"

#ifdef USE_TI_UIIPADSPLITWINDOW

#import "TiViewProxy.h"

@interface TiUIiPadSplitWindowButtonProxy : TiViewProxy {
@private
	UIBarButtonItem *button;
}

-(id)initWithButton:(UIBarButtonItem*)button pageContext:(id<TiEvaluator>)pageContext;

@end

#endif