/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITEXTAREA

#import "TiUITextAreaProxy.h"
#import "TiUITextArea.h"

@implementation TiUITextAreaProxy

#pragma mark Defaults

DEFINE_DEF_PROP(value, @"");
DEFINE_DEF_PROP(scrollsToTop, [NSNumber numberWithBool:YES]);
DEFINE_DEF_INT_PROP(maxLength, -1);

- (NSString *)apiName
{
  return @"Ti.UI.TextArea";
}

- (void)_initWithProperties:(NSDictionary *)props
{
  if ([props valueForKey:@"showUndoRedoActions"]) {

    TiThreadPerformOnMainThread(
        ^{
          TiUITextArea *textArea = (TiUITextArea *)[self view];
          [textArea setShowUndoRedoActions:[props valueForKey:@"showUndoRedoActions"]];
        },
        NO);
  }

  [super _initWithProperties:props];
}

@end

#endif