/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.rhino;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.HashMap;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.RhinoException;
import org.mozilla.javascript.Script;
import org.mozilla.javascript.Scriptable;

import android.util.Log;

/**
 *  This class provides an API for running pre-compiled javascript from Rhino
 */
public class KrollScriptRunner
{
	private static final String TAG = "KrollScriptRunner";
	private static KrollScriptRunner _instance;

	protected String appPackageName;
	protected HashMap<String, KrollScript> scripts = new HashMap<String, KrollScript>();

	public static KrollScriptRunner getInstance()
	{
		if (_instance == null) {
			_instance = new KrollScriptRunner();
		}
		return _instance;
	}

	// Called by the compiled JS class, we pass it 1 argument: the script class name
	public static void main(Script script, String[] args)
	{
		KrollScriptRunner runner = getInstance();
		String scriptClassName = args[0];
		KrollScript krollScript = runner.scripts.get(scriptClassName);
		krollScript.script = script;
	}

	public static class KrollScript
	{
		public Context context;
		public Scriptable scope;
		public String name;
		public Script script;
		public Object returnValue;
	}

	private KrollScriptRunner() {}

	protected Object executeScript(KrollScript script)
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
		KrollScript script = scripts.get(scriptClassName);
		if (script != null) {
			script.context = context;
			script.scope = scope;
			return executeScript(script);
		}

		Class<?> scriptClass = Class.forName(scriptClassName);
		return runScript(context, scope, scriptClass);
	}

	public Object runScript(Context context, Scriptable scope, Class<?> scriptClass)
	{
		KrollScript script = getOrCreateScript(scriptClass);
		if (script != null) {
			script.context = context;
			script.scope = scope;
			return executeScript(script);
		} else {
			throw new RuntimeException("Couldn't load script for class: " + scriptClass);
		}
	}

	public KrollScript getOrCreateScript(Class<?> scriptClass)
	{
		String name = scriptClass.getName();
		KrollScript script = scripts.get(name);
		if (script != null) {
			return script;
		}

		script = new KrollScript();
		script.name = name;

		try {
			Method mainMethod = scriptClass.getMethod("main", String[].class);
			if (mainMethod != null) {
				// The generated class will delegate back to us in our static "main"
				scripts.put(script.name, script);
				mainMethod.invoke(null, new Object[] { new String[] { script.name } });
				return script;
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
		return null;
	}
}
