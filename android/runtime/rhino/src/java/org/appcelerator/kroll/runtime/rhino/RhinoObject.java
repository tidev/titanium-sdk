/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.rhino;

import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.KrollRuntime;
import org.appcelerator.kroll.common.Log;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.RhinoException;
import org.mozilla.javascript.ScriptableObject;

/**
 * Rhino implementation of KrollObject
 */
public class RhinoObject extends KrollObject
{
	private static final String TAG = "RhinoObject";
	
	private Proxy proxy;
	private Function emitFunction, setWindowFunction;

	public RhinoObject(Proxy proxy)
	{
		this.proxy = proxy;
	}

	@Override
	public Object getNativeObject()
	{
		return this.proxy;
	}

	@Override
	public Object callProperty(String propertyName, Object[] args) {
		((RhinoRuntime) KrollRuntime.getInstance()).enterContext();

		try {
			Object returnValue = ScriptableObject.callMethod(proxy, propertyName, args);
			return TypeConverter.jsObjectToJavaObject(returnValue, proxy);

		} catch (Exception e) {
			Log.d(TAG, "Exception thrown while calling JS function: " + e, Log.DEBUG_MODE);

		} finally {
			Context.exit();
		}

		return KrollRuntime.UNDEFINED;
	}

	@Override
	protected void setProperty(String name, Object value)
	{
		((RhinoRuntime) KrollRuntime.getInstance()).enterContext();

		try {
			ScriptableObject.putProperty(proxy.getProperties(), name, 
				TypeConverter.javaObjectToJsObject(value, proxy.getProperties()));

		} finally {
			Context.exit();
		}
	}

	@Override
	protected boolean fireEvent(String type, Object data)
	{
		Context context = ((RhinoRuntime) KrollRuntime.getInstance()).enterContext();

		try {
			if (emitFunction == null) {
				emitFunction = (Function) ScriptableObject.getProperty(proxy, "emit");
			}

			Object jsData = TypeConverter.javaObjectToJsObject(data, proxy);
			Object[] args;

			if (jsData == null) {
				args = new Object[] { type };

			} else {
				args = new Object[] { type, jsData };
			}

			Object result = emitFunction.call(context, proxy.getParentScope(), proxy, args);
			return TypeConverter.jsObjectToJavaBoolean(result, proxy);

		} catch (Exception e) {
			Log.e(TAG,e.getMessage(), e);
			if (e instanceof RhinoException) {
				RhinoException re = (RhinoException) e;
				Context.reportRuntimeError(re.getMessage(), re.sourceName(), re.lineNumber(), re.lineSource(),
					re.columnNumber());
			} else {
				Context.reportError(e.getMessage());
			}
			return false;
		} finally {
			Context.exit();
		}
	}

	@Override
	protected void doRelease()
	{
	}

	@Override
	protected void doSetWindow(Object windowProxy)
	{
		Context context = ((RhinoRuntime) KrollRuntime.getInstance()).enterContext();

		try {
			if (setWindowFunction == null) {
				setWindowFunction = (Function) ScriptableObject.getProperty(proxy, "setWindow");
			}

			Object jsWindow = TypeConverter.javaObjectToJsObject(windowProxy, proxy);
			Object[] args = new Object[] { jsWindow };

			setWindowFunction.call(context, this.proxy.getParentScope(), proxy, args);

		} catch (Exception e) {
			if (e instanceof RhinoException) {
				RhinoException re = (RhinoException) e;
				Context.reportRuntimeError(re.getMessage(), re.sourceName(), re.lineNumber(), re.lineSource(),
					re.columnNumber());
			} else {
				Context.reportError(e.getMessage());
			}
		} finally {
			Context.exit();
		}
	}
}
