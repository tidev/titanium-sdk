/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIBUTTON

#import "TiUIButtonProxy.h"
#import "TiUIButton.h"
#import "TiUINavBarButton.h"
#import <TitaniumKit/TiUtils.h>

@implementation TiUIButtonProxy

- (void)_destroy
{
  RELEASE_TO_NIL(button);
  toolbar = nil;
  [super _destroy];
}

- (void)_configure
{
  [self replaceValue:NUMBOOL(YES) forKey:@"enabled" notification:NO];
  [super _configure];
}

- (NSMutableDictionary *)langConversionTable
{
  return [NSMutableDictionary dictionaryWithObject:@"title" forKey:@"titleid"];
}

- (void)setStyle:(id)value
{
  styleCache = [TiUtils intValue:value def:UIButtonTypeCustom];
  [self replaceValue:value forKey:@"style" notification:YES];
}

- (NSString *)apiName
{
  return @"Ti.UI.Button";
}

- (UIBarButtonItem *)barButtonItem
{
  /*
	id backgroundImageValue = [self valueForKey:@"backgroundImage"];
	if (!IS_NULL_OR_NIL(backgroundImageValue))
	{
		return [super barButtonItem];
	}
	*/

  if (button == nil || !isUsingBarButtonItem) {
    isUsingBarButtonItem = YES;
    if (button == nil) {
      button = [[TiUINavBarButton alloc] initWithProxy:self];
    }
  }
  return button;
}

- (UIViewAutoresizing)verifyAutoresizing:(UIViewAutoresizing)suggestedResizing
{
  switch ((int)styleCache) {
  case UITitaniumNativeItemInfoLight:
  case UITitaniumNativeItemInfoDark:
  case UITitaniumNativeItemDisclosure:
    return suggestedResizing & ~(UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight);
  default: {
    break;
  }
  }
  return suggestedResizing;
}

- (BOOL)optimizeSubviewInsertion
{
  return YES;
}

#ifndef TI_USE_AUTOLAYOUT
- (UIView *)parentViewForChild:(TiViewProxy *)child
{
  return [(TiUIButton *)[self view] viewGroupWrapper];
}
#endif

- (void)removeBarButtonView
{
  // If we remove the button here, it could be the case that the system
  // sends a message to a released UIControl on the interior of the button,
  // causing a crash. Very timing-dependent.

  //	RELEASE_TO_NIL(button);
  [super removeBarButtonView];
}

- (void)setToolbar:(id<TiToolbar>)toolbar_
{
  toolbar = toolbar_;
}

- (id<TiToolbar>)toolbar
{
  return [[toolbar retain] autorelease];
}

- (BOOL)attachedToToolbar
{
  return toolbar != nil;
}

//TODO: Remove when deprecated
- (void)fireEvent:(NSString *)type withObject:(id)obj withSource:(id)source propagate:(BOOL)propagate reportSuccess:(BOOL)report errorCode:(int)code message:(NSString *)message;
{
  if (![TiUtils boolValue:[self valueForKey:@"enabled"] def:YES]) {
    //Rogue event. We're supposed to be disabled!
    return;
  }
  [super fireEvent:type withObject:obj withSource:source propagate:propagate reportSuccess:report errorCode:code message:message];
}

- (void)fireEvent:(NSString *)type withObject:(id)obj propagate:(BOOL)propagate reportSuccess:(BOOL)report errorCode:(NSInteger)code message:(NSString *)message;
{
  if (![TiUtils boolValue:[self valueForKey:@"enabled"] def:YES]) {
    //Rogue event. We're supposed to be disabled!
    return;
  }
  [super fireEvent:type withObject:obj propagate:propagate reportSuccess:report errorCode:code message:message];
}

#ifndef TI_USE_AUTOLAYOUT
- (TiDimension)defaultAutoWidthBehavior:(id)unused
{
  return TiDimensionAutoSize;
}
- (TiDimension)defaultAutoHeightBehavior:(id)unused
{
  return TiDimensionAutoSize;
}
#endif

USE_VIEW_FOR_CONTENT_HEIGHT
USE_VIEW_FOR_CONTENT_WIDTH

@end

#endif
