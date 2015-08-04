/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>

#define DebugLog NSLog

#define CODELOCATION	[NSString stringWithFormat:@"%s (%@:%d)",__FUNCTION__,[[NSString stringWithFormat:@"%s",__FILE__] lastPathComponent],__LINE__]
#define ENSURE_SINGLE_ARG(x,t) \
    if ([x isKindOfClass:[NSArray class]] && [x count]>0) \
    { \
        x = (t*)[x objectAtIndex:0]; \
    } \
    if (![x isKindOfClass:[t class]]) \
    {\
        @throw [NSException exceptionWithName:@"Invalid type passed to function" reason:[NSString stringWithFormat:@"expected: %@, was: %@", [t class], [x class]] userInfo:nil]; \
    }

@interface TiUtils : UIView

+(void)setIsTesting:(BOOL)flag;
+(BOOL)isTesting;
+(int)dpi;
+(BOOL)isIPad;
+(BOOL)isRetinaDisplay;
+(BOOL)isRetinaHDDisplay;
+(BOOL)isIOS8OrGreater;
+(CGFloat)floatValue:(id)value;
+(CGFloat)floatValue:(id)value def:(CGFloat) def;

@end


@interface NSTimer (Blocks)
+(id)scheduledTimerWithTimeInterval:(NSTimeInterval)inTimeInterval block:(void (^)())inBlock repeats:(BOOL)inRepeats;

@end
