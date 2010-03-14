/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUITextAreaProxy.h"
#import "TiUITextArea.h"

@implementation TiUITextAreaProxy

-(BOOL)hasText
{
	if ([self viewAttached])
	{
		return [(TiUITextArea*)[self view] hasText];
	}
	NSString *value = [self valueForKey:@"text"];
	return value!=nil && [value length] > 0;
}

-(void)blur:(id)args
{
	if ([self viewAttached])
	{
		[[self view] performSelectorOnMainThread:@selector(blur) withObject:nil waitUntilDone:NO];
	}
}

-(void)focus:(id)args
{
	if ([self viewAttached])
	{
		[[self view] performSelectorOnMainThread:@selector(focus) withObject:nil waitUntilDone:NO];
	}
}

@end
