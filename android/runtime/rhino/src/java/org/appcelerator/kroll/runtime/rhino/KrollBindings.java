/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.rhino;

import java.util.HashMap;

import org.appcelerator.kroll.KrollLogging;
import org.appcelerator.kroll.runtime.rhino.KrollScriptRunner.KrollScript;
import org.appcelerator.kroll.runtime.rhino.js.activity;
import org.appcelerator.kroll.runtime.rhino.js.bootstrap;
import org.appcelerator.kroll.runtime.rhino.js.events;
import org.appcelerator.kroll.runtime.rhino.js.kroll;
import org.appcelerator.kroll.runtime.rhino.js.module;
import org.appcelerator.kroll.runtime.rhino.js.path;
import org.appcelerator.kroll.runtime.rhino.js.properties;
import org.appcelerator.kroll.runtime.rhino.js.titanium;
import org.appcelerator.kroll.runtime.rhino.js.ui;
import org.appcelerator.kroll.runtime.rhino.js.url;
import org.appcelerator.kroll.runtime.rhino.js.vm;
import org.appcelerator.kroll.runtime.rhino.js.window;
import org.appcelerator.kroll.runtime.rhino.modules.AssetsModule;
import org.appcelerator.kroll.runtime.rhino.modules.ScriptsModule;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Script;
import org.mozilla.javascript.Scriptable;

/**
 * Various native Rhino bindings
 */
public class KrollBindings
{
	private static final String TAG = "KrollBindings";
	private static final String BINDING_NATIVES = "natives";
	private static final String BINDING_EVALS = "evals";
	private static final String BINDING_ASSETS = "assets";
	private static final String BINDING_API = "API";
	private static final String BINDING_TITANIUM = "Titanium";

	private static HashMap<String, Scriptable> bindingCache = new HashMap<String, Scriptable>();
	private static HashMap<String, Script> jsBindings = new HashMap<String, Script>();

	static
	{
		initJsBindings();
	}

	private static void addJsBinding(String name, Class<?> jsBinding)
	{
		KrollScript script = KrollScriptRunner.getInstance().getOrCreateScript(jsBinding);
		jsBindings.put(name, script.script);
	}

	private static void initJsBindings()
	{
		addJsBinding("activity", activity.class);
		addJsBinding("bootstrap", bootstrap.class);
		addJsBinding("events", events.class);
		addJsBinding("kroll", kroll.class);
		addJsBinding("module", module.class);
		addJsBinding("path", path.class);
		addJsBinding("properties", properties.class);
		addJsBinding("titanium", titanium.class);
		addJsBinding("ui", ui.class);
		addJsBinding("url", url.class);
		addJsBinding("vm", vm.class);
		addJsBinding("window", window.class);
	}

	private static void initTitanium(Context context, Scriptable exports)
	{
		Proxy.init(exports);

		Proxy.init(context, exports, "KrollProxy",
			KrollGeneratedBindings.getBindingClass(
				"org.appcelerator.kroll.KrollProxy"));

		Proxy.init(context, exports, "KrollModule",
			KrollGeneratedBindings.getBindingClass(
				"org.appcelerator.kroll.KrollModule"));

		Proxy.init(context, exports, "Titanium",
			KrollGeneratedBindings.getBindingClass(
				"ti.modules.titanium.TitaniumModule"));
	}

	public static Script getJsBinding(String name)
	{
		return jsBindings.get(name);
	}

	public static Scriptable getBinding(Context context, Scriptable scope, String name)
	{
		Scriptable binding = bindingCache.get(name);
		if (binding != null) {
			return binding;
		}

		if (BINDING_NATIVES.equals(name)) {
			// We just return a map with empty values so JS knows what exists
			Scriptable exports = context.newObject(scope);
			for (String jsBinding : jsBindings.keySet()) {
				exports.put(jsBinding, exports, true);
			}
			bindingCache.put(name, exports);
			return exports;

		} else if (BINDING_EVALS.equals(name)) {
			Scriptable exports = context.newObject(scope);
			ScriptsModule.init(exports);
			bindingCache.put(name, exports);
			return exports;

		} else if (BINDING_ASSETS.equals(name)) {
			Scriptable exports = context.newObject(scope);
			AssetsModule.init(exports);
			bindingCache.put(name, exports);
			return exports;

		} else if (BINDING_API.equals(name)) {
			Scriptable exports = context.newObject(scope);
			exports.put("API", exports,
				Context.javaToJS(new KrollLogging("TiAPI"), scope));

			bindingCache.put(name, exports);
			return exports;

		} else if (BINDING_TITANIUM.equals(name)) {
			Scriptable exports = context.newObject(scope);
			initTitanium(context, exports);
			bindingCache.put(name, exports);
			return exports;
		}

		Class<? extends Proxy> genBinding =
			KrollGeneratedBindings.getBindingClass(name);

		if (genBinding != null) {
			Scriptable exports = context.newObject(scope);
			String bindingName = KrollGeneratedBindings.getBindingName(name);
			Function constructor = Proxy.init(context, exports, bindingName, genBinding);

			bindingCache.put(name, exports);
			ProxyFactory.addProxyConstructor(name, constructor);
			return exports;
		}

		// TODO
		return null;
	}

	public static void requireNative(Context context, Scriptable scope, String name)
	{
		Script jsBinding = jsBindings.get(name);
		if (jsBinding != null) {
			jsBinding.exec(context, scope);
		}
	}
}
