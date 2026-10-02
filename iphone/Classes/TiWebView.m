//
//  TiWebView.m
//  Titanium
//
//  Created by Hans Knöchel on 02.02.26.
//

#import "TiWebView.h"

@implementation TiWebView

- (__kindof UIView *)inputAccessoryView
{
  if (self.hideInputAccessoryView) {
    return nil;
  }
  return [super inputAccessoryView];
}

@end
