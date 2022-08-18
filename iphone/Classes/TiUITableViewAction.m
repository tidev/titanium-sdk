/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITABLEVIEW

#import "TiUITableViewAction.h"
#import <TitaniumKit/TiBase.h>
#import <TitaniumKit/TiUtils.h>

@implementation TiUITableViewAction

@synthesize animation, obj, type;

- (void)dealloc
{
  RELEASE_TO_NIL(obj);
  [super dealloc];
}

+ (UITableViewRowAnimation)animationStyleForProperties:(NSDictionary *)properties
{
  BOOL found;
  UITableViewRowAnimation animationStyle = [TiUtils intValue:@"animationStyle" properties:properties def:UITableViewRowAnimationNone exists:&found];
  if (found) {
    return animationStyle;
  }
  BOOL animate = [TiUtils boolValue:@"animated" properties:properties def:NO];
  return animate ? UITableViewRowAnimationFade : UITableViewRowAnimationNone;
}

- (id)initWithObject:(id)obj_ animation:(NSDictionary *)animation_ type:(TiUITableViewActionType)type_
{
  if (self = [self init]) {
    animation = [TiUITableViewAction animationStyleForProperties:animation_];
    type = type_;
    obj = [obj_ retain];
  }
  return self;
}

@end

#endif
