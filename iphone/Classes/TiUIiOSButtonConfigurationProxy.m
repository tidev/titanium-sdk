/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSBUTTONCONFIGURATION

#import "TiUIiOSButtonConfigurationProxy.h"
#import <TitaniumKit/TiBase.h>
#import <TitaniumKit/TiUtils.h>
#ifdef USE_TI_UIATTRIBUTEDSTRING
#import "TiUIAttributedStringProxy.h"
#endif
#import <UIKit/UIKit.h>

@implementation TiUIiOSButtonConfigurationProxy

- (NSString *)apiName
{
  return @"Ti.UI.iOS.ButtonConfiguration";
}

- (NSArray *)keySequence
{
  return @[ @"style" ];
}

- (void)setStyle:(NSString *)style
{
  if ([style isEqualToString:@"plain"]) {
    _configuration = UIButtonConfiguration.plainButtonConfiguration;
  } else if ([style isEqualToString:@"tinted"]) {
    _configuration = UIButtonConfiguration.tintedButtonConfiguration;
  } else if ([style isEqualToString:@"filled"]) {
    _configuration = UIButtonConfiguration.filledButtonConfiguration;
  } else if ([style isEqualToString:@"gray"]) {
    _configuration = UIButtonConfiguration.grayButtonConfiguration;
  } else if ([style isEqualToString:@"borderless"]) {
    _configuration = UIButtonConfiguration.borderlessButtonConfiguration;
  } else if ([style isEqualToString:@"bordered"]) {
    _configuration = UIButtonConfiguration.borderedButtonConfiguration;
  } else if ([style isEqualToString:@"borderedTinted"]) {
    _configuration = UIButtonConfiguration.borderedTintedButtonConfiguration;
  } else if ([style isEqualToString:@"borderedProminent"]) {
    _configuration = UIButtonConfiguration.borderedProminentButtonConfiguration;
#if IS_SDK_IOS_26
  } else if (@available(iOS 26.0, *)) {
    if ([style isEqualToString:@"glass"]) {
      _configuration = UIButtonConfiguration.glassButtonConfiguration;
    } else if ([style isEqualToString:@"prominentGlass"]) {
      _configuration = UIButtonConfiguration.prominentGlassButtonConfiguration;
    } else if ([style isEqualToString:@"clearGlass"]) {
      _configuration = UIButtonConfiguration.clearGlassButtonConfiguration;
    } else if ([style isEqualToString:@"prominentClearGlass"]) {
      _configuration = UIButtonConfiguration.prominentClearGlassButtonConfiguration;
    }
#endif
  }

  if (_configuration == nil) {
    _configuration = UIButtonConfiguration.plainButtonConfiguration;
  }

  [_configuration retain];
}

- (void)setTitle:(NSString *)title
{
  _configuration.title = title;
}

- (void)setSubtitle:(NSString *)subtitle
{
  _configuration.subtitle = subtitle;
}

- (void)setLoading:(NSNumber *)loading
{
  _configuration.showsActivityIndicator = loading.boolValue;
}

- (void)setBackgroundColor:(id)backgroundColor
{
  UIColor *color = [TiUtils colorValue:backgroundColor].color;
  _configuration.baseBackgroundColor = color;

  self.baseBackgroundColor = color;
}

- (void)setBackgroundSelectedColor:(id)backgroundSelectedColor
{
  UIColor *color = [TiUtils colorValue:backgroundSelectedColor].color;
  self.baseBackgroundSelectedColor = color;
}

- (void)setColor:(id)color
{
  _configuration.baseForegroundColor = [TiUtils colorValue:color].color;
}

- (void)setImage:(id)image
{
  _configuration.image = [TiUtils image:image proxy:self];
}

- (void)setPadding:(NSDictionary *)padding
{
  UIEdgeInsets insets = [TiUtils contentInsets:padding];
  _configuration.contentInsets = NSDirectionalEdgeInsetsMake(insets.top, insets.left, insets.bottom, insets.right);
}

- (void)setImagePlacement:(NSString *)imagePlacement
{
  if ([imagePlacement isEqualToString:@"leading"]) {
    _configuration.imagePlacement = NSDirectionalRectEdgeLeading;
  } else if ([imagePlacement isEqualToString:@"trailing"]) {
    _configuration.imagePlacement = NSDirectionalRectEdgeTrailing;
  } else if ([imagePlacement isEqualToString:@"top"]) {
    _configuration.imagePlacement = NSDirectionalRectEdgeTop;
  } else if ([imagePlacement isEqualToString:@"bottom"]) {
    _configuration.imagePlacement = NSDirectionalRectEdgeBottom;
  }
}

- (void)setImagePadding:(NSNumber *)imagePadding
{
  _configuration.imagePadding = imagePadding.floatValue;
}

- (void)setTitlePadding:(NSNumber *)titlePadding
{
  _configuration.titlePadding = titlePadding.floatValue;
}

- (void)setFont:(id)font
{
  if (![TiUtils isIOSVersionOrGreater:@"15.0"]) {
    NSLog(@"[ERROR] Setting \"font\" on the buttonConfiguration is only supported on iOS 15+");
    return;
  }

  WebFont *f = [TiUtils fontValue:font def:nil];
  if (f == nil) {
    return;
  }

  if (@available(iOS 15.0, *)) {
    UIFont *uiFont = [f font];
    _configuration.titleTextAttributesTransformer = ^NSDictionary<NSAttributedStringKey, id> *_Nonnull(NSDictionary<NSAttributedStringKey, id> *_Nonnull textAttributes)
    {
      NSMutableDictionary *attrs = [textAttributes mutableCopy];
      if (uiFont != nil) {
        attrs[NSFontAttributeName] = uiFont;
      }
      return [attrs copy];
    };
  }
}

- (void)setAttributedString:(id)arg
{
#ifdef USE_TI_UIATTRIBUTEDSTRING
  ENSURE_SINGLE_ARG(arg, TiUIAttributedStringProxy);
  _configuration.attributedTitle = [arg attributedString];
#endif
}

- (void)setTextAlign:(id)align
{
  if (![TiUtils isIOSVersionOrGreater:@"15.0"]) {
    NSLog(@"[ERROR] Setting \"textAlign\" on the buttonConfiguration is only supported on iOS 15+");
    return;
  }

  UIButtonConfigurationTitleAlignment alignment = UIButtonConfigurationTitleAlignmentAutomatic;

  NSTextAlignment ta = [TiUtils textAlignmentValue:align];
  switch (ta) {
  case NSTextAlignmentLeft:
    alignment = UIButtonConfigurationTitleAlignmentLeading;
    break;
  case NSTextAlignmentRight:
    alignment = UIButtonConfigurationTitleAlignmentTrailing;
    break;
  case NSTextAlignmentCenter:
  default:
    alignment = UIButtonConfigurationTitleAlignmentCenter;
    break;
  }

  _configuration.titleAlignment = alignment;
}

@end

#endif
