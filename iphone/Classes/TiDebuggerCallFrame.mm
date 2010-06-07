/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef DEBUGGER_ENABLED

/*
 * Copyright (C) 2008 Apple Inc. All Rights Reserved.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
#import "TiDebuggerCallFrame.h"

#include "config.h"
#include "TiDebuggerCallFrame.h"

#include <debugger/DebuggerCallFrame.h>
#include <runtime/TiGlobalObject.h>
#include <runtime/Completion.h>
#include <runtime/TiLock.h>
#include <runtime/TiObject.h>
#include <runtime/TiValue.h>

using namespace TI;

namespace Ti {
    
	TiDebuggerCallFrame::TiDebuggerCallFrame(const DebuggerCallFrame& debuggerCallFrame, PassRefPtr<TiDebuggerCallFrame> caller, intptr_t sourceID, int line)
    : m_debuggerCallFrame(debuggerCallFrame)
    , m_caller(caller)
    , m_sourceID(sourceID)
    , m_line(line)
    , m_isValid(true)
	{
	}
	
	TiDebuggerCallFrame* TiDebuggerCallFrame::caller()
	{
		return m_caller.get();
	}
	
	const TI::ScopeChainNode* TiDebuggerCallFrame::scopeChain() const
	{
		ASSERT(m_isValid);
		if (!m_isValid)
			return 0;
		return m_debuggerCallFrame.scopeChain();
	}
	
	TI::TiGlobalObject* TiDebuggerCallFrame::dynamicGlobalObject() const
	{
		ASSERT(m_isValid);
		if (!m_isValid)
			return 0;
		return m_debuggerCallFrame.dynamicGlobalObject();
	}
	
	NSString* TiDebuggerCallFrame::functionName() const
	{
		ASSERT(m_isValid);
		if (!m_isValid)
			return @"<invalid>";
		UString functionName = m_debuggerCallFrame.calculatedFunctionName();
		if (functionName.isEmpty())
			return @"<empty>";
		return [NSString stringWithCString:functionName.UTF8String().c_str() encoding:NSUTF8StringEncoding];
	}
	
	DebuggerCallFrame::Type TiDebuggerCallFrame::type() const
	{
		ASSERT(m_isValid);
		if (!m_isValid)
			return DebuggerCallFrame::ProgramType;
		return m_debuggerCallFrame.type();
	}
	
	TiObject* TiDebuggerCallFrame::thisObject() const
	{
		ASSERT(m_isValid);
		if (!m_isValid)
			return 0;
		return m_debuggerCallFrame.thisObject();
	}
	
	// Evaluate some JavaScript code in the scope of this frame.
	TiValue TiDebuggerCallFrame::evaluate(const UString& script, TiValue& exception) const
	{
		ASSERT(m_isValid);
		if (!m_isValid)
			return jsNull();
		
		TiLock lock(SilenceAssertionsOnly);
		return m_debuggerCallFrame.evaluate(script, exception);
		//return DebuggerCallFrame_evaluateInWorld(m_debuggerCallFrame, script, exception);
	}
	
}

#endif