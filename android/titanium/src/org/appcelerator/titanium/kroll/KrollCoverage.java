/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.kroll;

import java.io.IOException;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;
import java.util.HashMap;

import org.appcelerator.kroll.KrollMethod;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.util.Log;
import org.json.JSONException;
import org.json.JSONObject;
import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;

public class KrollCoverage extends KrollObject
{
	private static final String TAG = "KrollCoverage";
	public static HashMap<String, HashMap<String, Integer>> coverageCount = new HashMap<String, HashMap<String, Integer>>();
	public static final String PROPERTY_GET = "propertyGet";
	public static final String PROPERTY_SET = "propertySet";
	public static final String FUNCTION_CALL = "functionCall";

	protected String name;
	protected KrollCoverage parent;
	protected HashMap<String, KrollCoverage> children = new HashMap<String, KrollCoverage>();

	public KrollCoverage(String name, KrollProxy proxy, KrollCoverage parent)
	{
		super(proxy);
		this.name = name;
		this.parent = parent;
	}

	public static void incrementCoverage(String name, String type)
	{
		HashMap<String, Integer> coverage = coverageCount.get(name);
		if (coverage == null) {
			coverage = new HashMap<String, Integer>();
			coverageCount.put(name, coverage);
		}
		Integer count = coverage.get(type);
		if (count == null) {
			count = 1;
		} else {
			count++;
		}
		coverage.put(type, count);
	}

	public Object get(String name, Scriptable start)
	{
		String propName = this.name + "." + name;
		incrementCoverage(propName, PROPERTY_GET);

		Object o = super.get(name, start);
		if (o instanceof KrollMethod)
		{
			KrollMethod method = (KrollMethod) o;
			return new KrollMethodCoverage(name, method, this);
		}
		return o;
	}

	@Override
	public void put(String name, Scriptable start, Object value)
	{
		String propName = this.name + "." + name;
		incrementCoverage(propName, PROPERTY_SET);
		super.put(name, start, value);
	}

	public static class KrollMethodCoverage
		extends BaseFunction implements Function
	{
		protected String fullName;
		protected KrollMethod method;
		protected KrollCoverage parent;

		public KrollMethodCoverage(String name, KrollMethod method, KrollCoverage parent)
		{
			super();
			this.method = method;
			this.fullName = parent.name + "." + name;
		}

		public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args)
		{
			incrementCoverage(fullName, FUNCTION_CALL);
			return method.call(cx, scope, thisObj, args);
		}

		@Override
		public String getClassName()
		{
			return method.getClassName();
		}

		@Override
		public Object getDefaultValue(Class<?> typeHint)
		{
			return method.getDefaultValue(typeHint);
		}

		@Override
		protected Object equivalentValues(Object value)
		{
			return method.isEquivalentValue(value);
		}
	}

	public static void writeCoverageReport(OutputStream out)
	{
		try {
			JSONObject o = new JSONObject();
			// We have to manually convert, JSONObject doesn't recurse
			for (String apiName : coverageCount.keySet()) {
				JSONObject apiMap = new JSONObject();
				o.putOpt(apiName, apiMap);
				for (String type : coverageCount.get(apiName).keySet()) {
					Integer count = coverageCount.get(apiName).get(type);
					apiMap.putOpt(type, count);
				}
			}
			String str = o.toString();
			byte buffer[] = str.getBytes("UTF-8");
			out.write(buffer);
		} catch (JSONException e) {
			Log.e(TAG, e.getMessage(), e);
		} catch (UnsupportedEncodingException e) {
			Log.e(TAG, e.getMessage(), e);
		} catch (IOException e) {
			Log.e(TAG, e.getMessage(), e);
		}
	}
}
