/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiController.h"
#import "TiViewProxy.h"


@interface TiViewController : UIViewController<TiController> 
{
@private
	TiViewProxy *proxy;
}
-(id)initWithViewProxy:(TiViewProxy*)proxy_;
@end
