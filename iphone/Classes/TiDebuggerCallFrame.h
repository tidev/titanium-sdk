/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
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
#ifdef DEBUGGER_ENABLED

#ifndef TiDebuggerCallFrame_h
#define TiDebuggerCallFrame_h

#include "config.h"
#include <interpreter/CallFrame.h>
#include <wtf/PassRefPtr.h>
#include <wtf/RefCounted.h>
#include <debugger/DebuggerCallFrame.h>

namespace Ti {
	
    class TiDebuggerCallFrame : public RefCounted<TiDebuggerCallFrame> {
    public:
        static PassRefPtr<TiDebuggerCallFrame> create(const TI::DebuggerCallFrame& debuggerCallFrame, PassRefPtr<TiDebuggerCallFrame> caller, intptr_t sourceID, int line)
        {
            return adoptRef(new TiDebuggerCallFrame(debuggerCallFrame, caller, sourceID, line));
        }
		
        void invalidate()
        {
            m_isValid = false;
            m_debuggerCallFrame = 0;
        }
		
        bool isValid() const { return m_isValid; }
		
        TiDebuggerCallFrame* caller();
		
        intptr_t sourceID() const { return m_sourceID; }
        int line() const { return m_line; }
        void update(const TI::DebuggerCallFrame& debuggerCallFrame, intptr_t sourceID, int line)
        {
            m_debuggerCallFrame = debuggerCallFrame;
            m_line = line;
            m_sourceID = sourceID;
            m_isValid = true;
        }
		
        NSString* functionName() const;
        TI::DebuggerCallFrame::Type type() const;
        const TI::ScopeChainNode* scopeChain() const;
        TI::TiGlobalObject* dynamicGlobalObject() const;
		
        TI::TiObject* thisObject() const;
        TI::TiValue evaluate(const TI::UString& script, TI::TiValue& exception) const;
        
    private:
        TiDebuggerCallFrame(const TI::DebuggerCallFrame&, PassRefPtr<TiDebuggerCallFrame> caller, intptr_t sourceID, int line);
		
        TI::DebuggerCallFrame m_debuggerCallFrame;
        RefPtr<TiDebuggerCallFrame> m_caller;
        intptr_t m_sourceID;
        int m_line;
        bool m_isValid;
    };
	
} 

#endif

#endif