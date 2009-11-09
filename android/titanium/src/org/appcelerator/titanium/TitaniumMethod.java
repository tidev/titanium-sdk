/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium;

import java.lang.ref.WeakReference;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

import org.appcelerator.titanium.api.ITitaniumMethod;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONStringer;

public class TitaniumMethod implements ITitaniumMethod
{
	WeakReference<TitaniumModuleManager> weakTmm;

	public TitaniumMethod(TitaniumModuleManager tmm) {
		this.weakTmm = new WeakReference<TitaniumModuleManager>(tmm);
	}

	public String call(String json) {
		String result = null;
		try {
			JSONObject o = new JSONObject(json);
			TitaniumModuleManager tmm = weakTmm.get();
			if (tmm != null) {
				String moduleName = o.getString("module");
				Object obj = tmm.getModuleForName(moduleName);

				JSONStringer js = new JSONStringer();
				if (obj != null) {
					String methodName = o.getString("method");
					JSONArray argList = o.getJSONArray("args");
					JSONArray typeList = o.getJSONArray("types");

					Class<?>[] types = new Class<?>[typeList.length()];
					Object[] args = new Object[argList.length()];

					for(int i = 0; i < types.length; i++) {
						String type = typeList.getString(i);

						if ("string".equals(type)) {
							types[i] = String.class;
							args[i] = argList.getString(i);
						} else if ("integer".equals(type)) {
							types[i] = int.class;
							args[i] = argList.getInt(i);
						} else if ("double".equals(type)) {
							types[i] = double.class;
							args[i] = argList.getDouble(i);
						} else if ("object".equals(type)) {
							types[i] = JSONObject.class;
							args[i] = argList.getJSONObject(i);
						} else if ("array".equals(type)) {
							types[i] = JSONArray.class;
							args[i] = argList.getJSONArray(i);
						} else {
							throw new IllegalArgumentException("Unknown type: " + type);
						}
					}
					try {
						Method m = obj.getClass().getMethod(methodName, types);
						Object r = m.invoke(obj, args);
						fillResult(js, r);
					} catch (NoSuchMethodException e) {
						throw new RuntimeException("Missing method: " + methodName, e);
					} catch (InvocationTargetException e) {
						fillException(js, e.getCause().getMessage());
					} catch (Exception e) {
						fillException(js, e.getMessage());
					}
				} else {
					fillException(js, "Module " + moduleName + " not registered");
				}
				result = js.toString();
				js = null;
				o = null;
			}
		} catch (JSONException e) {
			e.printStackTrace();
		}

		return result;
	}

	private void fillResult(JSONStringer js, Object result)
		throws JSONException
	{
		js.object();
		if (result == null) {
			js.key("resultType").value("null");
		} else if (result instanceof Boolean) {
			js.key("result").value((Boolean) result);
			js.key("resultType").value("boolean");
		} else if (result instanceof String) {
			js.key("result").value((String) result);
			js.key("resultType").value("string");
		} else if (result instanceof Integer || result instanceof Long) {
			js.key("result").value((Integer) result);
			js.key("resultType").value("integer");
		} else if (result instanceof Float || result instanceof Double) {
			js.key("result").value((Double) result);
			js.key("resultType").value("double");
		} else if (result instanceof JSONArray) {
			js.key("result").value((JSONArray) result);
			js.key("resultType").value("array");
		} else {
			js.key("result").value((JSONObject) result);
			js.key("resultType").value("object");
		}
		js.endObject();
	}

	private void fillException(JSONStringer js, String message)
		throws JSONException
	{
		js.object()
			.key("exception").value(message)
		.endObject();
	}

	public void reset() {
	}
}
