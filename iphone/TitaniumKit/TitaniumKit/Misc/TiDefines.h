//
//  TiDefines.h
//  TitaniumKit
//
//  Created by Hans Knöchel on 05.04.18.
//  Copyright © 2018 Hans Knoechel. All rights reserved.
//

#ifndef TiDefines_h
#define TiDefines_h

/* FIXME: Remove once we figured out a way to handle macros in compiled frameworks properly */

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 100000
#define IS_XCODE_8 true
#else
#define IS_XCODE_8 false
#endif

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 110000
#define IS_XCODE_9 true
#else
#define IS_XCODE_9 false
#endif

#endif /* TiDefines_h */
