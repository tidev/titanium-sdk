/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef DEBUGGER_ENABLED

#ifndef TI_DEBUGGER_CONTEXT_H_
#define TI_DEBUGGER_CONTEXT_H_


#include "config.h"
#include <debugger/Debugger.h>
#include <runtime/UString.h>
#include <wtf/HashMap.h>
#include <wtf/HashSet.h>
#include <wtf/RefPtr.h>

using namespace TI;

@class KrollContext;

namespace Ti {

    class TiDebuggerContext : public TI::Debugger{
	public:
		TiDebuggerContext(KrollContext*);
		~TiDebuggerContext();

		void detach(TiGlobalObject*);
		void beginScriptEval(const char*);
		void endScriptEval();
	
		void sourceParsed(TiExcState*, const SourceCode&, int errorLineNumber, const UString& errorMessage);
		void exception(const DebuggerCallFrame&, intptr_t sourceID, int lineNumber);
		void atStatement(const DebuggerCallFrame&, intptr_t sourceID, int lineNumber);
		void callEvent(const DebuggerCallFrame&, intptr_t sourceID, int lineNumber);
		void returnEvent(const DebuggerCallFrame&, intptr_t sourceID, int lineNumber);
			
		void willExecuteProgram(const DebuggerCallFrame&, intptr_t sourceID, int lineNumber);
		void didExecuteProgram(const DebuggerCallFrame&, intptr_t sourceID, int lineNumber);
		void didReachBreakpoint(const DebuggerCallFrame&, intptr_t sourceID, int lineNumber);
		
	private:
		KrollContext *context;
		NSString *url;
		bool inParse;
		int parseDepth;
    };
	
} 

#endif 

#endif