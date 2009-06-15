/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_GESTURE

#import <Foundation/Foundation.h>
#import "TitaniumModule.h"

@interface GestureModule : NSObject<TitaniumModule> {

}

/**
 * @tiapi(method=True,returns=integer,name=Gesture.addEventListener,since=0.4) add an event listener to be called for a gesture event and returns the function to use when removing
 * @tiarg(for=Gesture.addEventListener,type=string,name=type) the type of gesture event to listen for. May be either 'shake' or 'orientationchange'
 * @tiarg(for=Gesture.addEventListener,type=method,name=listener) listener method
 * @tiresult(for=Gesture.addEventListener,type=function) return the listener to be used as an id
 *
 * callbackFunction({type:'shake'});
 * callbackFunction({type:'orientationchange',to:Ti.Gesture.PORTRAIT,from:Ti.Gesture.LANDSCAPE_RIGHT,animated:false,duration:0}
 * type: type of event
 * to: orientation that the view will be moving to.
 * from: the orientation that the view will be moving from.
 * animated: boolean on if the view will visibly rotate for the user.
 * duration: if animated, the time the rotation will happen. Otherwise, 0.
 *
 * @tiapi(method=True,name=Gesture.removeEventListener,since=0.4) removes an event listener from gesture events
 * @tiarg(for=Gesture.removeEventListener,type=string,name=type) the type of event to be removed from addEventListener
 * @tiarg(for=Gesture.removeEventListener,type=function,name=id) the function to be removed from addEventListener
 * @tiresult(for=Gesture.removeEventListener,type=boolean) return true if removed
 * 
 * @tiapi(method=True,name=Gesture.isPortrait,since=0.4) indicates whether or not the passed in value is a portrait view.
 * @tiarg(for=Gesture.isPortrait,type=int,name=orientation) orientation to check. In the orientationchange event, this may be either the to property or from property.
 * @tiresult(for=Gesture.isPortrait,type=boolean) return true if the orientation is Titanium.Gesture.PORTRAIT
 * NOTE: because holding the phone upside down (UPSIDE_PORTRAIT) is discouraged by apple, and not possible on Android,
 * Gesture.isPortrait(Titanium.Gesture.UPSIDE_PORTRAIT) is false.
 *
 * @tiapi(method=True,name=Gesture.isLandscape,since=0.4) indicates whether or not the passed in value is a landscape view.
 * @tiarg(for=Gesture.isLandscape,type=int,name=orientation) orientation to check. In the orientationchange event, this may be either the to property or from property.
 * @tiresult(for=Gesture.isLandscape,type=boolean) return true if the orientation is Titanium.Gesture.LANDSCAPE_LEFT or LANDSCAPE_RIGHT.
 *
 * @tiapi(property=True,name=Gesture.PORTRAIT,since=0.4,type=int) integer that represents portrait orientation
 * @tiapi(property=True,name=Gesture.LANDSCAPE_LEFT,since=0.4,type=int) integer that represents landscape orientation where the home button is to the left of the screen
 * @tiapi(property=True,name=Gesture.LANDSCAPE_RIGHT,since=0.4,type=int) integer that represents landscape orientation where the home button is to the right of the screen
 * @tiapi(property=True,name=Gesture.LANDSCAPE,since=0.4,type=int) integer that represents both landscape left or landscape right orientation
 * @tiapi(property=True,name=Gesture.UPSIDE_PORTRAIT,since=0.4,type=int) integer that represents an upside-down portrait orientation
 *
 */

@end

#endif
