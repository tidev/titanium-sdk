/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef DEBUGGER_ENABLED

#import "TiDebuggerContext.h"
#import "TiDebugger.h"
#import "KrollContext.h"
#import <parser/SourceCode.h>

using namespace TI;

namespace Ti
{
	TiDebuggerContext::TiDebuggerContext(KrollContext *ctx)
	{
		context = [ctx retain];
	}
	TiDebuggerContext::~TiDebuggerContext()
	{
		[context release];
	}
	void TiDebuggerContext::detach(TiGlobalObject* g)
	{
		Debugger::detach(g);
	}
	void TiDebuggerContext::beginScriptEval(const char* url_)
	{
		printf("begin script eval = %s\n",url_);
		inParse=true;
		parseDepth=0;
		url = [[NSString stringWithCString:url_ encoding:NSUTF8StringEncoding] retain];
	}
	void TiDebuggerContext::endScriptEval()
	{
		inParse=false;
		RELEASE_TO_NIL(url);
	}
	void TiDebuggerContext::sourceParsed(TiExcState* exec, const SourceCode& source, int errorLineNumber, const UString& errorMessage)
	{
		parseDepth++;
		if (parseDepth==1 && inParse)
		{
			[[TiDebugger sharedDebugger] sourceParsed:url sourceId:source.provider()->asID() context:context];
		}
	}
	void TiDebuggerContext::exception(const DebuggerCallFrame& callFrame, intptr_t sourceID, int lineNumber)
	{
		printf("exception\n");
		[[TiDebugger sharedDebugger] exception:callFrame sourceId:sourceID lineNumber:lineNumber context:context];
	}
	void TiDebuggerContext::atStatement(const DebuggerCallFrame& callFrame, intptr_t sourceID, int lineNumber)
	{
		printf("at statement\n");
		[[TiDebugger sharedDebugger] atStatement:callFrame sourceId:sourceID lineNumber:lineNumber context:context];
	}
	void TiDebuggerContext::callEvent(const DebuggerCallFrame& callFrame, intptr_t sourceID, int lineNumber)
	{
		printf("call event\n");
		[[TiDebugger sharedDebugger] callEvent:callFrame sourceId:sourceID lineNumber:lineNumber context:context];
	}
	void TiDebuggerContext::returnEvent(const DebuggerCallFrame& callFrame, intptr_t sourceID, int lineNumber)
	{
		printf("return event\n");
		[[TiDebugger sharedDebugger] returnEvent:callFrame sourceId:sourceID lineNumber:lineNumber context:context];
	}
	void TiDebuggerContext::willExecuteProgram(const DebuggerCallFrame& callFrame, intptr_t sourceID, int lineNumber)
	{
		printf("will execute program\n");
		[[TiDebugger sharedDebugger] willExecuteProgram:callFrame sourceId:sourceID lineNumber:lineNumber context:context];
	}
	void TiDebuggerContext::didExecuteProgram(const DebuggerCallFrame& callFrame, intptr_t sourceID, int lineNumber)
	{
		printf("did execute program\n");
		[[TiDebugger sharedDebugger] didExecuteProgram:callFrame sourceId:sourceID lineNumber:lineNumber context:context];
	}
	void TiDebuggerContext::didReachBreakpoint(const DebuggerCallFrame& callFrame, intptr_t sourceID, int lineNumber)
	{
		printf("did reach breakpoint\n");
		[[TiDebugger sharedDebugger] didReachBreakpoint:callFrame sourceId:sourceID lineNumber:lineNumber context:context];
	}
}

#endif
