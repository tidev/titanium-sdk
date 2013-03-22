/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UIIPHONETABLEVIEWSCROLLPOSITION) || defined(USE_TI_UIIPHONELISTVIEWSCROLLPOSITION)

#import "TiUIiPhoneTableViewScrollPositionProxy.h"

@implementation TiUIiPhoneTableViewScrollPositionProxy


MAKE_SYSTEM_PROP(NONE,UITableViewScrollPositionNone);
MAKE_SYSTEM_PROP(TOP,UITableViewScrollPositionTop);
MAKE_SYSTEM_PROP(MIDDLE,UITableViewScrollPositionMiddle);
MAKE_SYSTEM_PROP(BOTTOM,UITableViewScrollPositionBottom);


@end

#endif