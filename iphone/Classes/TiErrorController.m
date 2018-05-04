/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiErrorController.h"
#import "TiApp.h"
#import "TiBase.h"
#import "TiUtils.h"
#import <QuartzCore/QuartzCore.h>

@implementation TiErrorController

- (id)initWithError:(NSString *)error_
{
  if (self = [super init]) {
    error = [error_ retain];
  }
  return self;
}

- (void)dealloc
{
  [super dealloc];
}

- (void)dismiss:(id)sender
{
  [[TiApp app] hideModalController:self animated:YES];
}

- (void)loadView
{
  [super loadView];
  self.modalTransitionStyle = UIModalTransitionStyleCoverVertical;

  UIScrollView *view = [[[NSBundle mainBundle] loadNibNamed:@"ErrorScreen" owner:self options:nil] objectAtIndex:0];
  self.view = view;

  UITextView *text = (UITextView *)[self.view viewWithTag:1];
  [text setText:error];

  // re-size for scroll
  text.contentSize = [text sizeThatFits:CGSizeMake(FLT_MAX, FLT_MAX)];
  text.frame = CGRectMake(text.frame.origin.x, text.frame.origin.y, text.contentSize.width, text.contentSize.height);
  view.contentSize = CGSizeMake(text.contentSize.width, text.contentSize.height);
}

- (void)viewDidAppear:(BOOL)animated
{
  [super viewDidAppear:animated];
  [self.view layoutIfNeeded];
}

@end
