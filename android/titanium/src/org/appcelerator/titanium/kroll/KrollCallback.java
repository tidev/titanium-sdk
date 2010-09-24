/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.kroll;

import org.appcelerator.kroll.KrollConverter;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollMethod;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.EcmaError;
import org.mozilla.javascript.EvaluatorException;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;

@SuppressWarnings("serial")
public class KrollCallback extends KrollMethod
{
	private static final String LCAT = "KrollCallback";

	protected KrollContext kroll;
	protected Scriptable scope;
	protected Scriptable thisObj;
	protected Function method;

	public KrollCallback(KrollContext context, Scriptable scope, Scriptable thisObj, Function method) {
		super(null);
		
		this.kroll = context;
		this.scope = scope;
		this.thisObj = thisObj;
		this.method = method;
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

	public void call(KrollDict properties) {
		call(new Object[] { properties });
	}
	
	public void call(Object[] args) {
		String methodName = (String) method.get("name", method);
		if (methodName.length() == 0) {
			methodName = "(anonymous)";
		}
		
		KrollInvocation inv = KrollInvocation.createMethodInvocation(kroll == null ? TiContext.getCurrentTiContext() : kroll.getTiContext(),
			scope, thisObj, methodName, this, (thisObj instanceof KrollObject) ? ((KrollObject)thisObj).getProxy() : null);
		
		invoke(inv, args);
	}
	
	@Override
	public Object invoke(final KrollInvocation invocation, Object[] args) {
		if (args == null) args = new Object[0];
		final Object[] fArgs = args;
		KrollContext kroll = invocation.getTiContext().getKrollContext();
		if (kroll == null) {
			kroll = this.kroll;
		}
		final KrollContext fKroll = kroll;
		fKroll.post(new Runnable(){
			public void run() {
				Context ctx = fKroll.enter();

				try {
					Object[] jsArgs = new Object[fArgs.length];
					for (int i = 0; i < fArgs.length; i++) {
						Object jsArg = KrollConverter.getInstance().convertNative(invocation, fArgs[i]);
						jsArgs[i] = jsArg;
					}
					method.call(ctx, scope, thisObj, jsArgs);
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
					fKroll.exit();
				}
			}
		});
		return KrollProxy.UNDEFINED;
	}

	@Override
	public boolean equals(Object obj)
	{
		if (!(obj instanceof KrollCallback)) {
			return false;
		}
		
		KrollCallback kb = (KrollCallback) obj;
		return method.equals(kb.method);
	}
	
	public Object toJSFunction() {
		return Context.javaToJS(method, kroll.getScope());
	}
	
}
