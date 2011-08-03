/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.HashMap;

import org.appcelerator.titanium.util.Log;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.RhinoException;
import org.mozilla.javascript.Script;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

// This class provides an API for running pre-compiled javascript from Rhino
public class TiScriptRunner
{
	private static final String TAG = "TiScriptRunner";
	private static TiScriptRunner _instance;

	public static TiScriptRunner getInstance()
	{
		if (_instance == null) {
			_instance = new TiScriptRunner();
		}
		return _instance;
	}

	// Called by the compiled JS class, we pass it 1 argument: the script class name
	public static void main(Script script, String[] args)
	{
		TiScriptRunner runner = getInstance();
		String scriptClassName = args[0];
		
		TiScript tiScript = runner.scripts.get(scriptClassName);
		tiScript.script = script;
		tiScript.returnValue = runner.executeScript(tiScript);
	}

	protected class TiScript
	{
		public Context context;
		public Scriptable scope;
		public String name;
		public Script script;
		public Object returnValue;
	}

	protected String appPackageName;
	protected HashMap<String, TiScript> scripts = new HashMap<String, TiScript>();
	private TiScriptRunner() {}

	protected Object executeScript(TiScript script)
	{
		Log.d(TAG, "Executing script: " + script.name);
		Object returnValue = Scriptable.NOT_FOUND;
		try {
			returnValue = script.script.exec(script.context, script.scope);
		} catch (RhinoException e) {
			Log.e(TAG, "Javascript Exception: " + e.getMessage(), e);
			Context.reportRuntimeError(e.getMessage(), e.sourceName(), e.lineNumber(), e.lineSource(), e.columnNumber());
		}
		
		script.context = null;
		script.scope = null;
		
		return returnValue;
	}

	protected String getScriptClassName(String relativePath)
	{
		String scriptClassName = new String(relativePath);
		scriptClassName = scriptClassName.replace(".js","").
			replace("/","_").replace("\\", "_").replace(" ","_").replace(".","_").replace("-","_");
		
		return appPackageName + ".js." + scriptClassName;
	}

	public void setAppPackageName(String packageName)
	{
		appPackageName = packageName;
	}


	public Object runScript(Context context, Scriptable scope, String relativePath)
		throws ClassNotFoundException
	{
		String scriptClassName = getScriptClassName(relativePath);
		if (scripts.containsKey(scriptClassName)) {
			TiScript script = scripts.get(scriptClassName);
			script.context = context;
			script.scope = scope;
			return executeScript(script);
		}

		Class<?> scriptClass = Class.forName(scriptClassName);
		return runScript(context, scope, scriptClass);
	}

	public Object runScript(Context context, Scriptable scope, Class<?> scriptClass)
	{
		TiScript script = new TiScript();
		script.context = context;
		script.scope = scope;
		script.name = scriptClass.getName();

		try {
			Method mainMethod = scriptClass.getMethod("main", String[].class);
			if (mainMethod != null) {
				// The generated class will delegate back to us in our static "main"
				scripts.put(script.name, script);
				mainMethod.invoke(null, new Object[] { new String[] { script.name } });
				Object returnValue = script.returnValue;
				script.returnValue = null;
				return returnValue;
			}
		} catch (SecurityException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IllegalArgumentException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (NoSuchMethodException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IllegalAccessException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (InvocationTargetException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		return ScriptableObject.NOT_FOUND;
	}
}
