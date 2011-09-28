/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIiOSProxy.h"
#import "TiUtils.h"

#ifdef USE_TI_UIIOS

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_0

#ifdef USE_TI_UIIOSADVIEW
#import "TiUIiOSAdViewProxy.h"
#endif

#endif
#ifdef USE_TI_UIIOS3DMATRIX
#import "TiUIiOS3DMatrix.h"
#endif
#ifdef USE_TI_UIIOSCOVERFLOWVIEW
#import "TiUIiOSCoverFlowViewProxy.h"
#endif

@implementation TiUIiOSProxy

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_0
#ifdef USE_TI_UIIOSADVIEW

-(id)createAdView:(id)args
{
	return [[[TiUIiOSAdViewProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}

#endif
#endif
#ifdef USE_TI_UIIOS3DMATRIX
-(id)create3DMatrix:(id)args
{
	if (args==nil || [args count] == 0)
	{
		return [[[TiUIiOS3DMatrix alloc] init] autorelease];
	}
	ENSURE_SINGLE_ARG(args,NSDictionary);
	TiUIiOS3DMatrix *matrix = [[TiUIiOS3DMatrix alloc] initWithProperties:args];
	return [matrix autorelease];
}
#endif
#ifdef USE_TI_UIIOSCOVERFLOWVIEW
-(id)createCoverFlowView:(id)args
{
		return [[[TiUIiOSCoverFlowViewProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif
@end

#endif