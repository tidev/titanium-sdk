/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MEDIAVIDEOPLAYER

#import "TiMediaVideoPlayer.h"
#import <TitaniumKit/TiApp.h>
#import <TitaniumKit/TiUtils.h>
#import <TitaniumKit/TiViewProxy.h>
#import <TitaniumKit/TiWindowProxy.h>
#import <TitaniumKit/Webcolor.h>

@implementation TiMediaVideoPlayer

#ifdef TI_USE_AUTOLAYOUT
- (void)initializeTiLayoutView
{
  [super initializeTiLayoutView];
  [self setDefaultHeight:TiDimensionAutoFill];
  [self setDefaultWidth:TiDimensionAutoFill];
}
#endif

- (id)initWithPlayer:(AVPlayerViewController *)controller_ proxy:(TiProxy *)proxy_ loaded:(BOOL)loaded_
{
  if (self = [super init]) {
    loaded = loaded_;
    [self setProxy:proxy_];
    [self setMovie:controller_];
  }
  return self;
}

- (void)animationCompleted:(id)note
{
  if (spinner != nil) {
    [spinner stopAnimating];
    [spinner removeFromSuperview];
    RELEASE_TO_NIL(spinner);
  }
}

- (void)movieLoaded
{
  if (spinner != nil) {
    [UIView beginAnimations:@"movieAnimation" context:NULL];
    [UIView setAnimationDelegate:self];
    [UIView setAnimationDidStopSelector:@selector(animationCompleted:)];
    [UIView setAnimationDuration:0.7];
    [spinner setAlpha:0];
    [UIView commitAnimations];
  }

  loaded = YES;
}

- (void)setMovie:(AVPlayerViewController *)controller_
{
  if (controller_ == controller) {
    // don't add the movie more than once if the same
    return;
  }
  [[controller view] removeFromSuperview];
  [spinner removeFromSuperview];
  RELEASE_TO_NIL(spinner);
  RELEASE_TO_NIL(controller);

  if (controller_ == nil) {
    return;
  }
  controller = [controller_ retain];

  [self addSubview:[controller view]];
  [self sendSubviewToBack:[controller view]];

  [TiUtils setView:[controller view] positionRect:self.bounds];

  TiColor *bgcolor = [TiUtils colorValue:[self.proxy valueForKey:@"backgroundColor"]];
  UIActivityIndicatorViewStyle style = UIActivityIndicatorViewStyleGray;
  if (bgcolor != nil) {
    // check to see if the background is a dark color and if so, we want to
    // show the white indicator instead
    if ([Webcolor isDarkColor:[bgcolor _color]]) {
      style = UIActivityIndicatorViewStyleWhite;
    }
  }

  // show a spinner while the movie is loading so that the user
  // will know something is happening...

  if (!loaded) {
    if (spinner == nil) {
      spinner = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:style];
      spinner.autoresizingMask = UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleBottomMargin | UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleRightMargin;
      [spinner sizeToFit];
      [spinner setHidesWhenStopped:NO];

      [spinner startAnimating];
      spinner.center = [[controller view] center];
      [[controller view] addSubview:spinner];
    } else if ([spinner activityIndicatorViewStyle] != style) {
      [spinner setActivityIndicatorViewStyle:style];
      [spinner sizeToFit];
    }
  }
}

- (BOOL)touchedContentViewWithEvent:(UIEvent *)event
{
  // The view hierarchy of the movie player controller's view is subject to change,
  // and traversing it is dangerous. If we received a touch which isn't on a TiUIView,
  // assume it falls into the movie player view hiearchy; this matches previous
  // behavior as well.

  UITouch *touch = [[event allTouches] anyObject];
  return (![[touch view] isKindOfClass:[TiUIView class]]);
}

- (void)dealloc
{
  [controller willMoveToParentViewController:nil];
  [[controller view] removeFromSuperview];
  [controller removeFromParentViewController];

  RELEASE_TO_NIL(parentController);
  RELEASE_TO_NIL(controller);
  RELEASE_TO_NIL(spinner);
  [super dealloc];
}

- (void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
  self.frame = CGRectIntegral(self.frame);
  [TiUtils setView:[controller view] positionRect:bounds];
  [super frameSizeChanged:frame bounds:bounds];
}

@end

#endif
