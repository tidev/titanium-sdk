/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.kroll;

import org.appcelerator.kroll.KrollConverter;
import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollMethod;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.util.Log;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.EcmaError;
import org.mozilla.javascript.EvaluatorException;
import org.mozilla.javascript.Function;

public class KrollCallback extends KrollMethod
{
	private static final String LCAT = "KrollCallback";

	private KrollContext kroll;
	private KrollObject thisObj;
	private Function method;

	public KrollCallback(KrollContext kroll, KrollObject thisObj, Function method) {
		super(null);
		
		this.kroll = kroll;
		this.thisObj = thisObj;
		this.method = method;
	}
	
	public void call() {
		call(null);
	}

	public void call(Object[] args) {
		KrollInvocation inv = KrollInvocation.createMethodInvocation(kroll.getTiContext(), thisObj, null, this, thisObj.getProxy());
		invoke(inv, args);
	}
	
	@Override
	public Object invoke(final KrollInvocation invocation, Object[] args) {
		if (args == null) args = new Object[0];
		final Object[] fArgs = args;

		kroll.post(new Runnable(){
			public void run() {
				Context ctx = kroll.enter();

				try {
					Object[] jsArgs = new Object[fArgs.length];
					for (int i = 0; i < fArgs.length; i++) {
						Object jsArg = KrollConverter.getInstance().convertNative(invocation, fArgs[i]);
						jsArgs[i] = jsArg;
					}
					method.call(ctx, thisObj, thisObj, jsArgs);
				} catch (EcmaError e) {
					Log.e(LCAT, "ECMA Error evaluating source: " + e.getMessage(), e);
					Context.reportRuntimeError(e.getMessage(), e.sourceName(), e.lineNumber(), e.lineSource(), e.columnNumber());
				} catch (EvaluatorException e) {
					Log.e(LCAT, "Error evaluating source: " + e.getMessage(), e);
					Context.reportRuntimeError(e.getMessage(), e.sourceName(), e.lineNumber(), e.lineSource(), e.columnNumber());
				} catch (Exception e) {
					Log.e(LCAT, "Error: " + e.getMessage(), e);
					Context.throwAsScriptRuntimeEx(e);
				} catch (Throwable e) {
					Log.e(LCAT, "Unhandled throwable: " + e.getMessage(), e);
					Context.throwAsScriptRuntimeEx(e);
				} finally {
					kroll.exit();
				}
			}
		});
		return KrollProxy.UNDEFINED;
	}

	@Override
	public boolean equals(Object obj)
	{
		KrollCallback kb = (KrollCallback) obj;
		return method.equals(kb.method);
	}
}
