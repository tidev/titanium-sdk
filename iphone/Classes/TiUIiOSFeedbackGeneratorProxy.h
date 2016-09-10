/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSFEEDBACKGENERATOR

#import "TiProxy.h"

typedef NS_ENUM(NSInteger, TiUIiOSFeedbackGeneratorType) {
    TiUIiOSFeedbackGeneratorTypeSelection = 0,
    TiUIiOSFeedbackGeneratorTypeImpact = 1,
    TiUIiOSFeedbackGeneratorTypeNotification = 2
};

@interface TiUIiOSFeedbackGeneratorProxy : TiProxy {
    UIFeedbackGenerator *generator;
    TiUIiOSFeedbackGeneratorType type;
}

@end

#endif
