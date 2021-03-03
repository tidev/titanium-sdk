/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <TitaniumKit/ObjcModule.h>

#ifdef USE_TI_ACCELEROMETER
#import <CoreMotion/CoreMotion.h>

@interface AccelerometerModule : ObjcModule {
  @private
  CMMotionManager *_motionManager;
  NSOperationQueue *_motionQueue;
  CFAbsoluteTime oldTime;
}

@end

#endif
