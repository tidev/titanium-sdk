/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll;

import org.appcelerator.titanium.TiMessageQueue;
import org.appcelerator.titanium.util.AsyncResult;
import org.appcelerator.titanium.util.Log;
import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;

@SuppressWarnings("serial")
public abstract class KrollMethod
	extends BaseFunction implements Function
{
	private static final String TAG = "KrollMethod";

	protected String name;
	protected boolean runOnUiThread = false;

	public KrollMethod(String name)
	{
		super();
		this.name = name;
	}

	@Override
	public String getClassName()
	{
		return "KrollMethod";
	}

	@Override
	public Object call(Context context, Scriptable scope, Scriptable thisObj, Object[] args)
	{
		KrollProxy proxy = null;
		if (thisObj instanceof KrollObject) {
			proxy = ((KrollObject)thisObj).getProxy();
		}

		Object methodResult = null;
		Exception exception = null;
		KrollInvocation inv = KrollInvocation.createMethodInvocation(scope, thisObj, name, this, proxy);
		try {
			if (!runOnUiThread) {
				return invoke(inv, args);
			} else {
				if (inv.getTiContext().isUIThread()) {
					return invoke(inv, args);
				} else {
					final KrollInvocation fInv = inv;
					final Object[] fArgs = args;
					final AsyncResult result = new AsyncResult();
					TiMessageQueue.getMainMessageQueue().post(new Runnable() {
						public void run() {
							try {
								Object retVal = invoke(fInv, fArgs);
								result.setResult(retVal);
							} catch (Exception e) {
								result.setResult(e);
							}
						}
					});
					Object retVal = result.getResult();
					if (retVal instanceof Exception) {
						exception = (Exception)retVal;
						methodResult = Context.getUndefinedValue();
					} else {
						methodResult = retVal;
					}
				}
			}
		} catch (Exception e) {
			exception = e;
			methodResult = Context.getUndefinedValue();
		}
		inv.recycle();
		if (exception != null) {
			Log.e(TAG, "Exception calling kroll method " + name + ", invocation: " + inv, exception);
			Context.throwAsScriptRuntimeEx(exception);
		}
		return methodResult;
	}

	@Override
	public Scriptable construct(Context arg0, Scriptable arg1, Object[] arg2)
	{
		// TODO Auto-generated method stub
		return null;
	}

	public abstract Object invoke(KrollInvocation invocation, Object[] args) throws Exception;
	
	public void setRunOnUiThread(boolean runOnUiThread)
	{
		this.runOnUiThread = runOnUiThread;
	}
	
	public String getName()
	{
		return name;
	}
	
	@Override
	public Object getDefaultValue(Class<?> typeHint)
	{
		return "[KrollMethod " + name + "]";
	}
	
	@Override
	protected Object equivalentValues(Object value)
	{
		if (value instanceof KrollProxy.ThisMethod) {
			KrollProxy.ThisMethod other = (KrollProxy.ThisMethod) value;
			return this.equals(other.getDelegate());
		}
		return super.equivalentValues(value);
	}
}
