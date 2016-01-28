/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#if defined(USE_TI_UIIOSTOOLBAR) || defined(USE_TI_UITOOLBAR)
#import "TiUIView.h"

@protocol ios6ToolbarDelegate
- (NSInteger)positionForBar:(id)bar;
@end
@interface TiUIiOSToolbar : TiUIView<LayoutAutosizing,ios6ToolbarDelegate> {
    UIToolbar * toolBar;
    BOOL hideTopBorder;
    BOOL showBottomBorder;
    BOOL extendsBackground;
}

-(UIToolbar *)toolBar;

@end

#endif
