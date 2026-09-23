/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSPREVIEWCONTEXT

#import "TiUIiOSPreviewActionGroupProxy.h"

@implementation TiUIiOSPreviewActionGroupProxy

- (void)_initWithProperties:(NSDictionary *)properties
{
  [self setTitle:[TiUtils stringValue:[properties valueForKey:@"title"]]];
  [self setStyle:[TiUtils intValue:[properties valueForKey:@"style"] def:UIPreviewActionStyleDefault]];
  [self setActions:[NSMutableArray array]];

  int index = 0;

  for (TiUIiOSPreviewActionProxy *action in [properties valueForKey:@"actions"]) {
    [action rememberSelf];
    [action setActionIndex:index];

    [[self actions] addObject:[action action]];

    index++;
  }

  actionGroup = [[UIPreviewActionGroup actionGroupWithTitle:[self title] style:[self style] actions:[self actions]] retain];

  [super _initWithProperties:properties];
}

- (void)dealloc
{
  RELEASE_TO_NIL(_title);
  RELEASE_TO_NIL(_actions);
  RELEASE_TO_NIL(actionGroup);

  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.UI.iOS.PreviewActionGroup";
}

- (UIPreviewActionGroup *)actionGroup
{
  return actionGroup;
}

@end
#endif
