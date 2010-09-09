/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.kroll;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.util.Log;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.EcmaError;
import org.mozilla.javascript.EvaluatorException;
import org.mozilla.javascript.Function;

public class KrollCallback implements IKrollCallable
{
	private static final String LCAT = "KrollCallback";

	private KrollContext kroll;
	private KrollObject thisObj;
	private Function method;

	public KrollCallback(KrollContext kroll, KrollObject thisObj, Function method) {
		this.kroll = kroll;
		this.thisObj = thisObj;
		this.method = method;
	}

	public void callWithProperties(TiDict data) {
		if (data == null) {
			data = new TiDict();
		}

		call(new Object[] { data });
	}
	
	public boolean isWithinTiContext(TiContext context)
	{
		if (kroll != null) {
			TiContext krollTiContext = kroll.getTiContext();
			if (krollTiContext != null) {
				return (krollTiContext.equals(context));
			}
		}
		return false;
	}

	public void call()
	{
		call(new Object[0]);
	}

	public void call(Object[] args)
	{
		if (args == null) args = new Object[0];
		final Object[] fArgs = args;

		kroll.post(new Runnable(){
			public void run() {
				Context ctx = kroll.enter();

				try {
					Object[] jsArgs = new Object[fArgs.length];
					for (int i = 0; i < fArgs.length; i++) {
						Object jsArg = KrollObject.fromNative(fArgs[i], kroll);
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
	}

	@Override
	public boolean equals(Object obj)
	{
		KrollCallback kb = (KrollCallback) obj;
		return method.equals(kb.method);
	}
	
	protected Object toJSFunction() {
		return Context.javaToJS(method, kroll.getScope());
	}
	
}
