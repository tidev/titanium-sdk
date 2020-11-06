/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.webview;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.HashMap;
import java.util.Stack;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollEventCallback;
import org.appcelerator.kroll.KrollLogging;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.util.KrollAssetHelper;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.util.TiConvert;
import org.json.JSONException;
import org.json.JSONObject;

import android.webkit.JavascriptInterface;
import android.webkit.WebView;

public class TiWebViewBinding
{

	private static final String TAG = "TiWebViewBinding";
	// This is based on binding.min.js. If you have to change anything...
	// - change binding.js
	// - minify binding.js to create binding.min.js
	protected final static String SCRIPT_INJECTION_ID = "__ti_injection";
	protected final static String INJECTION_CODE;
	protected final static String SCRIPT_TAG_INJECTION_CODE;

	// This is based on polling.min.js. If you have to change anything...
	// - change polling.js
	// - minify polling.js to create polling.min.js
	protected static String POLLING_CODE = "";
	static
	{
		StringBuilder jsonCode = readResourceFile("json2.js");
		StringBuilder tiCode = readResourceFile("binding.min.js");
		StringBuilder pollingCode = readResourceFile("polling.min.js");

		if (pollingCode == null) {
			Log.w(TAG, "Unable to read polling code");
		} else {
			POLLING_CODE = pollingCode.toString();
		}

		StringBuilder scriptCode = new StringBuilder();
		StringBuilder injectionCode = new StringBuilder();
		scriptCode.append("\n<script id=\"" + SCRIPT_INJECTION_ID + "\">\n");
		if (jsonCode == null) {
			Log.w(TAG, "Unable to read JSON code for injection");
		} else {
			scriptCode.append(jsonCode);
			injectionCode.append(jsonCode);
		}

		if (tiCode == null) {
			Log.w(TAG, "Unable to read Titanium binding code for injection");
		} else {
			scriptCode.append("\n");
			scriptCode.append(tiCode.toString());
			injectionCode.append(tiCode.toString());
		}
		scriptCode.append("\n</script>\n");
		jsonCode = null;
		tiCode = null;
		SCRIPT_TAG_INJECTION_CODE = scriptCode.toString();
		INJECTION_CODE = injectionCode.toString();
		scriptCode = null;
		injectionCode = null;
	}

	private Stack<String> codeSnippets;
	private boolean destroyed;

	private ApiBinding apiBinding;
	private AppBinding appBinding;
	private TiReturn tiReturn;
	private WebView webView;
	private boolean interfacesAdded = false;

	public TiWebViewBinding(WebView webView)
	{
		codeSnippets = new Stack<String>();
		this.webView = webView;
		apiBinding = new ApiBinding();
		appBinding = new AppBinding();
		tiReturn = new TiReturn();
	}

	public void addJavascriptInterfaces()
	{
		if (webView != null && !interfacesAdded) {
			webView.addJavascriptInterface(appBinding, "TiApp");
			webView.addJavascriptInterface(apiBinding, "TiAPI");
			webView.addJavascriptInterface(tiReturn, "_TiReturn");
			interfacesAdded = true;
		}
	}

	public void destroy()
	{
		// remove any event listener that have already been added to the Ti.APP through
		// this web view instance
		appBinding.clearEventListeners();
		webView = null;
		returnSemaphore.release();
		codeSnippets.clear();
		destroyed = true;
	}

	private static StringBuilder readResourceFile(String fileName)
	{
		InputStream stream = null;
		StringBuilder code = new StringBuilder();
		try {
			stream = KrollAssetHelper.openAsset("Resources/ti.internal/webview/" + fileName);
			BufferedReader reader = new BufferedReader(new InputStreamReader(stream));
			for (String line = reader.readLine(); line != null; line = reader.readLine()) {
				code.append(line + "\n");
			}
		} catch (Exception e) {
			Log.e(TAG, "Error reading input stream", e);
			return null;
		} finally {
			if (stream != null) {
				try {
					stream.close();
				} catch (IOException e) {
					Log.w(TAG, "Problem closing input stream.", e);
				}
			}
		}
		return code;
	}

	private Semaphore returnSemaphore = new Semaphore(0);
	private String returnValue;

	synchronized public String getJSValue(String expression)
	{
		// Don't try to evaluate js code again if the binding has already been destroyed
		if (!destroyed && interfacesAdded) {
			String code = "_TiReturn.setValue((function(){try{return " + expression
						  + "+\"\";}catch(ti_eval_err){return '';}})());";
			Log.d(TAG, "getJSValue:" + code, Log.DEBUG_MODE);
			returnSemaphore.drainPermits();
			synchronized (codeSnippets)
			{
				codeSnippets.add(0, code);
			}
			try {
				if (!returnSemaphore.tryAcquire(3500, TimeUnit.MILLISECONDS)) {
					synchronized (codeSnippets)
					{
						codeSnippets.removeElement(code);
					}
					Log.w(TAG, "Timeout waiting to evaluate JS");
				}
				return returnValue;
			} catch (InterruptedException e) {
				Log.e(TAG, "Interrupted", e);
			}
		}
		return null;
	}

	private class TiReturn
	{
		@JavascriptInterface
		public void setValue(String value)
		{
			if (value != null) {
				returnValue = value;
			}
			returnSemaphore.release();
		}
	}

	private class WebViewCallback implements KrollEventCallback
	{
		private int id;

		public WebViewCallback(int id)
		{
			this.id = id;
		}

		public void call(Object data)
		{
			String dataString;
			if (data == null) {
				dataString = "";
			} else if (data instanceof HashMap) {
				JSONObject json = TiConvert.toJSON((HashMap) data);
				dataString = ", " + String.valueOf(json);
			} else {
				dataString = ", " + String.valueOf(data);
			}

			String code = "Ti.executeListener(" + id + dataString + ");";
			synchronized (codeSnippets)
			{
				codeSnippets.add(0, code);
			}
		}
	}

	@SuppressWarnings("unused")
	private class AppBinding
	{
		private KrollModule module;
		private HashMap<String, Integer> appListeners = new HashMap<String, Integer>();
		private int counter = 0;
		private String code = null;
		public AppBinding()
		{
			module = TiApplication.getInstance().getModuleByName("App");
		}

		@JavascriptInterface
		public void fireEvent(String event, String json)
		{
			try {
				KrollDict dict = new KrollDict();
				if (json != null && !json.equals("undefined")) {
					dict = new KrollDict(new JSONObject(json));
				}
				module.fireEvent(event, dict);
			} catch (JSONException e) {
				Log.e(TAG, "Error parsing event JSON", e);
			}
		}

		@JavascriptInterface
		public int addEventListener(String event, int id)
		{
			WebViewCallback callback = new WebViewCallback(id);

			int result = module.addEventListener(event, callback);
			appListeners.put(event, result);

			return result;
		}

		@JavascriptInterface
		public void removeEventListener(String event, int id)
		{
			module.removeEventListener(event, id);
		}

		@JavascriptInterface
		public void clearEventListeners()
		{
			for (String event : appListeners.keySet()) {
				removeEventListener(event, appListeners.get(event));
			}
		}

		@JavascriptInterface
		public String getJSCode()
		{
			if (destroyed) {
				return null;
			}
			return code;
		}

		@JavascriptInterface
		public int hasResult()
		{
			if (destroyed) {
				return -1;
			}
			int result = 0;
			synchronized (codeSnippets)
			{
				if (codeSnippets.empty()) {
					code = "";
				} else {
					result = 1;
					code = codeSnippets.pop();
				}
			}
			return result;
		}
	}

	private class ApiBinding
	{
		private KrollLogging logging;

		public ApiBinding()
		{
			logging = KrollLogging.getDefault();
		}

		@JavascriptInterface
		public void log(String level, String arg)
		{
			logging.log(level, arg);
		}

		@JavascriptInterface
		public void info(String arg)
		{
			logging.info(arg);
		}

		@JavascriptInterface
		public void debug(String arg)
		{
			logging.debug(arg);
		}

		@JavascriptInterface
		public void error(String arg)
		{
			logging.error(arg);
		}

		@JavascriptInterface
		public void trace(String arg)
		{
			logging.trace(arg);
		}

		@JavascriptInterface
		public void warn(String arg)
		{
			logging.warn(arg);
		}
	}
}
