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
import org.appcelerator.titanium.util.TiConfig;
import org.json.JSONException;
import org.json.JSONObject;
import org.mozilla.javascript.BaseFunction;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Scriptable;

/**
 * This class serves as a stand-in replacement for KrollObject
 * when counting coverage.
 * 
 * Coverage is currently counted for property gets, sets,
 * and function calls.
 *
 */
@SuppressWarnings("serial")
public class KrollCoverage extends KrollObject
{
	private static final String TAG = "KrollCoverage";
	private static final boolean TRACE = TiConfig.LOGV;

	public static JSONMap<JSONMap<JSONMap<APICount>>> coverageCount =
		new JSONMap<JSONMap<JSONMap<APICount>>>();

	public static final String PROXIES = "proxies";
	public static final String MODULES = "modules";
	public static final String OTHER = "other";
	public static final String TOP_LEVEL = "TOP_LEVEL";
	public static final String PROPERTY = "property";
	public static final String FUNCTION = "function";
	public static final String PROPERTY_GET = "propertyGet";
	public static final String PROPERTY_SET = "propertySet";
	public static final String FUNCTION_CALL = "functionCall";

	protected String name;
	protected KrollCoverage parent;
	protected String componentType;

	public KrollCoverage(KrollProxy proxy)
	{
		super(proxy);

		this.componentType = proxy instanceof KrollModule ? MODULES : PROXIES;
		if (proxy.getCreatedInModule() != null) {
			parent = (KrollCoverage) proxy.getCreatedInModule().getKrollObject();
		}
		if (proxy.getBinding() != null) {
			name = proxy.getAPIName();
			if (name != null && name.indexOf("Titanium.") == -1) {
				name = "Titanium." + name;
			}
		}
	}

	public KrollCoverage(String name, KrollProxy proxy, KrollCoverage parent)
	{
		super(proxy);

		this.componentType = proxy instanceof KrollModule ? MODULES : PROXIES;
		this.name = name;
		this.parent = parent;
	}

	private static interface JSONConvertable
	{
		public JSONObject toJSON() throws JSONException;
	}

	// We have to manually convert, JSONObject doesn't recurse
	private static class JSONMap<T extends JSONConvertable>
		extends HashMap<String, T> implements JSONConvertable
	{
		public JSONObject toJSON() throws JSONException
		{
			JSONObject o = new JSONObject();
			for (String api : keySet()) {
				o.putOpt(api, get(api).toJSON());
			}
			return o;
		}
	}

	private static class APICount
		extends HashMap<String, Integer> implements JSONConvertable
	{
		private String apiType;
		public APICount(String apiType)
		{
			this.apiType = apiType;
		}

		public JSONObject toJSON() throws JSONException
		{
			JSONObject o = new JSONObject();
			o.putOpt("_type", apiType);
			for (String countType : keySet()) {
				o.putOpt(countType, get(countType));
			}
			return o;
		}
	}

	/**
	 * Increment coverage on a property or function
	 * @param componentType The component type, i.e {@link KrollCoverage#MODULES}, {@link KrollCoverage#PROXIES}, or {@link KrollCoverage#OTHER}
	 * @param component The fully-qualified component name, i.e. "Titanium.UI"
	 * @param name The API name that is being covered
	 * @param type The type of coverage, i.e {@link KrollCoverage#PROPERTY_GET}, {@link KrollCoverage#PROPERTY_SET}, or {@link KrollCoverage#FUNCTION_CALL}
	 * @param apiType The API type, i.e. {@link KrollCoverage#FUNCTION} or {@link KrollCoverage#PROPERTY}
	 */
	public static void incrementCoverage(String componentType, String component,
		String name, String type, String apiType)
	{
		if (TRACE) {
			Log.d(TAG, "incrementCoverage: " + componentType + ", " + component + ", " + name + ", " + type + ", " + apiType);
		}
		JSONMap<JSONMap<APICount>> apiTypeCoverage = coverageCount.get(componentType);
		if (apiTypeCoverage == null) {
			apiTypeCoverage = new JSONMap<JSONMap<APICount>>();
			coverageCount.put(componentType, apiTypeCoverage);
		}

		JSONMap<APICount> componentCoverage = apiTypeCoverage.get(component);
		if (componentCoverage == null) {
			componentCoverage = new JSONMap<APICount>();
			apiTypeCoverage.put(component, componentCoverage);
		}

		APICount coverage = componentCoverage.get(name);
		if (coverage == null) {
			coverage = new APICount(apiType);
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

	protected void incrementCoverage(String name, String type, String apiType)
	{
		incrementCoverage(componentType, this.name, name, type, apiType);
	}

	public Object get(String name, Scriptable start)
	{
		Object o = super.get(name, start);
		if (o instanceof Function && !(o instanceof KrollObject)) {
			Function fn = (Function) o;
			incrementCoverage(name, PROPERTY_GET, FUNCTION);
			return new KrollFunctionCoverage(name, fn, this);
		}
		incrementCoverage(name, PROPERTY_GET, PROPERTY);
		return o;
	}

	@Override
	public void put(String name, Scriptable start, Object value)
	{
		incrementCoverage(name, PROPERTY_SET, PROPERTY);
		super.put(name, start, value);
	}

	@SuppressWarnings("serial")
	public static class KrollFunctionCoverage
		extends BaseFunction implements Function
	{
		protected String name;
		protected Function fn;
		protected String componentType;
		protected String parentName;

		public KrollFunctionCoverage(String name, Function fn, KrollCoverage parent)
		{
			this(name, fn, parent.componentType, parent.name);
		}

		public KrollFunctionCoverage(String name, Function fn, String componentType, String parentName)
		{
			super();
			this.name = name;
			this.fn = fn;
			this.componentType = componentType;
			this.parentName = parentName;
		}

		public Object call(Context cx, Scriptable scope, Scriptable thisObj, Object[] args)
		{
			incrementCoverage(componentType, parentName, name, FUNCTION_CALL, FUNCTION);
			return fn.call(cx, scope, thisObj, args);
		}

		@Override
		public String getClassName()
		{
			return fn.getClassName();
		}

		@Override
		public Object getDefaultValue(Class<?> typeHint)
		{
			return fn.getDefaultValue(typeHint);
		}

		@Override
		protected Object equivalentValues(Object value)
		{
			if (fn instanceof KrollMethod) {
				return ((KrollMethod)fn).isEquivalentValue(value);
			}
			return fn.equals(value);
		}
	}

	public static void writeCoverageReport(OutputStream out)
	{
		try {
			JSONObject o = coverageCount.toJSON();
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
