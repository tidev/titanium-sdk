//
// Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
//
// This code is proprietary and confidential to Appcelerator
// and not for redistribution.
//

#import "UIKit/UIKit.h"

@interface ApplicationMods : NSObject
+ (NSArray *)compiledMods;
@end

@interface TiApp : NSObject
+ (TiApp *)app;
- (void)showModalController:(UIViewController *)modalController animated:(BOOL)animated;
@end

@interface TiVerify : NSObject {
}

@end
