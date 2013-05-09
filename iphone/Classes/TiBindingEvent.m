/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */


#import "TiBindingEvent.h"
#include <libkern/OSAtomic.h>
#include "Ti.h"
#import "KrollObject.h"
#import "TiBindingTiValue.h"
#import "TiBindingRunLoop.h"
#import "TiBase.h"
#import "TiExceptionHandler.h"
#import "TiUtils.h"

extern TiStringRef kTiStringLength;

/** Event lifecycle, a documentation.
 
 The event structures are designed to be threadsafe, yet don't have a lock.
 How is this so? The trick is the lifecycle and atomic transactions on pendingEvents:
 
 Creation:
	Immutable variables can be set, only one thread has access.
	Can call FireEvent.
 FireEvent:
	While searching for new targetProxy, only one thread has access.
	pendingEvents is set to the number of threads that will be accessing it.
	Once targetProxy found, the event becomes fully immutable again, and event
	is sent to multiple run loops.
 EventProcess:
	Event is immutable during processing
	cancelBubble is mutable, but blindly set during processing, thus no race
	Once done processing, the pendingEvents is atomically decrimented.
	Once pendingEvents reaches 0, we are certain that no other threads are using
	this event. During this time, the event is again mutable for purposes of
	propagation- caching and then fireEvent.
	This also means that while processing, the event will NOT be deallocated
	under us.
 */

struct TiBindingEventOpaque{
//Abstraction values and tread safety.
	int pendingEvents;	//Mutable, acts as lock of sorts due to atomic decrement
	bool bubbles;	//Immutable
	bool cancelBubble;	//Mutable, set to true
	bool reportError;		//Immutable
	int errorCode;			//Immutable
//Objective C version
	TiProxy * targetProxy;	//Immutable in-event, mutable for bubbling.
	TiProxy * sourceProxy;	//Immutable
	NSString * eventString;	//Immutable
	NSDictionary * payloadDictionary; //Immutable
	NSString * errorMessageString;	//Immutable
//Immutable caching.
	TiStringRef eventStringRef;	//Immutable
	TiStringRef errorMessageStringRef;	//Immutable
//Mutable caching in future.
	TiContextRef contextRef;
	TiObjectRef eventObjectRef;
};

void TiBindingEventProcess(TiBindingRunLoop runloop, void * payload);


pthread_once_t jsBindingRunOnce = PTHREAD_ONCE_INIT;
TiStringRef jsEventCancelBubbleStringRef = NULL;
TiStringRef jsEventTypeStringRef = NULL;
TiStringRef jsEventSourceStringRef = NULL;
TiStringRef jsEventBubblesStringRef = NULL;
TiStringRef jsEventSuccessStringRef = NULL;
TiStringRef jsEventErrorCodeStringRef = NULL;
TiStringRef jsEventErrorMessageStringRef = NULL;

void TiBindingInitialize()
{
	jsEventCancelBubbleStringRef = TiStringCreateWithUTF8CString("cancelBubble");
	jsEventTypeStringRef = TiStringCreateWithUTF8CString("type");
	jsEventSourceStringRef = TiStringCreateWithUTF8CString("source");
	jsEventBubblesStringRef = TiStringCreateWithUTF8CString("bubbles");
	jsEventSuccessStringRef = TiStringCreateWithUTF8CString("success");
	jsEventErrorCodeStringRef = TiStringCreateWithUTF8CString("code");
	jsEventErrorMessageStringRef = TiStringCreateWithUTF8CString("error");
}

TiBindingEvent TiBindingEventCreateWithNSObjects(TiProxy * target, TiProxy * source, NSString * type, NSDictionary * payload)
{
	TiBindingEvent result = malloc(sizeof(struct TiBindingEventOpaque));
	result->targetProxy = [target retain];
	result->sourceProxy = [source retain];
	result->eventString = [type copy];
	result->payloadDictionary = [payload copy];
	result->pendingEvents = 0;
	result->bubbles = false;
	result->cancelBubble = false;
	result->reportError = false;
	result->errorCode = 0;
	result->errorMessageString = nil;
	result->eventObjectRef = NULL;
	result->eventStringRef = TiStringCreateWithCFString((CFStringRef)result->eventString);
	result->errorMessageStringRef = NULL;
	result->contextRef = NULL;
	return result;
}

void TiBindingEventSetBubbles(TiBindingEvent event, bool bubbles)
{
	event->bubbles = bubbles;
}

TiProxy * TiBindingEventNextBubbleTargetProxy(TiBindingEvent event, TiProxy * currentTarget, BOOL parentOnly)
{
	while ( (currentTarget != nil) && (![currentTarget _hasListeners:event->eventString] || parentOnly) )
	{
		if (!currentTarget->_bubbleParent || !event->bubbles || event->cancelBubble)
		{
			return nil;
		}
		parentOnly = false;
		currentTarget = [currentTarget parentForBubbling];
        
        //TIMOB-11691. Ensure that tableviewrowproxy modifies the event object before passing it along.
        if ([currentTarget respondsToSelector:@selector(createEventObject:)]) {
            NSDictionary *curPayload = event->payloadDictionary;
            NSDictionary *modifiedPayload = [currentTarget createEventObject:curPayload];
            [event->payloadDictionary release];
            event->payloadDictionary = [modifiedPayload copy];
        }
	}
	return currentTarget;
}

void TiBindingEventSetErrorCode(TiBindingEvent event, int code)
{
	event->reportError = true;
	event->errorCode = code;
}

void TiBindingEventSetErrorMessageWithNSString(TiBindingEvent event, NSString * message)
{
	[event->errorMessageString autorelease];
	event->errorMessageString = [message copy];
	if (event->errorMessageStringRef != NULL)
	{
		TiStringRelease(event->errorMessageStringRef);
	}
	if (message != nil)
	{
		event->errorMessageStringRef = TiStringCreateWithCFString((CFStringRef)message);
	}
	else
	{
		event->errorMessageStringRef = NULL;
	}
}

void TiBindingEventClearError(TiBindingEvent event)
{
	event->reportError = false;
}


void TiBindingEventFire(TiBindingEvent event)
{
	pthread_once(&jsBindingRunOnce,TiBindingInitialize);
	TiProxy * targetProxy = TiBindingEventNextBubbleTargetProxy(event, event->targetProxy, false);
	
	if (targetProxy == nil) { //Nobody to target, we're done here.
		TiBindingEventDispose(event);
		return;
	}
	
	int runloopcount = [targetProxy bindingRunLoopCount];

	if(event->targetProxy!=targetProxy){
		[event->targetProxy release];
		event->targetProxy = [targetProxy retain];
	}
	event->pendingEvents = runloopcount;
	if (runloopcount == 1) { //Main case: One run loop.
		TiBindingRunLoop ourRunLoop = [targetProxy primaryBindingRunLoop];
		if (ourRunLoop != nil) { // It's possible that the one remaining runloop
			//Was not the primaryBindingRunLoop. In which case, we flow to the
			//multiple run loops as an edge case.
			TiBindingRunLoopEnqueue(ourRunLoop, TiBindingEventProcess, event);
			return;
		}
	}
	
	if (runloopcount > 0) { //Edge case: Multiple run loops.
		NSArray * runLoopArray = [targetProxy bindingRunLoopArray];
		for (TiBindingRunLoop thisRunLoop in runLoopArray) {
			TiBindingRunLoopEnqueue(thisRunLoop, TiBindingEventProcess, event);
		}
		return;
	}
	
	//Extreme edge case. Proxy thinks it still has listeners, but no run loops?!
	TiProxy * newTarget = TiBindingEventNextBubbleTargetProxy(event, targetProxy, YES);
	if(event->targetProxy!=newTarget){
		[event->targetProxy release];
		event->targetProxy = [newTarget retain];
	}
	TiBindingEventFire(event);
}



void TiBindingEventProcess(TiBindingRunLoop runloop, void * payload)
{
	TiBindingEvent event = payload;
	TiObjectRef eventObjectRef = NULL;
	TiValueRef eventTargetRef = NULL;
	TiValueRef eventStringRef = NULL;
	TiValueRef eventSourceRef = NULL;
	
	KrollObject * targetKrollObject = [event->targetProxy krollObjectForContext:runloop];
	TiObjectRef callbacksObjectRef = [targetKrollObject callbacksForEvent:event->eventStringRef];
	int callbackCount = 0;
	TiContextRef context = [runloop context];

	if (callbacksObjectRef != NULL) {
		TiValueRef jsCallbackArrayLength = TiObjectGetProperty(context, callbacksObjectRef, kTiStringLength, NULL);
		callbackCount = (int)TiValueToNumber(context, jsCallbackArrayLength, NULL);
	}

	if (callbackCount > 0) {
		//Convert to TIobjectrefs
		if(eventObjectRef == NULL) {
			eventObjectRef = TiBindingTiValueFromNSDictionary(context, event->payloadDictionary);
		}
		if (eventTargetRef == NULL) {
			eventTargetRef = TiBindingTiValueFromProxy(context, event->targetProxy);
		}
		if (eventSourceRef == NULL) {
			eventSourceRef = TiBindingTiValueFromProxy(context, event->sourceProxy);
		}
		if (eventStringRef == NULL) {
			eventStringRef = TiValueMakeString(context, event->eventStringRef);
		}
		TiValueRef bubblesValue = TiValueMakeBoolean(context, event->bubbles);
		TiValueRef cancelBubbleValue = TiValueMakeBoolean(context, false);
		
		TiObjectSetProperty(context, eventObjectRef, jsEventBubblesStringRef, bubblesValue, kTiPropertyAttributeReadOnly, NULL);
		TiObjectSetProperty(context, eventObjectRef, jsEventTypeStringRef, eventStringRef, kTiPropertyAttributeReadOnly, NULL);
		TiObjectSetProperty(context, eventObjectRef, jsEventSourceStringRef, eventSourceRef, kTiPropertyAttributeReadOnly, NULL);
		
		//Error reporting
		if (event->reportError) {
			TiValueRef successValue = TiValueMakeBoolean(context, (event->errorCode == 0));
			TiValueRef codeValue = TiValueMakeNumber(context, (double)event->errorCode);

			TiObjectSetProperty(context, eventObjectRef, jsEventSuccessStringRef, successValue, kTiPropertyAttributeReadOnly, NULL);
			TiObjectSetProperty(context, eventObjectRef, jsEventErrorCodeStringRef, codeValue, kTiPropertyAttributeReadOnly, NULL);
		}

		if (event->errorMessageStringRef != NULL) {
			TiValueRef eventStringValueRef = TiValueMakeString(context, event->eventStringRef);
			TiObjectSetProperty(context, eventObjectRef, jsEventErrorMessageStringRef, eventStringValueRef, kTiPropertyAttributeReadOnly, NULL);
		}
		
		TiObjectSetProperty(context, eventObjectRef, jsEventCancelBubbleStringRef, cancelBubbleValue, kTiPropertyAttributeNone, NULL);
	
		for (int i=0; i < callbackCount; i++) {
			// Process event in context
			TiValueRef currentCallback = TiObjectGetPropertyAtIndex(context, callbacksObjectRef, i, NULL);
			if ((currentCallback == NULL) || (TiValueGetType(context,currentCallback) != kTITypeObject)
				|| !TiObjectIsFunction(context,(TiObjectRef)currentCallback))
			{
				continue;
			}
			TiValueRef exception = NULL;
			TiObjectCallAsFunction(context, (TiObjectRef)currentCallback, (TiObjectRef)eventTargetRef, 1, (TiValueRef*)&eventObjectRef,&exception);
			if (exception!=NULL)
			{
				id excm = TiBindingTiValueToNSObject(context, exception);
				[[TiExceptionHandler defaultExceptionHandler] reportScriptError:[TiUtils scriptErrorValue:excm]];
			}
			
			// Note cancel bubble
			cancelBubbleValue = TiObjectGetProperty(context, eventObjectRef, jsEventCancelBubbleStringRef, NULL);
			if(TiValueToBoolean(context,cancelBubbleValue)){
				event->cancelBubble = true; //Because we only set true, not read nor set false, there's no race condition?
			}
		}
	}
	
	int pendingEvents = OSAtomicDecrement32Barrier(&event->pendingEvents);
	if(pendingEvents > 0){
		//Only the last event process gets to do propagation.
		return;
	}
	
	//Last one processing the event for this proxy, pass it on to the parent.
	TiProxy * newTarget = TiBindingEventNextBubbleTargetProxy(event, event->targetProxy, YES);
	if(event->targetProxy!=newTarget){
		[event->targetProxy release];
		event->targetProxy = [newTarget retain];
	}
	TiBindingEventFire(event);
	//See who gets it next.
	
}

void TiBindingEventDispose(TiBindingEvent event)
{
	[event->targetProxy release];
	[event->sourceProxy release];
	[event->eventString release];
	[event->payloadDictionary release];
	[event->errorMessageString release];
	if (event->eventStringRef != NULL) {
		TiStringRelease(event->eventStringRef);
	}
	if (event->errorMessageStringRef != NULL) {
		TiStringRelease(event->errorMessageStringRef);
	}
	if (event->eventObjectRef != NULL) {
		TiValueUnprotect(event->contextRef, event->eventObjectRef);
	}
	if (event->contextRef != NULL) {
		//TODO: Do we protect and release the context ref?
	}
	free(event);
}
