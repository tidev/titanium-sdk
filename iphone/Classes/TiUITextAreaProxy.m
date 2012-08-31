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

DEFINE_DEF_PROP(value,@"");
DEFINE_DEF_PROP(scrollsToTop,[NSNumber numberWithBool:YES]);
DEFINE_DEF_INT_PROP(maxLength,-1);

-(void)setSelection:(id)arg withObject:(id)property
{
    NSInteger start = [TiUtils intValue:arg def: -1];
    NSInteger end = [TiUtils intValue:property def:-1];
    UITextView* textView = (UITextView*)[(TiUITextArea *) [self view] textWidgetView];
    NSInteger textLength = [ [textView text] length];
    if ((start < 0) || (start > textLength) || (end < 0) || (end > textLength)) {
        DebugLog(@"Invalid range for text selection. Ignoring.");
        return;
    }
    TiThreadPerformOnMainThread(^{[(TiUITextArea *)[self view] setSelectionFrom:arg to:property];}, NO);
}

@end

#endif