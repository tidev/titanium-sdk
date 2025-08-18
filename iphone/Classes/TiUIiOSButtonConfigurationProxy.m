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
  } else if (@available(iOS 26.0, *)) {
#if IS_SDK_IOS_26
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

- (void)setBackgroundColor:(id)backgroundColor
{
  _configuration.baseBackgroundColor = [TiUtils colorValue:backgroundColor].color;
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

@end

#endif
