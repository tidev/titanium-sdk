/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UILISTVIEW

#import "TiUIListItem.h"
#import <TitaniumKit/ImageLoader.h>
#import <TitaniumKit/TiApp.h>
#import <TitaniumKit/TiUtils.h>
#import <TitaniumKit/TiViewProxy.h>
#import <TitaniumKit/Webcolor.h>
#ifdef USE_TI_UIACTIVITYINDICATOR
#import "TiUIActivityIndicator.h"
#endif

@implementation TiUIListItem {
  TiUIListItemProxy *_proxy;
  NSInteger _templateStyle;
  NSMutableDictionary *_initialValues;
  NSMutableDictionary *_currentValues;
  NSMutableSet *_resetKeys;
  NSDictionary *_dataItem;
  NSDictionary *_bindings;
  int _positionMask;
  BOOL _grouped;
  UIView *_bgView;
}

@synthesize templateStyle = _templateStyle;
@synthesize proxy = _proxy;
@synthesize dataItem = _dataItem;

- (id)initWithStyle:(UITableViewCellStyle)style reuseIdentifier:(NSString *)reuseIdentifier proxy:(TiUIListItemProxy *)proxy
{
  self = [super initWithStyle:style reuseIdentifier:reuseIdentifier];
  if (self) {
    _templateStyle = style;
    _initialValues = [[NSMutableDictionary alloc] initWithCapacity:5];
    _currentValues = [[NSMutableDictionary alloc] initWithCapacity:5];
    _resetKeys = [[NSMutableSet alloc] initWithCapacity:5];
    _proxy = [proxy retain];
    _proxy.listItem = self;
  }
  return self;
}

- (id)initWithProxy:(TiUIListItemProxy *)proxy reuseIdentifier:(NSString *)reuseIdentifier
{
  self = [super initWithStyle:UITableViewCellStyleDefault reuseIdentifier:reuseIdentifier];
  if (self) {
    _templateStyle = TiUIListItemTemplateStyleCustom;
    _initialValues = [[NSMutableDictionary alloc] initWithCapacity:10];
    _currentValues = [[NSMutableDictionary alloc] initWithCapacity:10];
    _resetKeys = [[NSMutableSet alloc] initWithCapacity:10];
    _proxy = [proxy retain];
    _proxy.listItem = self;
  }
  return self;
}

- (void)dealloc
{
  _proxy.listItem = nil;
  [_initialValues release];
  [_currentValues release];
  [_resetKeys release];
  [_dataItem release];
  [_proxy deregisterProxy:[_proxy pageContext]];
  [_proxy release];
  [_bindings release];
  [gradientLayer release];
  [backgroundGradient release];
  [selectedBackgroundGradient release];
  [_bgView removeFromSuperview];
  [_bgView release];
  [super dealloc];
}

- (NSDictionary *)bindings
{
  if (_bindings == nil) {
    NSMutableDictionary *dict = [[NSMutableDictionary alloc] initWithCapacity:10];
    [[self class] buildBindingsForViewProxy:_proxy intoDictionary:dict];
    _bindings = [dict copy];
    [dict release];
  }
  return _bindings;
}

- (void)prepareForReuse
{
  RELEASE_TO_NIL(_dataItem);
  [super prepareForReuse];

#ifdef USE_TI_UIACTIVITYINDICATOR
  // TIMOB-17572: Attempt to resume activity indicator animation to reuse cell
  // Use this workaroud until iOS is smart enough to retain the animation state itself
  if (self.subviews.firstObject != nil) {
    UIView *container = self.subviews.firstObject;
    [[container subviews] enumerateObjectsUsingBlock:^(__kindof UIView *_Nonnull obj, NSUInteger idx, BOOL *_Nonnull stop) {
      if ([obj isKindOfClass:[TiUIActivityIndicator class]]) {
        UIActivityIndicatorView *activityIndicator = [(TiUIActivityIndicator *)obj indicatorView];
        [activityIndicator startAnimating];
        *stop = YES;
      }
    }];
  }
#endif
}

- (void)layoutSubviews
{
  if (_bgView != nil) {
    if ([_bgView superview] == nil) {
      [self.backgroundView addSubview:_bgView];
    }
    CGRect bounds = [self.backgroundView bounds];
    if ((_positionMask == TiCellBackgroundViewPositionTop) || (_positionMask == TiCellBackgroundViewPositionSingleLine)) {
      [_bgView setFrame:CGRectMake(0, 1, bounds.size.width, bounds.size.height - 2)];
    } else {
      [_bgView setFrame:bounds];
    }
    [_bgView setNeedsDisplay];
  } else if ([self.backgroundView isKindOfClass:[TiSelectedCellBackgroundView class]]) {
    [self.backgroundView setNeedsDisplay];
  }
  [super layoutSubviews];
  if (_templateStyle == TiUIListItemTemplateStyleCustom) {
// prevent any crashes that could be caused by unsupported layouts
#ifndef TI_USE_AUTOLAYOUT
    _proxy.layoutProperties->layoutStyle = TiLayoutRuleAbsolute;
    [_proxy layoutChildren:NO];
#endif
  }

  if (gradientLayer) {
    [gradientLayer setFrame:[self bounds]];
  }
}

//TIMOB-17373. Workaround for separators disappearing on iOS7 and above
- (void)ensureVisibleSelectorWithTableView:(UITableView *)tableView
{
  if ([self selectedOrHighlighted]) {
    return;
  }
  UITableView *attachedTableView = tableView;
  UIView *superView = [self superview];
  while (attachedTableView == nil && superView != nil) {
    if ([superView isKindOfClass:[UITableView class]]) {
      attachedTableView = (UITableView *)superView;
    }
    superView = [superView superview];
  }

  if (attachedTableView != nil && attachedTableView.separatorStyle != UITableViewCellSeparatorStyleNone) {
    for (UIView *subview in self.contentView.superview.subviews) {
      if ([NSStringFromClass(subview.class) hasSuffix:@"SeparatorView"]) {
        subview.hidden = NO;
      }
    }
  }
}

#pragma mark - Background Support
- (BOOL)selectedOrHighlighted
{
  return [self isSelected] || [self isHighlighted];
}

- (void)updateGradientLayer:(BOOL)useSelected withAnimation:(BOOL)animated
{
  TiGradient *currentGradient = useSelected ? selectedBackgroundGradient : backgroundGradient;

  if (currentGradient == nil) {
    [gradientLayer removeFromSuperlayer];
    //Because there's the chance that the other state still has the gradient, let's keep it around.
    return;
  }

  if (gradientLayer == nil) {
    gradientLayer = [[TiGradientLayer alloc] init];
    [gradientLayer setNeedsDisplayOnBoundsChange:YES];
    // Gradient frame will be set when laying out subviews.
  }
  [gradientLayer setGradient:currentGradient];

  CALayer *ourLayer = [[[self contentView] layer] superlayer];

  if ([gradientLayer superlayer] != ourLayer) {
    CALayer *contentLayer = [[self contentView] layer];
    [ourLayer insertSublayer:gradientLayer below:contentLayer];
  }
  if (animated) {
    CABasicAnimation *flash = [CABasicAnimation animationWithKeyPath:@"opacity"];
    flash.fromValue = [NSNumber numberWithFloat:0.0];
    flash.toValue = [NSNumber numberWithFloat:1.0];
    flash.duration = 1.0;
    [gradientLayer addAnimation:flash forKey:@"flashAnimation"];
  }
  [gradientLayer setNeedsDisplay];
}

- (void)setSelected:(BOOL)yn animated:(BOOL)animated
{
  [super setSelected:yn animated:animated];
  [self updateGradientLayer:yn | [self isHighlighted] withAnimation:animated];
}

- (void)setHighlighted:(BOOL)yn animated:(BOOL)animated
{
  [super setHighlighted:yn animated:animated];
  [self updateGradientLayer:yn | [self isSelected] withAnimation:animated];
}

- (void)setBackgroundGradient_:(id)value
{
  TiGradient *newGradient = [TiGradient gradientFromObject:value proxy:_proxy];
  if (newGradient == backgroundGradient) {
    return;
  }
  [backgroundGradient release];
  backgroundGradient = [newGradient retain];

  if (![self selectedOrHighlighted]) {
    [self updateGradientLayer:NO withAnimation:NO];
  }
}

- (void)setSelectedBackgroundGradient_:(id)value
{
  TiGradient *newGradient = [TiGradient gradientFromObject:value proxy:_proxy];
  if (newGradient == selectedBackgroundGradient) {
    return;
  }
  [selectedBackgroundGradient release];
  selectedBackgroundGradient = [newGradient retain];

  if ([self selectedOrHighlighted]) {
    [self updateGradientLayer:YES withAnimation:NO];
  }
}

- (void)setPosition:(int)position isGrouped:(BOOL)grouped
{
  _positionMask = position;
  _grouped = grouped;
}

- (void)applyBackgroundWithSelectedColor:(id)selectedBackgroundColor selectedImage:(id)selectedBackgroundImage
{
  if (!selectedBackgroundColor && !selectedBackgroundImage) {
    return; // Ignore custom selection styles for native selections
  }

  UIColor *sbgColor = (selectedBackgroundColor != nil) ? ([[TiUtils colorValue:selectedBackgroundColor] _color]) : nil;
  UIImage *sbgImage = [[ImageLoader sharedLoader] loadImmediateStretchableImage:[TiUtils toURL:selectedBackgroundImage proxy:_proxy] withLeftCap:TiDimensionAuto topCap:TiDimensionAuto];
  if (sbgImage != nil) {
    if ([self.selectedBackgroundView isKindOfClass:[UIImageView class]]) {
      [(UIImageView *)self.selectedBackgroundView setImage:sbgImage];
      [(UIImageView *)self.selectedBackgroundView setBackgroundColor:((sbgColor == nil) ? [UIColor clearColor] : sbgColor)];
    } else {
      UIImageView *view_ = [[[UIImageView alloc] initWithFrame:CGRectZero] autorelease];
      [view_ setImage:sbgImage];
      [view_ setBackgroundColor:((sbgColor == nil) ? [UIColor clearColor] : sbgColor)];
      self.selectedBackgroundView = view_;
    }
  } else {
    if (![self.selectedBackgroundView isKindOfClass:[TiSelectedCellBackgroundView class]]) {
      self.selectedBackgroundView = [[[TiSelectedCellBackgroundView alloc] initWithFrame:CGRectZero] autorelease];
    }
    TiSelectedCellBackgroundView *selectedBGView = (TiSelectedCellBackgroundView *)self.selectedBackgroundView;
    selectedBGView.grouped = _grouped;
    if (sbgColor == nil) {
      switch (self.selectionStyle) {
      case UITableViewCellSelectionStyleGray:
        sbgColor = [Webcolor webColorNamed:@"#d9d9d9"];
        break;
      case UITableViewCellSelectionStyleNone:
        sbgColor = [UIColor clearColor];
        break;
      case UITableViewCellSelectionStyleBlue:
        sbgColor = [Webcolor webColorNamed:@"#0272ed"];
        break;
      default:
        sbgColor = [Webcolor webColorNamed:@"#e0e0e0"];
        break;
      }
    }
    selectedBGView.fillColor = sbgColor;
    [selectedBGView setPosition:_positionMask];
  }
}

- (BOOL)compareDataItemValue:(NSString *)theKey withItem:(NSDictionary *)otherItem
{
  id propertiesValue = [_dataItem objectForKey:@"properties"];
  NSDictionary *properties = ([propertiesValue isKindOfClass:[NSDictionary class]]) ? propertiesValue : nil;
  id curValue = [properties objectForKey:theKey];

  propertiesValue = [otherItem objectForKey:@"properties"];
  properties = ([propertiesValue isKindOfClass:[NSDictionary class]]) ? propertiesValue : nil;
  id otherValue = [properties objectForKey:theKey];
  return ((curValue == otherValue) || [curValue isEqual:otherValue]);
}

- (BOOL)canApplyDataItem:(NSDictionary *)otherItem;
{
  id template = [_dataItem objectForKey:@"template"];
  id otherTemplate = [otherItem objectForKey:@"template"];
  BOOL same = (template == otherTemplate) || [template isEqual:otherTemplate];
  if (same) {
    same = [self compareDataItemValue:@"height" withItem:otherItem];
  }
  //These properties are applied in willDisplayCell. So force reload.
  if (same) {
    same = [self compareDataItemValue:@"backgroundColor" withItem:otherItem];
  }
  if (same) {
    same = [self compareDataItemValue:@"backgroundImage" withItem:otherItem];
  }
  if (same) {
    same = [self compareDataItemValue:@"tintColor" withItem:otherItem];
  }
  return same;
}

- (void)configureCellBackground
{
  //Ensure that we store the default backgroundColor
  if ([_initialValues objectForKey:@"backgroundColor"] == nil) {
    id initialValue = nil;
    if (_templateStyle == TiUIListItemTemplateStyleCustom) {
      initialValue = [[TiUtils colorValue:[_proxy valueForKey:@"backgroundColor"]] color];
    }
    if (IS_NULL_OR_NIL(initialValue)) {
      initialValue = [self backgroundColor];
    }
    [_initialValues setObject:(initialValue != nil ? initialValue : [NSNull null]) forKey:@"backgroundColor"];
  }
  id propertiesValue = [_dataItem objectForKey:@"properties"];
  NSDictionary *properties = ([propertiesValue isKindOfClass:[NSDictionary class]]) ? propertiesValue : nil;
  id colorValue = [properties objectForKey:@"backgroundColor"];
  UIColor *color = colorValue != nil ? [[TiUtils colorValue:colorValue] _color] : nil;
  if (color == nil) {
    id initVal = [_initialValues objectForKey:@"backgroundColor"];
    if ([initVal isKindOfClass:[UIColor class]]) {
      color = initVal;
    } else {
      color = [[TiUtils colorValue:initVal] color];
    }
  }
  self.backgroundColor = color;

  //Ensure that we store the backgroundImage
  if ([_initialValues objectForKey:@"backgroundImage"] == nil) {
    id initialValue = nil;
    if (_templateStyle == TiUIListItemTemplateStyleCustom) {
      initialValue = [_proxy valueForKey:@"backgroundImage"];
    }
    [_initialValues setObject:(initialValue != nil ? initialValue : [NSNull null]) forKey:@"backgroundImage"];
  }
  id backgroundImage = [properties objectForKey:@"backgroundImage"];
  if (IS_NULL_OR_NIL(backgroundImage)) {
    backgroundImage = [_initialValues objectForKey:@"backgroundImage"];
  }
  UIImage *bgImage = [[ImageLoader sharedLoader] loadImmediateStretchableImage:[TiUtils toURL:backgroundImage proxy:_proxy] withLeftCap:TiDimensionAuto topCap:TiDimensionAuto];
  if (bgImage != nil) {
    //Set the backgroundView to ImageView and set its backgroundColor to bgColor
    if ([self.backgroundView isKindOfClass:[UIImageView class]]) {
      [(UIImageView *)self.backgroundView setImage:bgImage];
      [(UIImageView *)self.backgroundView setBackgroundColor:[UIColor clearColor]];
    } else {
      UIImageView *view_ = [[[UIImageView alloc] initWithFrame:CGRectZero] autorelease];
      [view_ setImage:bgImage];
      [view_ setBackgroundColor:[UIColor clearColor]];
      self.backgroundView = view_;
    }
  } else {
    self.backgroundView = nil;
  }
}

- (void)setDataItem:(NSDictionary *)dataItem
{
  _dataItem = [dataItem retain];
  [_resetKeys addObjectsFromArray:[_currentValues allKeys]];
  id propertiesValue = [dataItem objectForKey:@"properties"];
  NSDictionary *properties = ([propertiesValue isKindOfClass:[NSDictionary class]]) ? propertiesValue : nil;
  switch (_templateStyle) {
  case UITableViewCellStyleSubtitle:
  case UITableViewCellStyleValue1:
  case UITableViewCellStyleValue2:
    self.detailTextLabel.text = [[properties objectForKey:@"subtitle"] description];
    self.detailTextLabel.backgroundColor = [UIColor clearColor];

    id subtitleColor = [properties objectForKey:@"subtitleColor"];
    if ([self shouldUpdateValue:subtitleColor forKeyPath:@"detailTextLabel.textColor"]) {
      UIColor *color = subtitleColor != nil ? [[TiUtils colorValue:subtitleColor] _color] : nil;
      if (color != nil) {
        [self recordChangeValue:subtitleColor
                     forKeyPath:@"detailTextLabel.textColor"
                      withBlock:^{
                        [self.detailTextLabel setTextColor:color];
                      }];
      }
    }

    id selectedSubtitleColor = [properties objectForKey:@"selectedSubtitleColor"];
    if ([self shouldUpdateValue:selectedSubtitleColor forKeyPath:@"detailTextLabel.highlightedTextColor"]) {
      UIColor *color = selectedSubtitleColor != nil ? [[TiUtils colorValue:selectedSubtitleColor] _color] : nil;
      if (color != nil) {
        [self recordChangeValue:selectedSubtitleColor
                     forKeyPath:@"detailTextLabel.highlightedTextColor"
                      withBlock:^{
                        [self.detailTextLabel setHighlightedTextColor:color];
                      }];
      }
    }

  // pass through
  case UITableViewCellStyleDefault:
    self.textLabel.text = [[properties objectForKey:@"title"] description];
    self.textLabel.backgroundColor = [UIColor clearColor];
    if (_templateStyle != UITableViewCellStyleValue2) {
      id imageValue = [properties objectForKey:@"image"];
      if ([self shouldUpdateValue:imageValue forKeyPath:@"imageView.image"]) {
        NSURL *imageUrl = [TiUtils toURL:imageValue proxy:_proxy];
        UIImage *image = [[ImageLoader sharedLoader] loadImmediateImage:imageUrl];
        if (image != nil) {
          [self recordChangeValue:imageValue
                       forKeyPath:@"imageView.image"
                        withBlock:^{
                          self.imageView.image = image;
                        }];
        }
      }
    }

    id selectedColor = [properties objectForKey:@"selectedColor"];
    if ([self shouldUpdateValue:selectedColor forKeyPath:@"textLabel.highlightedTextColor"]) {
      UIColor *color = selectedColor != nil ? [[TiUtils colorValue:selectedColor] _color] : nil;
      if (color != nil) {
        [self recordChangeValue:selectedColor
                     forKeyPath:@"textLabel.highlightedTextColor"
                      withBlock:^{
                        [self.textLabel setHighlightedTextColor:color];
                      }];
      }
    }

    id fontValue = [properties objectForKey:@"font"];
    if ([self shouldUpdateValue:fontValue forKeyPath:@"textLabel.font"]) {
      UIFont *font = (fontValue != nil) ? [[TiUtils fontValue:fontValue] font] : nil;
      if (font != nil) {
        [self recordChangeValue:fontValue
                     forKeyPath:@"textLabel.font"
                      withBlock:^{
                        [self.textLabel setFont:font];
                      }];
      }
    }

    id colorValue = [properties objectForKey:@"color"];
    if ([self shouldUpdateValue:colorValue forKeyPath:@"textLabel.textColor"]) {
      UIColor *color = colorValue != nil ? [[TiUtils colorValue:colorValue] _color] : nil;
      if (color != nil) {
        [self recordChangeValue:colorValue
                     forKeyPath:@"textLabel.textColor"
                      withBlock:^{
                        [self.textLabel setTextColor:color];
                      }];
      }
    }
    break;

  default:
    [dataItem enumerateKeysAndObjectsUsingBlock:^(NSString *bindId, id dict, BOOL *stop) {
      if (![dict isKindOfClass:[NSDictionary class]] || [bindId isEqualToString:@"properties"]) {
        return;
      }
      id bindObject = [self valueForUndefinedKey:bindId];
      if (bindObject != nil) {
        BOOL reproxying = NO;
        if ([bindObject isKindOfClass:[TiProxy class]]) {
          [bindObject setReproxying:YES];
          reproxying = YES;
        }
        [(NSDictionary *)dict enumerateKeysAndObjectsUsingBlock:^(NSString *key, id value, BOOL *stop) {
          NSString *keyPath = [NSString stringWithFormat:@"%@.%@", bindId, key];
          if ([self shouldUpdateValue:value forKeyPath:keyPath] || [self shouldUpdateValue:value forKey:key withProxy:bindObject withKeyPath:keyPath]) {
            [self recordChangeValue:value
                         forKeyPath:keyPath
                          withBlock:^{
                            [bindObject setValue:value forKey:key];
                          }];
          }
        }];
        if (reproxying) {
          [bindObject setReproxying:NO];
        }
      }
    }];
    break;
  }
  id accessoryTypeValue = [properties objectForKey:@"accessoryType"];
  if ([self shouldUpdateValue:accessoryTypeValue forKeyPath:@"accessoryType"]) {
    if ([accessoryTypeValue isKindOfClass:[NSNumber class]]) {
      UITableViewCellAccessoryType accessoryType = [accessoryTypeValue unsignedIntegerValue];
      [self recordChangeValue:accessoryTypeValue
                   forKeyPath:@"accessoryType"
                    withBlock:^{
                      self.accessoryType = accessoryType;
                    }];
    }
  }
  id selectionStyleValue = [properties objectForKey:@"selectionStyle"];
  if ([self shouldUpdateValue:selectionStyleValue forKeyPath:@"selectionStyle"]) {
    if ([selectionStyleValue isKindOfClass:[NSNumber class]]) {
      UITableViewCellSelectionStyle selectionStyle = [selectionStyleValue unsignedIntegerValue];
      [self recordChangeValue:selectionStyleValue
                   forKeyPath:@"selectionStyle"
                    withBlock:^{
                      self.selectionStyle = selectionStyle;
                    }];
    }
  }

  id backgroundGradientValue = [properties objectForKey:@"backgroundGradient"];
  if (IS_NULL_OR_NIL(backgroundGradientValue)) {
    backgroundGradientValue = [_proxy valueForKey:@"backgroundGradient"];
  }
  [self setBackgroundGradient_:backgroundGradientValue];

  id selectedBackgroundGradientValue = [properties objectForKey:@"selectedBackgroundGradient"];
  if (IS_NULL_OR_NIL(selectedBackgroundGradientValue)) {
    selectedBackgroundGradientValue = [_proxy valueForKey:@"selectedBackgroundGradient"];
  }
  [self setSelectedBackgroundGradient_:selectedBackgroundGradientValue];

  id selectedbackgroundColorValue = [properties objectForKey:@"selectedBackgroundColor"];
  if (IS_NULL_OR_NIL(selectedbackgroundColorValue)) {
    selectedbackgroundColorValue = [_proxy valueForKey:@"selectedBackgroundColor"];
  }

  id selectedBackgroundImageValue = [properties objectForKey:@"selectedBackgroundImage"];
  if (IS_NULL_OR_NIL(selectedBackgroundImageValue)) {
    selectedBackgroundImageValue = [_proxy valueForKey:@"selectedBackgroundImage"];
  }
  [self applyBackgroundWithSelectedColor:selectedbackgroundColorValue selectedImage:selectedBackgroundImageValue];
  [_resetKeys enumerateObjectsUsingBlock:^(NSString *keyPath, BOOL *stop) {
    id value = [_initialValues objectForKey:keyPath];
    [self setValue:(value != [NSNull null] ? value : nil) forKeyPath:keyPath];
    [_currentValues removeObjectForKey:keyPath];
  }];
  [_resetKeys removeAllObjects];
}

- (id)valueForUndefinedKey:(NSString *)key
{
  return [self.bindings objectForKey:key];
}

- (void)recordChangeValue:(id)value forKeyPath:(NSString *)keyPath withBlock:(void (^)(void))block
{
  if ([_initialValues objectForKey:keyPath] == nil) {
    @try {
      id initialValue = [self valueForKeyPath:keyPath];
      [_initialValues setObject:(initialValue != nil ? initialValue : [NSNull null]) forKey:keyPath];
    } @catch (NSException *exception) {
      [[TiApp app] showModalError:[NSString stringWithFormat:@"The bindId \"%@\" is reserved by the system, please choose a different name and try again.", [[keyPath componentsSeparatedByString:@"."] firstObject]]];
    }
  }
  block();
  if (value != nil) {
    [_currentValues setObject:value forKey:keyPath];
  } else {
    [_currentValues removeObjectForKey:keyPath];
  }
  [_resetKeys removeObject:keyPath];
}

- (BOOL)shouldUpdateValue:(id)value forKey:(NSString *)key withProxy:(id)object withKeyPath:(NSString *)keyPath
{
  if ([object isKindOfClass:[TiProxy class]] && (key != nil)) {
    id current = [object valueForKey:key];
    BOOL sameValue = ((current == value) || [current isEqual:value]);
    if (sameValue) {
      [_resetKeys removeObject:keyPath];
    }
    return !sameValue;
  }
  return NO;
}

- (BOOL)shouldUpdateValue:(id)value forKeyPath:(NSString *)keyPath
{
  id current = [_currentValues objectForKey:keyPath];
  BOOL sameValue = ((current == value) || [current isEqual:value]);
  if (sameValue) {
    [_resetKeys removeObject:keyPath];
  }
  return !sameValue;
}

#pragma mark - Static

+ (void)buildBindingsForViewProxy:(TiViewProxy *)viewProxy intoDictionary:(NSMutableDictionary *)dict
{
  [viewProxy.children enumerateObjectsUsingBlock:^(TiViewProxy *childViewProxy, NSUInteger idx, BOOL *stop) {
    [[self class] buildBindingsForViewProxy:childViewProxy intoDictionary:dict];
  }];
  id bindId = [viewProxy valueForKey:@"bindId"];
  if (bindId != nil) {
    [dict setObject:viewProxy forKey:bindId];
  }
}

@end

#endif
