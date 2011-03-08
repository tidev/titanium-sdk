/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef DEBUGGER_ENABLED

#include "TiBase.h"

#define TI_APPLICATION_DEBUG_HOST_STR STRING(TI_APPLICATION_DEBUG_HOST)

extern "C" void* TiDebuggerCreate(KrollContext*,TiObjectRef);
extern "C" void  TiDebuggerDestroy(KrollContext*,TiObjectRef,void*);
extern "C" void  TiDebuggerStart(const char*,int);
extern "C" void  TiDebuggerStop();
extern "C" void  TiDebuggerBeginScript(KrollContext*,const char*);
extern "C" void  TiDebuggerEndScript(KrollContext*);

#endif