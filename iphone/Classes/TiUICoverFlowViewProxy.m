/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UICOVERFLOWVIEW

#import "TiUICoverFlowViewProxy.h"
#import "TiUtils.h"
#import "ImageLoader.h"
#import "TiUICoverFlowView.h"

@implementation TiUICoverFlowViewProxy

-(void)setSelected:(id)arg
{
	ENSURE_SINGLE_ARG_OR_NIL(arg,NSObject);
	[self replaceValue:arg forKey:@"selected" notification:YES];
}

-(void)setURL:(id)args
{
	ENSURE_ARG_COUNT(args,2);
	ENSURE_UI_THREAD(setURL,args);
	int index = [TiUtils intValue:[args objectAtIndex:0]];
	NSString *url = [TiUtils stringValue:[args objectAtIndex:1]];
	[(TiUICoverFlowView*)[self view] setURL:url forIndex:index];
}

@end

#endif