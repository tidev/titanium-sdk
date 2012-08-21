/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2011-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.kroll.runtime.rhino;

import java.util.HashMap;

import org.appcelerator.kroll.KrollLogging;
import org.appcelerator.kroll.common.KrollSourceCodeProvider;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.runtime.rhino.KrollScriptRunner.KrollScript;
import org.appcelerator.kroll.runtime.rhino.js.bootstrap;
import org.appcelerator.kroll.runtime.rhino.js.events;
import org.appcelerator.kroll.runtime.rhino.js.invoker;
import org.appcelerator.kroll.runtime.rhino.js.kroll;
import org.appcelerator.kroll.runtime.rhino.js.module;
import org.appcelerator.kroll.runtime.rhino.js.path;
import org.appcelerator.kroll.runtime.rhino.js.properties;
import org.appcelerator.kroll.runtime.rhino.js.rhino;
import org.appcelerator.kroll.runtime.rhino.js.sha1;
import org.appcelerator.kroll.runtime.rhino.js.tab;
import org.appcelerator.kroll.runtime.rhino.js.titanium;
import org.appcelerator.kroll.runtime.rhino.js.console;
import org.appcelerator.kroll.runtime.rhino.js.ui;
import org.appcelerator.kroll.runtime.rhino.js.url;
import org.appcelerator.kroll.runtime.rhino.js.vm;
import org.appcelerator.kroll.runtime.rhino.js.webview;
import org.appcelerator.kroll.runtime.rhino.js.window;
import org.appcelerator.kroll.runtime.rhino.js.yahoo;
import org.appcelerator.kroll.runtime.rhino.modules.AssetsModule;
import org.appcelerator.kroll.runtime.rhino.modules.ScriptsModule;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.Function;
import org.mozilla.javascript.Script;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

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
	private static HashMap<String, Class<? extends Proxy>> externalBindings = new HashMap<String, Class<? extends Proxy>>();
	private static HashMap<String, Class<? extends KrollSourceCodeProvider>>
		externalCommonJsModules = new HashMap<String, Class<? extends KrollSourceCodeProvider>>();
	private static HashMap<String, KrollSourceCodeProvider> loadedCommonJsSourceProviders =
		new HashMap<String, KrollSourceCodeProvider>();

	private static void addJsBinding(String name, Class<?> jsBinding)
	{
		KrollScript script = KrollScriptRunner.getInstance().getOrCreateScript(jsBinding);
		jsBindings.put(name, script.script);
	}

	public static void addExternalBinding(String name, Class<? extends Proxy> jsBinding)
	{
		externalBindings.put(name, jsBinding);
	}

	public static void initJsBindings()
	{
		// TODO this should be generated
		addJsBinding("bootstrap", bootstrap.class);
		addJsBinding("events", events.class);
		addJsBinding("invoker", invoker.class);
		addJsBinding("kroll", kroll.class);
		addJsBinding("module", module.class);
		addJsBinding("path", path.class);
		addJsBinding("properties", properties.class);
		addJsBinding("rhino", rhino.class);
		addJsBinding("sha1", sha1.class);
		addJsBinding("tab", tab.class);
		addJsBinding("titanium", titanium.class);
		addJsBinding("console", console.class);
		addJsBinding("ui", ui.class);
		addJsBinding("url", url.class);
		addJsBinding("vm", vm.class);
		addJsBinding("window", window.class);
		addJsBinding("webview", webview.class);
		addJsBinding("yahoo", yahoo.class);
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

	public static void dispose()
	{
		KrollScriptRunner.dispose();
		KrollGeneratedBindings.dispose();

		bindingCache.clear();
		jsBindings.clear();
	}

	public static Script getJsBinding(String name)
	{
		return jsBindings.get(name);
	}

	public static Scriptable getExternalBinding(Context context, Scriptable scope, String name)
	{
		Class<? extends Proxy> externalBindingClass = externalBindings.get(name);
		if (externalBindingClass != null) {
			Scriptable exports = context.newObject(scope);
			Proxy.init(context, exports, name, externalBindingClass);
			bindingCache.put(name, exports);

			return exports;
		}

		return null;
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
				Context.javaToJS(KrollLogging.getDefault(), scope));

			bindingCache.put(name, exports);
			return exports;

		} else if (BINDING_TITANIUM.equals(name)) {
			Scriptable exports = context.newObject(scope);
			initTitanium(context, exports);
			bindingCache.put(name, exports);
			return exports;
		}

		Class<? extends Proxy> genBinding = KrollGeneratedBindings.getBindingClass(name);
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

	public static Object getProxyBinding(Context context, Scriptable scope, String name, Class<? extends Proxy> proxyClass)
	{
		Scriptable exports = bindingCache.get(name);
		String bindingName = KrollGeneratedBindings.getBindingName(name);

		if (exports != null) {
			return ScriptableObject.getProperty(exports, bindingName);
		}

		exports = context.newObject(scope);
		Function constructor = Proxy.init(context, exports, bindingName, proxyClass);

		bindingCache.put(name, exports);
		ProxyFactory.addProxyConstructor(name, constructor);
		return ScriptableObject.getProperty(exports, bindingName);
	}

	public static Object requireNative(Context context, Scriptable scope, String name)
	{
		Script jsBinding = jsBindings.get(name);
		if (jsBinding != null) {
			return jsBinding.exec(context, scope);
		}
		return null;
	}

	public static boolean isExternalCommonJsModule(String request)
	{
		return externalCommonJsModules.containsKey(request);
	}

	public static String getExternalCommonJsModule(String request)
	{
		String nameKey = request;
		String subPath = request;

		// The source provider is stored by the root
		// name of the module, so if there is a subpath
		// on this request, get rid of it for purposes
		// of looking up the source provider.
		int slashPos = nameKey.indexOf("/");
		if (slashPos > 0) {
			subPath = nameKey.substring(slashPos + 1);
			nameKey = nameKey.substring(0, slashPos);
		}

		if (!isExternalCommonJsModule(nameKey)) {
			return null;
		}

		// Perhaps already cached.
		KrollSourceCodeProvider providerInstance =
				loadedCommonJsSourceProviders.get(nameKey);

		if (providerInstance == null) {
			Class<? extends KrollSourceCodeProvider> providerClass = externalCommonJsModules.get(nameKey);
			try {
				providerInstance = providerClass.newInstance();
				loadedCommonJsSourceProviders.put(nameKey, providerInstance);
			} catch (Exception e) {
				Log.e(TAG, "Cannot instantiate KrollSourceCodeProvider for module " + nameKey, e);
				return null;
			}
		}

		String sourceCode = null;

		if (providerInstance != null) {
			// The older version of KrollSourceCodeProvider.getSourceCode() (the method being called
			// below) took no arguments, because we only
			// supported one possible CommonJS module file packaged in a native module. There could be some
			// modules out there that were created during the time when we only had that no-arg version of
			// getSourceCode(), so we have to continue to support that. But we first try the newer version:
			// getSourceCode(String), which allows you to get any CommonJS module packaged with the native
			// module since we now support multiple CommonJS modules.
			try {
				sourceCode = providerInstance.getSourceCode(subPath);
			} catch (java.lang.AbstractMethodError e) {
				// Go ahead and use the old, no-arg method, but only if
				// the root CommonJS module is being requested.
				if (nameKey.equals(subPath)) {
					sourceCode = providerInstance.getSourceCode();
				}
			} catch (Throwable t) {
				Log.e(TAG, "Could not load source code for " + request, t);
			}
		}

		return sourceCode;
	}

	public static void addExternalCommonJsModule(String id, Class<? extends KrollSourceCodeProvider> jsSourceProvider)
	{
		externalCommonJsModules.put(id, jsSourceProvider);
	}
}
