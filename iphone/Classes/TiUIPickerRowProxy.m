/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIPICKER

#import "TiUIPickerRowProxy.h"

@implementation TiUIPickerRowProxy

- (void)dealloc
{
  RELEASE_TO_NIL(snapshot);
  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.UI.PickerRow";
}

- (UIView *)viewWithFrame:(CGRect)theFrame reusingView:(UIView *)theView
{
  //The picker on IOS seems to consist of 3 tableViews (or some derivative of it) each of which calls the
  //delegate method. So we have a singleView from our proxy residing in 3 superViews.
  //While older version of IOS somehow made this work, IOS7 seems to be completely broken.
  //So what we are doing is creating a snapshot (toImage() -> UIImageView) and returning that.
  //Downside -> No touch events from pickerrow or its children
  //Upside -> It works and is performant. Accessibility is configured on the delegate

  NSString *title = [TiUtils stringValue:[self valueForKey:@"title"]];
  WebFont *pickerFont = [TiUtils fontValue:[self valueForKey:@"font"] def:[WebFont defaultFont]];
  if (title != nil) {
    UILabel *pickerLabel = nil;

    if ([theView isMemberOfClass:[UILabel class]]) {
      pickerLabel = (UILabel *)theView;
    }

    if (pickerLabel == nil) {
      pickerLabel = [[[UILabel alloc] initWithFrame:theFrame] autorelease];
      [pickerLabel setTextAlignment:NSTextAlignmentLeft];
      [pickerLabel setBackgroundColor:[UIColor clearColor]];
      [pickerLabel setFont:[pickerFont font]];
    }
    [pickerLabel setText:title];
    id ourColor = [self valueForKey:@"color"];
    if (ourColor) {
      UIColor *color = [[TiUtils colorValue:ourColor] color];
      pickerLabel.textColor = color;
    }
    return pickerLabel;
  } else {
    if (snapshot == nil) {
      UIView *myview = [self barButtonViewForSize:theFrame.size];
      CGSize size = myview.bounds.size;
      if (CGSizeEqualToSize(size, CGSizeZero) || size.width == 0 || size.height == 0) {
#ifndef TI_USE_AUTOLAYOUT
        CGFloat width = [self autoWidthForSize:CGSizeMake(1000, 1000)];
        CGFloat height = [self autoHeightForSize:CGSizeMake(width, 0)];
#else
        CGSize s = [[self view] sizeThatFits:CGSizeMake(1000, 1000)];
        CGFloat width = s.width;
        CGFloat height = s.height;
#endif
        if (width > 0 && height > 0) {
          size = CGSizeMake(width, height);
        }
        if (CGSizeEqualToSize(size, CGSizeZero) || width == 0 || height == 0) {
          size = [UIScreen mainScreen].bounds.size;
        }
        CGRect rect = CGRectMake(0, 0, size.width, size.height);
        [TiUtils setView:myview positionRect:rect];
      }
      UIGraphicsBeginImageContextWithOptions(size, [myview.layer isOpaque], 0);
      [myview.layer renderInContext:UIGraphicsGetCurrentContext()];
      UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
      snapshot = [image retain];
      UIGraphicsEndImageContext();
    }

    UIImageView *pickerImage = nil;
    if ([theView isMemberOfClass:[UIImageView class]]) {
      pickerImage = (UIImageView *)theView;
    }

    if (pickerImage == nil) {
      pickerImage = [[[UIImageView alloc] initWithFrame:theFrame] autorelease];
      [pickerImage setBackgroundColor:[UIColor clearColor]];
      [pickerImage setContentMode:UIViewContentModeScaleAspectFit];
    }

    [pickerImage setImage:snapshot];
    return pickerImage;
  }
}

@end

#endif
