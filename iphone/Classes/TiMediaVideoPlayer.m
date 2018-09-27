/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MEDIAVIDEOPLAYER

#import "TiMediaVideoPlayer.h"
#import "TiApp.h"
#import "TiUtils.h"
#import "TiViewProxy.h"
#import "Webcolor.h"
#import "TiUIWindowProxy.h"

@implementation TiMediaVideoPlayer {
    UIViewController *videoControllerPresenter;
}
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
  // [[controller view] removeFromSuperview];
  [controller removeObserver:self forKeyPath:@"view.frame"];
  [spinner removeFromSuperview];
  RELEASE_TO_NIL(spinner);
  RELEASE_TO_NIL(controller);

  if (controller_ == nil) {
    return;
  }
  controller = [controller_ retain];

  // [TiUtils setView:[controller view] positionRect:self.bounds];
  // [self addSubview:[controller view]];
  // [self sendSubviewToBack:[controller view]];

  //find the top level view controller to use as a modal presenter
  if (!videoControllerPresenter) {
    id proxy = [(TiViewProxy *)self.proxy parent];
    while ([proxy isKindOfClass:[TiViewProxy class]] && ![proxy isKindOfClass:[TiWindowProxy class]]) {
        proxy = [proxy parent];
    }
    if ([proxy isKindOfClass:[TiWindowProxy class]]) {
        videoControllerPresenter = [[proxy windowHoldingController] retain];
    } else {
        videoControllerPresenter = [[[TiApp app] controller] retain];
    }
  }

  //Present the video view controller as a modal over full screen.
  controller.modalPresentationStyle = UIModalPresentationOverFullScreen;
  [videoControllerPresenter presentViewController:controller animated:YES completion:^{
      //watch for view frame changes as we cannot watch for "DONE" button click!
      [controller addObserver:self forKeyPath:@"view.frame" options:NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld context:nil];
  }];


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
  [controller removeObserver:self forKeyPath:@"view.frame"];
  //[[controller view] removeFromSuperview];
  RELEASE_TO_NIL(controller);
  RELEASE_TO_NIL(spinner);
  RELEASE_TO_NIL(videoControllerPresenter);
  [super dealloc];
}

- (void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
  self.frame = CGRectIntegral(self.frame);
  //[TiUtils setView:[controller view] positionRect:bounds];
  [super frameSizeChanged:frame bounds:bounds];
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary<NSString *, id> *)change context:(void *)context
{
    if ([keyPath isEqualToString:@"view.frame"]) {
        // fired on orientation change and dismissal
        if (controller.isBeingDismissed) {
            //fire the complete event if we are dismissing.
            [self.proxy fireEvent:@"complete" withObject:nil errorCode:0 message:nil];
        }
    }
}

@end

#endif
