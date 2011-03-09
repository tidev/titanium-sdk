/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef DEBUGGER_ENABLED

#include "TiBase.h"

extern "C" void* TiDebuggerCreate(KrollContext*,TiObjectRef);
extern "C" void  TiDebuggerDestroy(KrollContext*,TiObjectRef,void*);
extern "C" void  TiDebuggerStart(NSString*,int);
extern "C" void  TiDebuggerStop();
extern "C" void  TiDebuggerBeginScript(KrollContext*,const char*);
extern "C" void  TiDebuggerEndScript(KrollContext*);

#endif