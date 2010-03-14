/**
 * Appcelerator Titanium License
 * This source code and all modifications done by Appcelerator
 * are licensed under the Apache Public License (version 2) and
 * are Copyright (c) 2009 by Appcelerator, Inc.
 */

/*
 * Copyright (C) 2006, 2008 Apple Inc. All rights reserved.
 * Copyright (C) 2007 Eric Seidel <eric@webkit.org>
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

#include "APICast.h"
#include "Error.h"
#include "TiCallbackFunction.h"
#include "TiClassRef.h"
#include "TiGlobalObject.h"
#include "TiLock.h"
#include "TiObjectRef.h"
#include "TiString.h"
#include "TiStringRef.h"
#include "OpaqueTiString.h"
#include "PropertyNameArray.h"
#include <wtf/Vector.h>

namespace TI {

template <class Base>
inline TiCallbackObject<Base>* TiCallbackObject<Base>::asCallbackObject(TiValue value)
{
    ASSERT(asObject(value)->inherits(&info));
    return static_cast<TiCallbackObject*>(asObject(value));
}

template <class Base>
TiCallbackObject<Base>::TiCallbackObject(TiExcState* exec, NonNullPassRefPtr<Structure> structure, TiClassRef jsClass, void* data)
    : Base(structure)
    , m_callbackObjectData(new TiCallbackObjectData(data, jsClass))
{
    init(exec);
}

// Global object constructor.
// FIXME: Move this into a separate TiGlobalCallbackObject class derived from this one.
template <class Base>
TiCallbackObject<Base>::TiCallbackObject(TiClassRef jsClass)
    : Base()
    , m_callbackObjectData(new TiCallbackObjectData(0, jsClass))
{
    ASSERT(Base::isGlobalObject());
    init(static_cast<TiGlobalObject*>(this)->globalExec());
}

template <class Base>
void TiCallbackObject<Base>::init(TiExcState* exec)
{
    ASSERT(exec);
    
    Vector<TiObjectInitializeCallback, 16> initRoutines;
    TiClassRef jsClass = classRef();
    do {
        if (TiObjectInitializeCallback initialize = jsClass->initialize)
            initRoutines.append(initialize);
    } while ((jsClass = jsClass->parentClass));
    
    // initialize from base to derived
    for (int i = static_cast<int>(initRoutines.size()) - 1; i >= 0; i--) {
        TiLock::DropAllLocks dropAllLocks(exec);
        TiObjectInitializeCallback initialize = initRoutines[i];
        initialize(toRef(exec), toRef(this));
    }
}

template <class Base>
TiCallbackObject<Base>::~TiCallbackObject()
{
    TiObjectRef thisRef = toRef(this);
    
    for (TiClassRef jsClass = classRef(); jsClass; jsClass = jsClass->parentClass)
        if (TiObjectFinalizeCallback finalize = jsClass->finalize)
            finalize(thisRef);
}

template <class Base>
UString TiCallbackObject<Base>::className() const
{
    UString thisClassName = classRef()->className();
    if (!thisClassName.isEmpty())
        return thisClassName;
    
    return Base::className();
}

template <class Base>
bool TiCallbackObject<Base>::getOwnPropertySlot(TiExcState* exec, const Identifier& propertyName, PropertySlot& slot)
{
    TiContextRef ctx = toRef(exec);
    TiObjectRef thisRef = toRef(this);
    RefPtr<OpaqueTiString> propertyNameRef;
    
    for (TiClassRef jsClass = classRef(); jsClass; jsClass = jsClass->parentClass) {
        // optional optimization to bypass getProperty in cases when we only need to know if the property exists
        if (TiObjectHasPropertyCallback hasProperty = jsClass->hasProperty) {
            if (!propertyNameRef)
                propertyNameRef = OpaqueTiString::create(propertyName.ustring());
            TiLock::DropAllLocks dropAllLocks(exec);
            if (hasProperty(ctx, thisRef, propertyNameRef.get())) {
                slot.setCustom(this, callbackGetter);
                return true;
            }
        } else if (TiObjectGetPropertyCallback getProperty = jsClass->getProperty) {
            if (!propertyNameRef)
                propertyNameRef = OpaqueTiString::create(propertyName.ustring());
            TiValueRef exception = 0;
            TiValueRef value;
            {
                TiLock::DropAllLocks dropAllLocks(exec);
                value = getProperty(ctx, thisRef, propertyNameRef.get(), &exception);
            }
            exec->setException(toJS(exec, exception));
            if (value) {
                slot.setValue(toJS(exec, value));
                return true;
            }
            if (exception) {
                slot.setValue(jsUndefined());
                return true;
            }
        }
        
        if (OpaqueTiClassStaticValuesTable* staticValues = jsClass->staticValues(exec)) {
            if (staticValues->contains(propertyName.ustring().rep())) {
                slot.setCustom(this, staticValueGetter);
                return true;
            }
        }
        
        if (OpaqueTiClassStaticFunctionsTable* staticFunctions = jsClass->staticFunctions(exec)) {
            if (staticFunctions->contains(propertyName.ustring().rep())) {
                slot.setCustom(this, staticFunctionGetter);
                return true;
            }
        }
    }
    
    return Base::getOwnPropertySlot(exec, propertyName, slot);
}

template <class Base>
bool TiCallbackObject<Base>::getOwnPropertySlot(TiExcState* exec, unsigned propertyName, PropertySlot& slot)
{
    return getOwnPropertySlot(exec, Identifier::from(exec, propertyName), slot);
}

template <class Base>
void TiCallbackObject<Base>::put(TiExcState* exec, const Identifier& propertyName, TiValue value, PutPropertySlot& slot)
{
    TiContextRef ctx = toRef(exec);
    TiObjectRef thisRef = toRef(this);
    RefPtr<OpaqueTiString> propertyNameRef;
    TiValueRef valueRef = toRef(exec, value);
    
    for (TiClassRef jsClass = classRef(); jsClass; jsClass = jsClass->parentClass) {
        if (TiObjectSetPropertyCallback setProperty = jsClass->setProperty) {
            if (!propertyNameRef)
                propertyNameRef = OpaqueTiString::create(propertyName.ustring());
            TiValueRef exception = 0;
            bool result;
            {
                TiLock::DropAllLocks dropAllLocks(exec);
                result = setProperty(ctx, thisRef, propertyNameRef.get(), valueRef, &exception);
            }
            exec->setException(toJS(exec, exception));
            if (result || exception)
                return;
        }
        
        if (OpaqueTiClassStaticValuesTable* staticValues = jsClass->staticValues(exec)) {
            if (StaticValueEntry* entry = staticValues->get(propertyName.ustring().rep())) {
                if (entry->attributes & kTiPropertyAttributeReadOnly)
                    return;
                if (TiObjectSetPropertyCallback setProperty = entry->setProperty) {
                    if (!propertyNameRef)
                        propertyNameRef = OpaqueTiString::create(propertyName.ustring());
                    TiValueRef exception = 0;
                    bool result;
                    {
                        TiLock::DropAllLocks dropAllLocks(exec);
                        result = setProperty(ctx, thisRef, propertyNameRef.get(), valueRef, &exception);
                    }
                    exec->setException(toJS(exec, exception));
                    if (result || exception)
                        return;
                } else
                    throwError(exec, ReferenceError, "Attempt to set a property that is not settable.");
            }
        }
        
        if (OpaqueTiClassStaticFunctionsTable* staticFunctions = jsClass->staticFunctions(exec)) {
            if (StaticFunctionEntry* entry = staticFunctions->get(propertyName.ustring().rep())) {
                if (entry->attributes & kTiPropertyAttributeReadOnly)
                    return;
                TiCallbackObject<Base>::putDirect(propertyName, value); // put as override property
                return;
            }
        }
    }
    
    return Base::put(exec, propertyName, value, slot);
}

template <class Base>
bool TiCallbackObject<Base>::deleteProperty(TiExcState* exec, const Identifier& propertyName)
{
    TiContextRef ctx = toRef(exec);
    TiObjectRef thisRef = toRef(this);
    RefPtr<OpaqueTiString> propertyNameRef;
    
    for (TiClassRef jsClass = classRef(); jsClass; jsClass = jsClass->parentClass) {
        if (TiObjectDeletePropertyCallback deleteProperty = jsClass->deleteProperty) {
            if (!propertyNameRef)
                propertyNameRef = OpaqueTiString::create(propertyName.ustring());
            TiValueRef exception = 0;
            bool result;
            {
                TiLock::DropAllLocks dropAllLocks(exec);
                result = deleteProperty(ctx, thisRef, propertyNameRef.get(), &exception);
            }
            exec->setException(toJS(exec, exception));
            if (result || exception)
                return true;
        }
        
        if (OpaqueTiClassStaticValuesTable* staticValues = jsClass->staticValues(exec)) {
            if (StaticValueEntry* entry = staticValues->get(propertyName.ustring().rep())) {
                if (entry->attributes & kTiPropertyAttributeDontDelete)
                    return false;
                return true;
            }
        }
        
        if (OpaqueTiClassStaticFunctionsTable* staticFunctions = jsClass->staticFunctions(exec)) {
            if (StaticFunctionEntry* entry = staticFunctions->get(propertyName.ustring().rep())) {
                if (entry->attributes & kTiPropertyAttributeDontDelete)
                    return false;
                return true;
            }
        }
    }
    
    return Base::deleteProperty(exec, propertyName);
}

template <class Base>
bool TiCallbackObject<Base>::deleteProperty(TiExcState* exec, unsigned propertyName)
{
    return deleteProperty(exec, Identifier::from(exec, propertyName));
}

template <class Base>
ConstructType TiCallbackObject<Base>::getConstructData(ConstructData& constructData)
{
    for (TiClassRef jsClass = classRef(); jsClass; jsClass = jsClass->parentClass) {
        if (jsClass->callAsConstructor) {
            constructData.native.function = construct;
            return ConstructTypeHost;
        }
    }
    return ConstructTypeNone;
}

template <class Base>
TiObject* TiCallbackObject<Base>::construct(TiExcState* exec, TiObject* constructor, const ArgList& args)
{
    TiContextRef execRef = toRef(exec);
    TiObjectRef constructorRef = toRef(constructor);
    
    for (TiClassRef jsClass = static_cast<TiCallbackObject<Base>*>(constructor)->classRef(); jsClass; jsClass = jsClass->parentClass) {
        if (TiObjectCallAsConstructorCallback callAsConstructor = jsClass->callAsConstructor) {
            int argumentCount = static_cast<int>(args.size());
            Vector<TiValueRef, 16> arguments(argumentCount);
            for (int i = 0; i < argumentCount; i++)
                arguments[i] = toRef(exec, args.at(i));
            TiValueRef exception = 0;
            TiObject* result;
            {
                TiLock::DropAllLocks dropAllLocks(exec);
                result = toJS(callAsConstructor(execRef, constructorRef, argumentCount, arguments.data(), &exception));
            }
            exec->setException(toJS(exec, exception));
            return result;
        }
    }
    
    ASSERT_NOT_REACHED(); // getConstructData should prevent us from reaching here
    return 0;
}

template <class Base>
bool TiCallbackObject<Base>::hasInstance(TiExcState* exec, TiValue value, TiValue)
{
    TiContextRef execRef = toRef(exec);
    TiObjectRef thisRef = toRef(this);
    
    for (TiClassRef jsClass = classRef(); jsClass; jsClass = jsClass->parentClass) {
        if (TiObjectHasInstanceCallback hasInstance = jsClass->hasInstance) {
            TiValueRef valueRef = toRef(exec, value);
            TiValueRef exception = 0;
            bool result;
            {
                TiLock::DropAllLocks dropAllLocks(exec);
                result = hasInstance(execRef, thisRef, valueRef, &exception);
            }
            exec->setException(toJS(exec, exception));
            return result;
        }
    }
    return false;
}

template <class Base>
CallType TiCallbackObject<Base>::getCallData(CallData& callData)
{
    for (TiClassRef jsClass = classRef(); jsClass; jsClass = jsClass->parentClass) {
        if (jsClass->callAsFunction) {
            callData.native.function = call;
            return CallTypeHost;
        }
    }
    return CallTypeNone;
}

template <class Base>
TiValue TiCallbackObject<Base>::call(TiExcState* exec, TiObject* functionObject, TiValue thisValue, const ArgList& args)
{
    TiContextRef execRef = toRef(exec);
    TiObjectRef functionRef = toRef(functionObject);
    TiObjectRef thisObjRef = toRef(thisValue.toThisObject(exec));
    
    for (TiClassRef jsClass = static_cast<TiCallbackObject<Base>*>(functionObject)->classRef(); jsClass; jsClass = jsClass->parentClass) {
        if (TiObjectCallAsFunctionCallback callAsFunction = jsClass->callAsFunction) {
            int argumentCount = static_cast<int>(args.size());
            Vector<TiValueRef, 16> arguments(argumentCount);
            for (int i = 0; i < argumentCount; i++)
                arguments[i] = toRef(exec, args.at(i));
            TiValueRef exception = 0;
            TiValue result;
            {
                TiLock::DropAllLocks dropAllLocks(exec);
                result = toJS(exec, callAsFunction(execRef, functionRef, thisObjRef, argumentCount, arguments.data(), &exception));
            }
            exec->setException(toJS(exec, exception));
            return result;
        }
    }
    
    ASSERT_NOT_REACHED(); // getCallData should prevent us from reaching here
    return TiValue();
}

template <class Base>
void TiCallbackObject<Base>::getOwnPropertyNames(TiExcState* exec, PropertyNameArray& propertyNames)
{
    TiContextRef execRef = toRef(exec);
    TiObjectRef thisRef = toRef(this);
    
    for (TiClassRef jsClass = classRef(); jsClass; jsClass = jsClass->parentClass) {
        if (TiObjectGetPropertyNamesCallback getPropertyNames = jsClass->getPropertyNames) {
            TiLock::DropAllLocks dropAllLocks(exec);
            getPropertyNames(execRef, thisRef, toRef(&propertyNames));
        }
        
        if (OpaqueTiClassStaticValuesTable* staticValues = jsClass->staticValues(exec)) {
            typedef OpaqueTiClassStaticValuesTable::const_iterator iterator;
            iterator end = staticValues->end();
            for (iterator it = staticValues->begin(); it != end; ++it) {
                UString::Rep* name = it->first.get();
                StaticValueEntry* entry = it->second;
                if (entry->getProperty && !(entry->attributes & kTiPropertyAttributeDontEnum))
                    propertyNames.add(Identifier(exec, name));
            }
        }
        
        if (OpaqueTiClassStaticFunctionsTable* staticFunctions = jsClass->staticFunctions(exec)) {
            typedef OpaqueTiClassStaticFunctionsTable::const_iterator iterator;
            iterator end = staticFunctions->end();
            for (iterator it = staticFunctions->begin(); it != end; ++it) {
                UString::Rep* name = it->first.get();
                StaticFunctionEntry* entry = it->second;
                if (!(entry->attributes & kTiPropertyAttributeDontEnum))
                    propertyNames.add(Identifier(exec, name));
            }
        }
    }
    
    Base::getOwnPropertyNames(exec, propertyNames);
}

template <class Base>
double TiCallbackObject<Base>::toNumber(TiExcState* exec) const
{
    // We need this check to guard against the case where this object is rhs of
    // a binary expression where lhs threw an exception in its conversion to
    // primitive
    if (exec->hadException())
        return NaN;
    TiContextRef ctx = toRef(exec);
    TiObjectRef thisRef = toRef(this);
    
    for (TiClassRef jsClass = classRef(); jsClass; jsClass = jsClass->parentClass)
        if (TiObjectConvertToTypeCallback convertToType = jsClass->convertToType) {
            TiValueRef exception = 0;
            TiValueRef value;
            {
                TiLock::DropAllLocks dropAllLocks(exec);
                value = convertToType(ctx, thisRef, kTITypeNumber, &exception);
            }
            if (exception) {
                exec->setException(toJS(exec, exception));
                return 0;
            }

            double dValue;
            return toJS(exec, value).getNumber(dValue) ? dValue : NaN;
        }
            
    return Base::toNumber(exec);
}

template <class Base>
UString TiCallbackObject<Base>::toString(TiExcState* exec) const
{
    TiContextRef ctx = toRef(exec);
    TiObjectRef thisRef = toRef(this);
    
    for (TiClassRef jsClass = classRef(); jsClass; jsClass = jsClass->parentClass)
        if (TiObjectConvertToTypeCallback convertToType = jsClass->convertToType) {
            TiValueRef exception = 0;
            TiValueRef value;
            {
                TiLock::DropAllLocks dropAllLocks(exec);
                value = convertToType(ctx, thisRef, kTITypeString, &exception);
            }
            if (exception) {
                exec->setException(toJS(exec, exception));
                return "";
            }
            return toJS(exec, value).getString();
        }
            
    return Base::toString(exec);
}

template <class Base>
void TiCallbackObject<Base>::setPrivate(void* data)
{
    m_callbackObjectData->privateData = data;
}

template <class Base>
void* TiCallbackObject<Base>::getPrivate()
{
    return m_callbackObjectData->privateData;
}

template <class Base>
bool TiCallbackObject<Base>::inherits(TiClassRef c) const
{
    for (TiClassRef jsClass = classRef(); jsClass; jsClass = jsClass->parentClass)
        if (jsClass == c)
            return true;
    
    return false;
}

template <class Base>
TiValue TiCallbackObject<Base>::staticValueGetter(TiExcState* exec, const Identifier& propertyName, const PropertySlot& slot)
{
    TiCallbackObject* thisObj = asCallbackObject(slot.slotBase());
    
    TiObjectRef thisRef = toRef(thisObj);
    RefPtr<OpaqueTiString> propertyNameRef;
    
    for (TiClassRef jsClass = thisObj->classRef(); jsClass; jsClass = jsClass->parentClass)
        if (OpaqueTiClassStaticValuesTable* staticValues = jsClass->staticValues(exec))
            if (StaticValueEntry* entry = staticValues->get(propertyName.ustring().rep()))
                if (TiObjectGetPropertyCallback getProperty = entry->getProperty) {
                    if (!propertyNameRef)
                        propertyNameRef = OpaqueTiString::create(propertyName.ustring());
                    TiValueRef exception = 0;
                    TiValueRef value;
                    {
                        TiLock::DropAllLocks dropAllLocks(exec);
                        value = getProperty(toRef(exec), thisRef, propertyNameRef.get(), &exception);
                    }
                    exec->setException(toJS(exec, exception));
                    if (value)
                        return toJS(exec, value);
                    if (exception)
                        return jsUndefined();
                }
                    
    return throwError(exec, ReferenceError, "Static value property defined with NULL getProperty callback.");
}

template <class Base>
TiValue TiCallbackObject<Base>::staticFunctionGetter(TiExcState* exec, const Identifier& propertyName, const PropertySlot& slot)
{
    TiCallbackObject* thisObj = asCallbackObject(slot.slotBase());
    
    // Check for cached or override property.
    PropertySlot slot2(thisObj);
    if (thisObj->Base::getOwnPropertySlot(exec, propertyName, slot2))
        return slot2.getValue(exec, propertyName);
    
    for (TiClassRef jsClass = thisObj->classRef(); jsClass; jsClass = jsClass->parentClass) {
        if (OpaqueTiClassStaticFunctionsTable* staticFunctions = jsClass->staticFunctions(exec)) {
            if (StaticFunctionEntry* entry = staticFunctions->get(propertyName.ustring().rep())) {
                if (TiObjectCallAsFunctionCallback callAsFunction = entry->callAsFunction) {
                    TiObject* o = new (exec) TiCallbackFunction(exec, callAsFunction, propertyName);
                    thisObj->putDirect(propertyName, o, entry->attributes);
                    return o;
                }
            }
        }
    }
    
    return throwError(exec, ReferenceError, "Static function property defined with NULL callAsFunction callback.");
}

template <class Base>
TiValue TiCallbackObject<Base>::callbackGetter(TiExcState* exec, const Identifier& propertyName, const PropertySlot& slot)
{
    TiCallbackObject* thisObj = asCallbackObject(slot.slotBase());
    
    TiObjectRef thisRef = toRef(thisObj);
    RefPtr<OpaqueTiString> propertyNameRef;
    
    for (TiClassRef jsClass = thisObj->classRef(); jsClass; jsClass = jsClass->parentClass)
        if (TiObjectGetPropertyCallback getProperty = jsClass->getProperty) {
            if (!propertyNameRef)
                propertyNameRef = OpaqueTiString::create(propertyName.ustring());
            TiValueRef exception = 0;
            TiValueRef value;
            {
                TiLock::DropAllLocks dropAllLocks(exec);
                value = getProperty(toRef(exec), thisRef, propertyNameRef.get(), &exception);
            }
            exec->setException(toJS(exec, exception));
            if (value)
                return toJS(exec, value);
            if (exception)
                return jsUndefined();
        }
            
    return throwError(exec, ReferenceError, "hasProperty callback returned true for a property that doesn't exist.");
}

} // namespace TI
