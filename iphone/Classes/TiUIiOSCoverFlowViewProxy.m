/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSCOVERFLOWVIEW

#import "TiUIiOSCoverFlowViewProxy.h"
#import "TiUIiOSCoverFlowView.h"
#import <TitaniumKit/TiBase.h>

NSArray *coverflowKeySequence;

@implementation TiUIiOSCoverFlowViewProxy

DEFINE_DEF_INT_PROP(selected, 0);

- (NSString *)apiName
{
  return @"Ti.UI.iOS.CoverFlowView";
}

- (NSArray *)keySequence
{
  if (coverflowKeySequence == nil) {
    coverflowKeySequence = [[NSArray alloc] initWithObjects:@"images", nil];
  }
  return coverflowKeySequence;
}

- (void)setImage:(id)args
{
  ENSURE_ARG_COUNT(args, 2);
  ENSURE_UI_THREAD(setImage, args);
  int index = [TiUtils intValue:[args objectAtIndex:0]];
  id image = [args objectAtIndex:1];
  [(TiUIiOSCoverFlowView *)[self view] setImage:image forIndex:index];
}

@end

#endif
