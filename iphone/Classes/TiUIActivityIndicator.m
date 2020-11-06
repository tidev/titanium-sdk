/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIACTIVITYINDICATOR

#import "TiUIActivityIndicator.h"
#import <TitaniumKit/TiUtils.h>
#import <TitaniumKit/TiViewProxy.h>
#import <TitaniumKit/WebFont.h>
#import <TitaniumKit/Webcolor.h>

@implementation TiUIActivityIndicator

#ifdef TI_USE_AUTOLAYOUT
- (void)initializeTiLayoutView
{
  [super initializeTiLayoutView];
  [self setDefaultHeight:TiDimensionAutoSize];
  [self setDefaultWidth:TiDimensionAutoSize];
}
#endif

- (id)init
{
  self = [super init];
  if (self != nil) {
    style = UIActivityIndicatorViewStyleWhite;
    [self setHidden:YES];
#ifdef TI_USE_AUTOLAYOUT
    backgroundView = [[UIView alloc] init];
    [self addSubview:backgroundView];
#endif
  }
  return self;
}

- (void)dealloc
{
  RELEASE_TO_NIL(indicatorView);
  RELEASE_TO_NIL(messageLabel);
  RELEASE_TO_NIL(fontDesc);
  RELEASE_TO_NIL(textColor);
  RELEASE_TO_NIL(spinnerColor);
#ifdef TI_USE_AUTOLAYOUT
  RELEASE_TO_NIL(backgroundView);
#endif
  [super dealloc];
}

#ifndef TI_USE_AUTOLAYOUT
- (CGSize)sizeThatFits:(CGSize)testSize;
{
  CGSize spinnySize = [[self indicatorView] sizeThatFits:CGSizeZero];
  if (messageLabel == nil) {
    return spinnySize;
  }
  CGSize messageSize = [messageLabel sizeThatFits:CGSizeZero];

  return CGSizeMake(spinnySize.width + 5 + messageSize.width, MAX(spinnySize.height, messageSize.height));
}

- (void)layoutSubviews
{
  if (indicatorView == nil) {
    return;
  }

  CGRect boundsRect = [self bounds];
  CGPoint centerPoint = CGPointMake(boundsRect.origin.x + (boundsRect.size.width / 2),
      boundsRect.origin.y + (boundsRect.size.height / 2));

  if (messageLabel == nil) {
    [indicatorView setCenter:centerPoint];
    return;
  }

  CGSize spinnySize = [[self indicatorView] sizeThatFits:CGSizeZero];
  CGSize messageSize = [messageLabel sizeThatFits:CGSizeZero];

  float fittingWidth = spinnySize.width + messageSize.width + 5;

  [indicatorView setCenter:CGPointMake(centerPoint.x - (fittingWidth - spinnySize.width) / 2, centerPoint.y)];

  [messageLabel setBounds:CGRectMake(0, 0, messageSize.width, messageSize.height)];
  [messageLabel setCenter:CGPointMake(centerPoint.x + (fittingWidth - messageSize.width) / 2, centerPoint.y)];
}
#endif
- (UIActivityIndicatorView *)indicatorView
{
  if (indicatorView == nil) {
    indicatorView = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:style];
    //TIMOB-17572. When a cell is reused all animations are removed. That will hide the
    //ActivityIndicator. Setting it to false ensures that visibility is controlled by the
    //visible property of the ActivityIndicator (initialized to false)
    [indicatorView setHidesWhenStopped:NO];
    if (spinnerColor != nil) {
      [indicatorView setColor:spinnerColor];
    }
    [self setNeedsLayout];
#ifdef TI_USE_AUTOLAYOUT
    [backgroundView addSubview:indicatorView];

#else
    [self addSubview:indicatorView];
#endif
  }
  return indicatorView;
}

- (UILabel *)messageLabel
{
  if (messageLabel == nil) {
    messageLabel = [[UILabel alloc] init];
    [messageLabel setBackgroundColor:[UIColor clearColor]];

    if (fontDesc != nil) {
      [messageLabel setFont:[fontDesc font]];
    }

    if (textColor != nil) {
      [messageLabel setTextColor:textColor];
    }

#ifdef TI_USE_AUTOLAYOUT
    [messageLabel setTranslatesAutoresizingMaskIntoConstraints:NO];
    [backgroundView addSubview:messageLabel];
#else
    [self setNeedsLayout];
    [self addSubview:messageLabel];
#endif
  }
  return messageLabel;
}

- (id)accessibilityElement
{
  return [self messageLabel];
}

#ifndef TI_USE_AUTOLAYOUT
- (void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
  [self setNeedsLayout];
  [super frameSizeChanged:frame bounds:bounds];
}
#endif

#pragma mark View controller stuff

- (void)setVisible_:(id)visible
{
  if ([TiUtils boolValue:visible]) {
    [[self indicatorView] startAnimating];
    [self setHidden:NO];
  } else {
    [indicatorView stopAnimating];
    [self setHidden:YES];
  }
}

- (void)setFont_:(id)value
{
  WebFont *newFont = [TiUtils fontValue:value def:nil];
  if ((newFont == fontDesc) || ([fontDesc isEqual:newFont])) {
    return;
  }

  if (newFont == nil) {
    newFont = [WebFont defaultFont];
  }

  [fontDesc release];
  fontDesc = [newFont retain];

  if (messageLabel != nil) {
    [messageLabel setFont:[fontDesc font]];
  }
}

- (void)setColor_:(id)value
{
  UIColor *newColor = [[TiUtils colorValue:value] _color];
  [textColor release];
  textColor = [newColor retain];
  if (messageLabel != nil) {
    if (textColor == nil) {
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
      [messageLabel setTextColor:[TiUtils isIOSVersionOrGreater:@"13.0"] ? UIColor.labelColor : UIColor.blackColor];
#else
      [messageLabel setTextColor:UIColor.blackColor];
#endif
    } else {
      [messageLabel setTextColor:textColor];
    }
  }
}

- (void)setMessage_:(id)value
{
  NSString *text = [TiUtils stringValue:value];
  if ([text length] > 0) {
    [[self messageLabel] setText:text];
  } else {
    [messageLabel removeFromSuperview];
    RELEASE_TO_NIL(messageLabel);
  }
  [self setNeedsLayout];
}

- (void)setStyle_:(id)value
{
  int newStyle = [TiUtils intValue:value];

  if (style == newStyle) {
    return;
  }

  style = newStyle;

#ifndef TI_USE_AUTOLAYOUT
  if (indicatorView != nil) {
    [indicatorView setActivityIndicatorViewStyle:style];
    CGRect newBounds;
    newBounds.origin = CGPointZero;
    newBounds.size = [indicatorView sizeThatFits:CGSizeZero];
    [indicatorView setBounds:newBounds];
    if (messageLabel != nil) {
      [self setNeedsLayout];
    }
    if (spinnerColor != nil) {
      [indicatorView setColor:spinnerColor];
    }
  }
#endif
}

- (void)setIndicatorColor_:(id)value
{
  UIColor *newColor = [[TiUtils colorValue:value] _color];
  [spinnerColor release];
  spinnerColor = [newColor retain];
  [[self indicatorView] setColor:spinnerColor];
}

#ifdef TI_USE_AUTOLAYOUT
- (void)updateConstraints
{
  if (!_constraintsAdded) {
    _constraintsAdded = YES;
    messageLabel = [self messageLabel];
    indicatorView = [self indicatorView];
    NSDictionary *views = NSDictionaryOfVariableBindings(indicatorView, messageLabel, backgroundView);
    [backgroundView addConstraints:TI_CONSTR(@"H:|[indicatorView]-[messageLabel]|", views)];

    // Make the backgroundView as small as the biggest of the two
    [backgroundView addConstraints:TI_CONSTR(@"V:|-(>=0)-[messageLabel]-(>=0)-|", views)];
    [backgroundView addConstraints:TI_CONSTR(@"V:|-(>=0)-[indicatorView]-(>=0)-|", views)];
    // Center both verically
    [backgroundView addConstraint:[NSLayoutConstraint constraintWithItem:messageLabel
                                                               attribute:NSLayoutAttributeCenterY
                                                               relatedBy:NSLayoutRelationEqual
                                                                  toItem:backgroundView
                                                               attribute:NSLayoutAttributeCenterY
                                                              multiplier:1
                                                                constant:0]];
    // FIX : TIMOB-20513
    TiThreadPerformOnMainThread(
        ^{
          [self updateIndicatorViewFrame];
        },
        NO);
  }
  [super updateConstraints];
}

- (void)updateIndicatorViewFrame
{
  CGRect rect = indicatorView.frame;
  CGFloat yPos = (backgroundView.frame.size.height - indicatorView.frame.size.height) / 2.0;
  rect.origin.y = yPos > 0 ? yPos : rect.origin.y;
  indicatorView.frame = rect;
}

#endif
- (void)didMoveToWindow
{
#ifdef TI_USE_AUTOLAYOUT
  messageLabel = [self messageLabel];
  indicatorView = [self indicatorView];
#endif
  //TIMOB-15293
  if (([self window] != nil) && (indicatorView != nil) && (![indicatorView isAnimating])) {
    BOOL visible = [TiUtils boolValue:[[self proxy] valueForKey:@"visible"] def:NO];
    if (visible) {
      [indicatorView startAnimating];
    }
  }
  [super didMoveToWindow];
}

#ifndef TI_USE_AUTOLAYOUT
- (CGFloat)contentWidthForWidth:(CGFloat)suggestedWidth
{
  return [self sizeThatFits:CGSizeZero].width;
}

- (CGFloat)contentHeightForWidth:(CGFloat)width
{
  return [self sizeThatFits:CGSizeZero].height;
}
#endif

@end

#endif
