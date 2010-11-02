/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UICOVERFLOWVIEW

#import "TiUICoverFlowViewProxy.h"
#import "TiBase.h"
#import "TiUICoverFlowView.h"

NSArray* coverflowKeySequence;

@implementation TiUICoverFlowViewProxy

DEFINE_DEF_INT_PROP(selected, 0);

-(NSArray*)keySequence
{
	if (coverflowKeySequence == nil) {
		coverflowKeySequence = [[NSArray alloc] initWithObjects:@"images",nil];
	}
	return coverflowKeySequence;
}

-(void)setImage:(id)args
{
	ENSURE_ARG_COUNT(args,2);
	ENSURE_UI_THREAD(setImage,args);
	int index = [TiUtils intValue:[args objectAtIndex:0]];
	id image = [args objectAtIndex:1];
	[(TiUICoverFlowView*)[self view] setImage:image forIndex:index];
}

@end

#endif