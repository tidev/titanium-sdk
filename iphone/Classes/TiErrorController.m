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
  RELEASE_TO_NIL(titleLabel);
  RELEASE_TO_NIL(messageLabel);
  RELEASE_TO_NIL(disclosureLabel);
  RELEASE_TO_NIL(centerView);
  RELEASE_TO_NIL(messageLabel);
  RELEASE_TO_NIL(disclosureLabel);
  RELEASE_TO_NIL(error);
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
  UIView *view = [self view];
  [view setBackgroundColor:[UIColor redColor]];

  RELEASE_TO_NIL(titleLabel)
  RELEASE_TO_NIL(messageLabel)
  RELEASE_TO_NIL(disclosureLabel)
  RELEASE_TO_NIL(centerView)
  RELEASE_TO_NIL(messageLabel)
  RELEASE_TO_NIL(disclosureLabel)

  dismissButton = [UIButton buttonWithType:UIButtonTypeRoundedRect];
  dismissButton.backgroundColor = [UIColor whiteColor];
  dismissButton.translatesAutoresizingMaskIntoConstraints = NO;
  [dismissButton setTitle:@"Dismiss" forState:UIControlStateNormal];

  disclosureLabel = [[UILabel alloc] init];
  disclosureLabel.backgroundColor = [UIColor clearColor];
  disclosureLabel.font = [UIFont boldSystemFontOfSize:14];
  disclosureLabel.numberOfLines = 0;
  disclosureLabel.shadowOffset = CGSizeMake(0.0, -1.0);
  disclosureLabel.text = @"Error messages will only be displayed during development. When your app is packaged for final distribution, no error screen will appear. Test your code!";
  disclosureLabel.textColor = [UIColor blackColor];
  disclosureLabel.translatesAutoresizingMaskIntoConstraints = NO;

  centerView = [[UIView alloc] init];
  centerView.translatesAutoresizingMaskIntoConstraints = NO;

  titleLabel = [[UILabel alloc] init];
  titleLabel.backgroundColor = [UIColor clearColor];
  titleLabel.font = [UIFont boldSystemFontOfSize:32];
  titleLabel.shadowColor = [UIColor darkGrayColor];
  titleLabel.shadowOffset = CGSizeMake(2.0, 1.0);
  titleLabel.text = @"Application Error";
  titleLabel.textAlignment = NSTextAlignmentCenter;
  titleLabel.textColor = [UIColor greenColor];
  titleLabel.translatesAutoresizingMaskIntoConstraints = NO;

  messageLabel = [[UILabel alloc] init];
  messageLabel.backgroundColor = [UIColor clearColor];
  messageLabel.font = [UIFont boldSystemFontOfSize:20];
  messageLabel.numberOfLines = 0;
  messageLabel.shadowColor = [UIColor blackColor];
  messageLabel.shadowOffset = CGSizeMake(0.0, -1.0);
  messageLabel.text = error;
  messageLabel.textAlignment = NSTextAlignmentCenter;
  messageLabel.textColor = [UIColor whiteColor];
  messageLabel.translatesAutoresizingMaskIntoConstraints = NO;

  [centerView addSubview:messageLabel];
  [centerView addSubview:dismissButton];
  [[self view] addSubview:titleLabel];
  [[self view] addSubview:centerView];
  [[self view] addSubview:disclosureLabel];

  NSLayoutConstraint *disclosureContraint1 =
      [NSLayoutConstraint constraintWithItem:disclosureLabel
                                   attribute:NSLayoutAttributeLeading
                                   relatedBy:NSLayoutRelationEqual
                                      toItem:view
                                   attribute:NSLayoutAttributeLeading
                                  multiplier:1
                                    constant:20];
  NSLayoutConstraint *disclosureContraint2 =
      [NSLayoutConstraint constraintWithItem:view
                                   attribute:NSLayoutAttributeTrailing
                                   relatedBy:NSLayoutRelationEqual
                                      toItem:disclosureLabel
                                   attribute:NSLayoutAttributeTrailing
                                  multiplier:1
                                    constant:20];
  NSLayoutConstraint *disclosureContraint3 =
      [NSLayoutConstraint constraintWithItem:view
                                   attribute:NSLayoutAttributeBottom
                                   relatedBy:NSLayoutRelationEqual
                                      toItem:disclosureLabel
                                   attribute:NSLayoutAttributeBottom
                                  multiplier:1
                                    constant:20];
  NSLayoutConstraint *titleConstraint1 =
      [NSLayoutConstraint constraintWithItem:titleLabel
                                   attribute:NSLayoutAttributeTop
                                   relatedBy:NSLayoutRelationEqual
                                      toItem:view
                                   attribute:NSLayoutAttributeTop
                                  multiplier:1
                                    constant:20];
  NSLayoutConstraint *titleConstraint2 =
      [NSLayoutConstraint constraintWithItem:titleLabel
                                   attribute:NSLayoutAttributeLeading
                                   relatedBy:NSLayoutRelationEqual
                                      toItem:view
                                   attribute:NSLayoutAttributeLeading
                                  multiplier:1
                                    constant:20];
  NSLayoutConstraint *titleConstraint3 =
      [NSLayoutConstraint constraintWithItem:view
                                   attribute:NSLayoutAttributeTrailing
                                   relatedBy:NSLayoutRelationEqual
                                      toItem:titleLabel
                                   attribute:NSLayoutAttributeTrailing
                                  multiplier:1
                                    constant:20];
  NSLayoutConstraint *messageConstraint1 =
      [NSLayoutConstraint constraintWithItem:centerView
                                   attribute:NSLayoutAttributeTrailing
                                   relatedBy:NSLayoutRelationEqual
                                      toItem:messageLabel
                                   attribute:NSLayoutAttributeTrailing
                                  multiplier:1
                                    constant:0];
  NSLayoutConstraint *messageConstraint2 =
      [NSLayoutConstraint constraintWithItem:messageLabel
                                   attribute:NSLayoutAttributeLeading
                                   relatedBy:NSLayoutRelationEqual
                                      toItem:centerView
                                   attribute:NSLayoutAttributeLeading
                                  multiplier:1
                                    constant:0];
  NSLayoutConstraint *messageConstraint3 =
      [NSLayoutConstraint constraintWithItem:messageLabel
                                   attribute:NSLayoutAttributeTop
                                   relatedBy:NSLayoutRelationEqual
                                      toItem:centerView
                                   attribute:NSLayoutAttributeTop
                                  multiplier:1
                                    constant:0];
  NSLayoutConstraint *buttonConstraint1 =
      [NSLayoutConstraint constraintWithItem:centerView
                                   attribute:NSLayoutAttributeTrailing
                                   relatedBy:NSLayoutRelationEqual
                                      toItem:dismissButton
                                   attribute:NSLayoutAttributeTrailing
                                  multiplier:1
                                    constant:80];
  NSLayoutConstraint *buttonConstraint2 =
      [NSLayoutConstraint constraintWithItem:dismissButton
                                   attribute:NSLayoutAttributeLeading
                                   relatedBy:NSLayoutRelationEqual
                                      toItem:centerView
                                   attribute:NSLayoutAttributeLeading
                                  multiplier:1
                                    constant:80];
  NSLayoutConstraint *buttonConstraint3 =
      [NSLayoutConstraint constraintWithItem:dismissButton
                                   attribute:NSLayoutAttributeBottom
                                   relatedBy:NSLayoutRelationEqual
                                      toItem:centerView
                                   attribute:NSLayoutAttributeBottom
                                  multiplier:1
                                    constant:0];
  NSLayoutConstraint *buttonConstraint4 =
      [NSLayoutConstraint constraintWithItem:dismissButton
                                   attribute:NSLayoutAttributeTop
                                   relatedBy:NSLayoutRelationEqual
                                      toItem:messageLabel
                                   attribute:NSLayoutAttributeBottom
                                  multiplier:1
                                    constant:20];
  NSLayoutConstraint *centerConstraint1 =
      [NSLayoutConstraint constraintWithItem:view
                                   attribute:NSLayoutAttributeCenterX
                                   relatedBy:NSLayoutRelationEqual
                                      toItem:centerView
                                   attribute:NSLayoutAttributeCenterX
                                  multiplier:1
                                    constant:0];
  NSLayoutConstraint *centerConstraint2 =
      [NSLayoutConstraint constraintWithItem:view
                                   attribute:NSLayoutAttributeCenterY
                                   relatedBy:NSLayoutRelationEqual
                                      toItem:centerView
                                   attribute:NSLayoutAttributeCenterY
                                  multiplier:1
                                    constant:0];
  NSLayoutConstraint *centerConstraint3 =
      [NSLayoutConstraint constraintWithItem:centerView
                                   attribute:NSLayoutAttributeLeading
                                   relatedBy:NSLayoutRelationEqual
                                      toItem:view
                                   attribute:NSLayoutAttributeLeading
                                  multiplier:1
                                    constant:20];
  NSLayoutConstraint *centerConstraint4 =
      [NSLayoutConstraint constraintWithItem:view
                                   attribute:NSLayoutAttributeTrailing
                                   relatedBy:NSLayoutRelationEqual
                                      toItem:centerView
                                   attribute:NSLayoutAttributeTrailing
                                  multiplier:1
                                    constant:20];
  NSLayoutConstraint *centerConstraint5 =
      [NSLayoutConstraint constraintWithItem:centerView
                                   attribute:NSLayoutAttributeTop
                                   relatedBy:NSLayoutRelationGreaterThanOrEqual
                                      toItem:titleLabel
                                   attribute:NSLayoutAttributeBottom
                                  multiplier:1
                                    constant:10];
  NSLayoutConstraint *centerConstraint6 =
      [NSLayoutConstraint constraintWithItem:disclosureLabel
                                   attribute:NSLayoutAttributeTop
                                   relatedBy:NSLayoutRelationGreaterThanOrEqual
                                      toItem:centerView
                                   attribute:NSLayoutAttributeBottom
                                  multiplier:1
                                    constant:10];

  [centerView addConstraint:messageConstraint1];
  [centerView addConstraint:messageConstraint2];
  [centerView addConstraint:messageConstraint3];
  [centerView addConstraint:buttonConstraint1];
  [centerView addConstraint:buttonConstraint2];
  [centerView addConstraint:buttonConstraint3];
  [centerView addConstraint:buttonConstraint4];

  [[self view] addConstraint:titleConstraint1];
  [[self view] addConstraint:titleConstraint2];
  [[self view] addConstraint:titleConstraint3];
  [[self view] addConstraint:centerConstraint1];
  [[self view] addConstraint:centerConstraint2];
  [[self view] addConstraint:centerConstraint3];
  [[self view] addConstraint:centerConstraint4];
  [[self view] addConstraint:centerConstraint5];
  [[self view] addConstraint:centerConstraint6];
  [[self view] addConstraint:disclosureContraint1];
  [[self view] addConstraint:disclosureContraint2];
  [[self view] addConstraint:disclosureContraint3];

  [dismissButton addTarget:self action:@selector(dismiss:) forControlEvents:UIControlEventTouchUpInside];
}

- (void)viewDidAppear:(BOOL)animated
{
  [super viewDidAppear:animated];
  disclosureLabel.preferredMaxLayoutWidth = disclosureLabel.frame.size.width;
  messageLabel.preferredMaxLayoutWidth = messageLabel.frame.size.width;
  titleLabel.preferredMaxLayoutWidth = titleLabel.frame.size.width;
  [self.view layoutIfNeeded];
}

@end
