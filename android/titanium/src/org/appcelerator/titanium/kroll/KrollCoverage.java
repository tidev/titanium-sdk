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
import org.appcelerator.kroll.KrollModule;
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
	public static HashMap<String, HashMap<String, HashMap<String, HashMap<String, Integer>>>> coverageCount =
		new HashMap<String, HashMap<String, HashMap<String, HashMap<String, Integer>>>>();

	public static final String PROXIES = "proxies";
	public static final String MODULES = "modules";
	public static final String PROPERTY_GET = "propertyGet";
	public static final String PROPERTY_SET = "propertySet";
	public static final String FUNCTION_CALL = "functionCall";

	protected String name;
	protected KrollCoverage parent;
	protected String apiType;

	public KrollCoverage(String name, KrollProxy proxy, KrollCoverage parent)
	{
		super(proxy);

		this.apiType = proxy instanceof KrollModule ? MODULES : PROXIES;
		this.name = name;
		this.parent = parent;
	}

	public static void incrementCoverage(String apiType, String component, String name, String type)
	{
		HashMap<String, HashMap<String, HashMap<String, Integer>>> apiTypeCoverage = coverageCount.get(apiType);
		if (apiTypeCoverage == null) {
			apiTypeCoverage = new HashMap<String, HashMap<String, HashMap<String, Integer>>>();
			coverageCount.put(apiType, apiTypeCoverage);
		}

		HashMap<String, HashMap<String, Integer>> componentCoverage = apiTypeCoverage.get(component);
		if (componentCoverage == null) {
			componentCoverage = new HashMap<String, HashMap<String, Integer>>();
			apiTypeCoverage.put(component, componentCoverage);
		}

		HashMap<String, Integer> coverage = componentCoverage.get(name);
		if (coverage == null) {
			coverage = new HashMap<String, Integer>();
			componentCoverage.put(name, coverage);
		}

		Integer count = coverage.get(type);
		if (count == null) {
			count = 1;
		} else {
			count++;
		}
		coverage.put(type, count);
	}

	protected void incrementCoverage(String name, String type)
	{
		incrementCoverage(apiType, this.name, name, type);
	}

	public Object get(String name, Scriptable start)
	{
		incrementCoverage(name, PROPERTY_GET);
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
		incrementCoverage(name, PROPERTY_SET);
		super.put(name, start, value);
	}

	public static class KrollMethodCoverage
		extends BaseFunction implements Function
	{
		protected String name;
		protected KrollMethod method;
		protected String apiType;
		protected String parentName;

		public KrollMethodCoverage(String name, KrollMethod method, KrollCoverage parent)
		{
			super();
			this.method = method;
			this.name = name;
			this.apiType = parent.apiType;
			this.parentName = parent.name;
		}

		public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args)
		{
			incrementCoverage(apiType, parentName, name, FUNCTION_CALL);
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
			for (String apiType : coverageCount.keySet()) {
				JSONObject apiTypeMap = new JSONObject();
				o.putOpt(apiType, apiTypeMap);
				HashMap<String, HashMap<String, HashMap<String, Integer>>> apiTypes = coverageCount.get(apiType);
				for (String typeName : apiTypes.keySet()) {
					JSONObject typeNameMap = new JSONObject();
					apiTypeMap.putOpt(typeName, typeNameMap);
					HashMap<String, HashMap<String, Integer>> typeNames = apiTypes.get(typeName);
					for (String apiName : typeNames.keySet()) {
						JSONObject apiNameMap = new JSONObject();
						typeNameMap.putOpt(apiName, apiNameMap);
						HashMap<String, Integer> apiNames = typeNames.get(apiName);
						for (String coverageType : apiNames.keySet()) {
							Integer count = apiNames.get(coverageType);
							apiNameMap.putOpt(coverageType, count);
						}
					}
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
