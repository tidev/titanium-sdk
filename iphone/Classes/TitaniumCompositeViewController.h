//
//  TitaniumCompositeViewController.h
//  Titanium
//
//  Created by Blain Hamon on 9/14/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "TitaniumContentViewController.h"

@interface TitaniumCompositeRule : NSObject
{
	TitaniumContentViewController * viewController;
	CGFloat z;
	CGRect bounds;
	BOOL hasXConstraint;
	BOOL hasYConstraint;
	BOOL hasWidthConstraint;
	BOOL hasHeightConstraint;
}
@property(nonatomic,readwrite,retain)	TitaniumContentViewController * viewController;
@property(nonatomic,readwrite,assign)	CGFloat z;
@property(nonatomic,readwrite,assign)	CGRect bounds;
@property(nonatomic,readwrite,assign)	BOOL hasXConstraint;
@property(nonatomic,readwrite,assign)	BOOL hasYConstraint;
@property(nonatomic,readwrite,assign)	BOOL hasWidthConstraint;
@property(nonatomic,readwrite,assign)	BOOL hasHeightConstraint;

@end


@interface TitaniumCompositeViewController : TitaniumContentViewController {
	NSArray * viewControllerRules;
}

@end
