/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_ACCELEROMETER

#import <Foundation/Foundation.h>
#import <CoreLocation/CoreLocation.h>

#import "TitaniumModule.h"

@interface AccelerometerModule : NSObject<TitaniumModule,UIAccelerometerDelegate> {
	NSMutableSet * watchingPages;

//TODO: A decent time-independant filter.
//	UIAccelerationValue accelerationX;
//	UIAccelerationValue accelerationY;
//	UIAccelerationValue accelerationZ;
}

@end

/*
 * @tiapi(method=True,returns=integer,name=Accelerometer.addEventListener,since=0.4) add an event listener to be called for a accelerometer event and returns the function to use when removing
 * @tiarg(for=Accelerometer.addEventListener,type=string,name=type) the type of Accelerometer event to listen for. May only be 'update'
 * @tiarg(for=Accelerometer.addEventListener,type=method,name=listener) listener method
 * @tiresult(for=Accelerometer.addEventListener,type=function) return the listener to be used as an id
 *
 * callbackFunction({type:'update',x:0.01,y:0.05,z:-0.996,timestamp:1050});
 * type: type of event
 * x: The acceleration, measured as a multiple of gravitational force, along the x axis
 * y: The acceleration, measured as a multiple of gravitational force, along the y axis
 * z: The acceleration, measured as a multiple of gravitational force, along the z axis
 * timestamp: the timestamp, in milliseconds. Note that this timestamp can only be measured relative to previous update functions, and does not translate into a date
 *
 * @tiapi(method=True,name=Accelerometer.removeEventListener,since=0.4) removes an event listener from Accelerometer events
 * @tiarg(for=Accelerometer.removeEventListener,type=string,name=type) the type of event to be removed from addEventListener
 * @tiarg(for=Accelerometer.removeEventListener,type=function,name=id) the function to be removed from addEventListener
 * @tiresult(for=Accelerometer.removeEventListener,type=boolean) return true if removed
 */ 


#endif