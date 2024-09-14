/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>

#define DEFINE_EXCEPTIONS
#define DebugLog NSLog

#if DEBUG
#define CODELOCATION [NSString stringWithFormat:@"%s (%@:%d)", __FUNCTION__, [[NSString stringWithFormat:@"%s", __FILE__] lastPathComponent], __LINE__]
#else
#define CODELOCATION @""
#endif
#define ENSURE_SINGLE_ARG(x, t)                                                                                                                                               \
  if ([x isKindOfClass:[NSArray class]] && [x count] > 0) {                                                                                                                   \
    x = (t *)[x objectAtIndex:0];                                                                                                                                             \
  }                                                                                                                                                                           \
  if (![x isKindOfClass:[t class]]) {                                                                                                                                         \
    @throw [NSException exceptionWithName:@"Invalid type passed to function" reason:[NSString stringWithFormat:@"expected: %@, was: %@", [t class], [x class]] userInfo:nil]; \
  }

/**
 Titanium orientation flags.
 */
typedef enum {
  TiOrientationNone = 0,
  TiOrientationAny = 0xFFFF,

  /**
     Portrait orientation flag.
     */
  TiOrientationPortrait = 1 << UIInterfaceOrientationPortrait,

  /**
     Upside-down portrait orientation flag.
     */
  TiOrientationPortraitUpsideDown = 1 << UIInterfaceOrientationPortraitUpsideDown,

  /**
     Landscape left orientation flag.
     */
  TiOrientationLandscapeLeft = 1 << UIInterfaceOrientationLandscapeLeft,

  /**
     Landscape right orientation flag.
     */
  TiOrientationLandscapeRight = 1 << UIInterfaceOrientationLandscapeRight,

  /**
     Landscape (left or right) orientation flag.
     */
  TiOrientationLandscapeOnly = TiOrientationLandscapeLeft | TiOrientationLandscapeRight,

  /**
     Portrait (normal or upside-down) orientation flag.
     */
  TiOrientationPortraitOnly = TiOrientationPortrait | TiOrientationPortraitUpsideDown,

} TiOrientationFlags;

@interface TiUtils : UIView

+ (void)setIsTesting:(BOOL)flag;
+ (BOOL)isTesting;
+ (int)dpi;
+ (BOOL)isIPad;
+ (BOOL)isRetinaDisplay;
+ (BOOL)isRetinaHDDisplay;
+ (BOOL)isIOS8OrGreater;
+ (CGFloat)floatValue:(id)value;
+ (CGFloat)floatValue:(id)value def:(CGFloat)def;
+ (void)setView:(UIView *)view positionRect:(CGRect)frameRect;
@end

@interface NSTimer (Blocks)
+ (id)scheduledTimerWithTimeInterval:(NSTimeInterval)inTimeInterval block:(void (^)())inBlock repeats:(BOOL)inRepeats;
+ (void)jdExecuteSimpleBlock:(NSTimer *)inTimer;
@end

@protocol LayoutAutosizing

@optional
- (CGFloat)contentWidthForWidth:(CGFloat)suggestedWidth;
- (CGFloat)contentHeightForWidth:(CGFloat)width;

@end
