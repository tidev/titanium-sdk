/**
 * Appcelerator Titanium License
 * This source code and all modifications done by Appcelerator
 * are licensed under the Apache Public License (version 2) and
 * are Copyright (c) 2009 by Appcelerator, Inc.
 */

/*
 * Copyright (C) 2006 Apple Computer, Inc.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE COMPUTER, INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE COMPUTER, INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#ifndef APICast_h
#define APICast_h

#include "TiAPIValueWrapper.h"
#include "TiGlobalObject.h"
#include "TiValue.h"
#include <wtf/Platform.h>
#include <wtf/UnusedParam.h>

namespace TI {
    class TiExcState;
    class PropertyNameArray;
    class TiGlobalData;
    class TiObject;
    class TiValue;
}

typedef const struct OpaqueTiContextGroup* TiContextGroupRef;
typedef const struct OpaqueTiContext* TiContextRef;
typedef struct OpaqueTiContext* TiGlobalContextRef;
typedef struct OpaqueTiPropertyNameAccumulator* TiPropertyNameAccumulatorRef;
typedef const struct OpaqueTiValue* TiValueRef;
typedef struct OpaqueTiValue* TiObjectRef;

/* Opaque typing convenience methods */

inline TI::TiExcState* toJS(TiContextRef c)
{
    return reinterpret_cast<TI::TiExcState*>(const_cast<OpaqueTiContext*>(c));
}

inline TI::TiExcState* toJS(TiGlobalContextRef c)
{
    return reinterpret_cast<TI::TiExcState*>(c);
}

inline TI::TiValue toJS(TI::TiExcState*, TiValueRef v)
{
#if USE(JSVALUE32_64)
    TI::TiCell* jsCell = reinterpret_cast<TI::TiCell*>(const_cast<OpaqueTiValue*>(v));
    if (!jsCell)
        return TI::TiValue();
    if (jsCell->isAPIValueWrapper())
        return static_cast<TI::TiAPIValueWrapper*>(jsCell)->value();
    return jsCell;
#else
    return TI::TiValue::decode(reinterpret_cast<TI::EncodedTiValue>(const_cast<OpaqueTiValue*>(v)));
#endif
}

inline TI::TiObject* toJS(TiObjectRef o)
{
    return reinterpret_cast<TI::TiObject*>(o);
}

inline TI::PropertyNameArray* toJS(TiPropertyNameAccumulatorRef a)
{
    return reinterpret_cast<TI::PropertyNameArray*>(a);
}

inline TI::TiGlobalData* toJS(TiContextGroupRef g)
{
    return reinterpret_cast<TI::TiGlobalData*>(const_cast<OpaqueTiContextGroup*>(g));
}

inline TiValueRef toRef(TI::TiExcState* exec, TI::TiValue v)
{
#if USE(JSVALUE32_64)
    if (!v)
        return 0;
    if (!v.isCell())
        return reinterpret_cast<TiValueRef>(asCell(TI::jsAPIValueWrapper(exec, v)));
    return reinterpret_cast<TiValueRef>(asCell(v));
#else
    UNUSED_PARAM(exec);
    return reinterpret_cast<TiValueRef>(TI::TiValue::encode(v));
#endif
}

inline TiObjectRef toRef(TI::TiObject* o)
{
    return reinterpret_cast<TiObjectRef>(o);
}

inline TiObjectRef toRef(const TI::TiObject* o)
{
    return reinterpret_cast<TiObjectRef>(const_cast<TI::TiObject*>(o));
}

inline TiContextRef toRef(TI::TiExcState* e)
{
    return reinterpret_cast<TiContextRef>(e);
}

inline TiGlobalContextRef toGlobalRef(TI::TiExcState* e)
{
    ASSERT(e == e->lexicalGlobalObject()->globalExec());
    return reinterpret_cast<TiGlobalContextRef>(e);
}

inline TiPropertyNameAccumulatorRef toRef(TI::PropertyNameArray* l)
{
    return reinterpret_cast<TiPropertyNameAccumulatorRef>(l);
}

inline TiContextGroupRef toRef(TI::TiGlobalData* g)
{
    return reinterpret_cast<TiContextGroupRef>(g);
}

#endif // APICast_h
