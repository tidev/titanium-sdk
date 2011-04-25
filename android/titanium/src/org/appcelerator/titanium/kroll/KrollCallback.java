/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.kroll;

import org.appcelerator.kroll.KrollConvertable;
import org.appcelerator.kroll.KrollConverter;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollMethod;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.EcmaError;
import org.mozilla.javascript.EvaluatorException;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;

@SuppressWarnings("serial")
public class KrollCallback extends KrollMethod implements KrollConvertable
{
	private static final String LCAT = "KrollCallback";
	protected static final String ANONYMOUS_METHOD_NAME = "(anonymous)";

	protected KrollContext kroll;
	protected Scriptable scope;
	protected Scriptable thisObj;
	protected Function method;

	public KrollCallback(KrollContext context, Scriptable scope, Scriptable thisObj, Function method)
	{
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

	protected KrollInvocation createInvocation()
	{
		return createInvocation(null);
	}

	protected KrollInvocation createInvocation(TiContext context)
	{
		String methodName = ANONYMOUS_METHOD_NAME;
		Object methodNameObject = method.get(TiC.PROPERTY_NAME, method);
		if (methodNameObject != null && methodNameObject instanceof String) {
			String m = (String) methodNameObject;
			if (m.length() > 0) {
				methodName = m;
			}
		}
		if (context == null) {
			context = kroll == null ? TiContext.getCurrentTiContext() : kroll.getTiContext();
		}
		KrollProxy proxy = (thisObj instanceof KrollObject) ? ((KrollObject)thisObj).getProxy() : null;
		KrollInvocation inv = KrollInvocation.createMethodInvocation(context, scope, thisObj, methodName, this, proxy);
		return inv;
	}

	public void callAsync() 
	{
		callAsync(new Object[0]);
	}

	public void callAsync(KrollDict properties)
	{
		callAsync(new Object[] { properties });
	}

	public void callAsync(Object[] args)
	{
		callAsync(null, args);
	}

	public void callAsync(TiContext context, Object[] args) {
		KrollInvocation invocation = createInvocation(context);
		callAsync(invocation, args, true);
	}

	public Object callSync() {
		return callSync(new Object[0]);
	}

	public Object callSync(KrollDict properties) {
		return callSync(new Object[] { properties });
	}

	public Object callSync(Object[] args) {
		return callSync((TiContext)null, args);
	}

	public Object callSync(TiContext context, Object[] args) {
		KrollInvocation invocation = createInvocation(context);
		Object result = callSync(invocation, args);
		invocation.recycle();
		return result;
	}

	protected KrollContext getKrollContext(KrollInvocation invocation) {
		KrollContext kroll = null;
		if (invocation.getTiContext() != null) {
			kroll = invocation.getTiContext().getKrollContext();
		}
		if (kroll == null) {
			kroll = this.kroll;
		}
		return kroll;
	}

	public Object callSync(KrollInvocation invocation, Object[] args) {
		if (args == null) args = new Object[0];
		KrollContext kroll = getKrollContext(invocation);
		Context ctx = kroll.enter();
		try {
			Object[] jsArgs = new Object[args.length];
			for (int i = 0; i < args.length; i++) {
				Object jsArg = KrollConverter.getInstance().convertNative(invocation, args[i]);
				jsArgs[i] = jsArg;
			}
			return KrollConverter.getInstance().convertJavascript(invocation,
				method.call(ctx, scope, thisObj, jsArgs), Object.class);
		} catch (EcmaError e) {
			Log.e(LCAT, "ECMA Error evaluating source, invocation: " + invocation + ", message: "+ e.getMessage(), e);
			Context.reportRuntimeError(e.getMessage(), e.sourceName(), e.lineNumber(), e.lineSource(), e.columnNumber());
		} catch (EvaluatorException e) {
			Log.e(LCAT, "Error evaluating source, invocation: " + invocation + ", message: " + e.getMessage(), e);
			Context.reportRuntimeError(e.getMessage(), e.sourceName(), e.lineNumber(), e.lineSource(), e.columnNumber());
		} catch (Exception e) {
			Log.e(LCAT, "Error, invocation: " + invocation + ", message: " + e.getMessage(), e);
			Context.throwAsScriptRuntimeEx(e);
		} catch (Throwable e) {
			Log.e(LCAT, "Unhandled throwable, invocation:" + invocation + ", message: " + e.getMessage(), e);
			Context.throwAsScriptRuntimeEx(e);
		} finally {
			kroll.exit();
		}
		return KrollProxy.UNDEFINED;
	}

	public void callAsync(final KrollInvocation invocation, final Object[] args, final boolean recycleInvocation) {
		KrollContext kroll = getKrollContext(invocation);
		// Force using the handler here, listeners should post after the top level has stopped blocking
		kroll.getMessageQueue().getHandler().post(new Runnable() {
			public void run() {
				callSync(invocation, args);
				if (recycleInvocation) {
					invocation.recycle();
				}
			}
		});
	}

	@Override
	public Object invoke(KrollInvocation invocation, Object[] args) {
		KrollInvocation invocationCopy = invocation.copy();
		callAsync(invocationCopy, args, true);
		return KrollProxy.UNDEFINED;
	}

	@Override
	public boolean equals(Object obj) {
		if (!(obj instanceof KrollCallback)) {
			return false;
		}
		KrollCallback kb = (KrollCallback) obj;
		return method.equals(kb.method);
	}

	public Object toJSFunction() {
		return Context.javaToJS(method, kroll.getScope());
	}

	public Function getMethod() {
		return method;
	}

	public void setThisObj(Scriptable thisObj) {
		this.thisObj = thisObj;
	}

	public void setThisProxy(KrollProxy proxy) {
		setThisObj(proxy.getKrollObject());
	}

	public Object getJavascriptValue() {
		return getMethod();
	}

	public Object getNativeValue() {
		return this;
	}
}
