/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
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
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiContext;
import org.json.JSONException;
import org.json.JSONObject;

import android.webkit.WebView;

public class TiWebViewBinding
{

	private static final String LCAT = "TiWebViewBinding";
	// This is based on binding.min.js. If you have to change anything...
	// - change binding.js
	// - minify binding.js to create binding.min.js
	protected final static String SCRIPT_INJECTION_ID = "__ti_injection";
	protected final static String INJECTION_CODE;

	protected static String BINDING_CODE = "";
	protected static String JSON_CODE = "";
	static {
		StringBuilder jsonCode = readResourceFile("json2.js");
		StringBuilder tiCode = readResourceFile("binding.min.js");
		StringBuilder allCode = new StringBuilder();
		allCode.append("\n<script id=\"" + SCRIPT_INJECTION_ID + "\">\n");
		if (jsonCode == null) {
			Log.w(LCAT, "Unable to read JSON code for injection");
		} else {
			allCode.append(jsonCode);
			JSON_CODE = jsonCode.toString();
		}

		if (tiCode == null) {
			Log.w(LCAT, "Unable to read Titanium binding code for injection");
		} else {
			allCode.append("\n");
			allCode.append(tiCode.toString());
			BINDING_CODE = tiCode.toString();
		}
		allCode.append("\n</script>\n");
		jsonCode = null;
		tiCode = null;
		INJECTION_CODE = allCode.toString();
		allCode = null;
	}

	private Stack<String> codeSnippets;
	private boolean destroyed;

	private KrollLogging apiBinding;
	private AppBinding appBinding;

	public TiWebViewBinding(WebView webView)
	{
		codeSnippets = new Stack<String>();

		apiBinding = KrollLogging.getDefault();
		appBinding = new AppBinding();
		webView.addJavascriptInterface(appBinding, "TiApp");
		webView.addJavascriptInterface(apiBinding, "TiAPI");
		webView.addJavascriptInterface(new TiReturn(), "_TiReturn");
	}

	public TiWebViewBinding(TiContext tiContext, WebView webView)
	{
		this(webView);
	}

	public void destroy()
	{
		// remove any event listener that have already been added to the Ti.APP through
		// this web view instance
		appBinding.clearEventListeners();

		returnSemaphore.release();
		codeSnippets.clear();
		destroyed = true;
	}

	private static StringBuilder readResourceFile(String fileName)
	{
		InputStream stream = TiWebViewBinding.class.getClassLoader().getResourceAsStream(
			"ti/modules/titanium/ui/widget/webview/" + fileName);
		BufferedReader reader = new BufferedReader(new InputStreamReader(stream));
		StringBuilder code = new StringBuilder();
		try {
			for (String line = reader.readLine(); line != null; line = reader.readLine()) {
				code.append(line + "\n");
			}
		} catch (IOException e) {
			Log.e(LCAT, "Error reading input stream", e);
			return null;
		} finally {
			if (stream != null) {
				try {
					stream.close();
				} catch (IOException e) {
					Log.w(LCAT, "Problem closing input stream.", e);
				}
			}
		}
		return code;
	}

	private Semaphore returnSemaphore = new Semaphore(0);
	private String returnValue;

	public String getJSValue(String expression)
	{
		// Don't try to evaluate js code again if the binding has already been destroyed
		if (!destroyed) {
			String code = "javascript:_TiReturn.setValue((function(){try{return " + expression
				+ "+\"\";}catch(ti_eval_err){return '';}})());";
			Log.d(LCAT, "getJSValue:" + code);
			synchronized (this) {
				codeSnippets.push(code);
			}
			try {
				if (!returnSemaphore.tryAcquire(1000, TimeUnit.MILLISECONDS)) {
					Log.w(LCAT, "Timeout waiting to evaluate JS");
				}
				return returnValue;
			} catch (InterruptedException e) {
				Log.e(LCAT, "Interrupted", e);
			}
		}
		return null;
	}

	@SuppressWarnings("unused")
	private class TiReturn
	{
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
				JSONObject json = new JSONObject((HashMap) data);
				dataString = ", " + json.toString();
			} else {
				dataString = ", " + data;
			}

			String code = "javascript:Ti.executeListener(" + id + dataString + ");";
			synchronized (this) {
				codeSnippets.push(code);
			}
		}
	}

	@SuppressWarnings("unused")
	private class AppBinding
	{
		private KrollModule module;
		private HashMap<String, Integer> appListeners = new HashMap<String, Integer>();

		public AppBinding()
		{
			module = TiApplication.getInstance().getModuleByName("App");
		}

		public void fireEvent(String event, String json)
		{
			try {
				KrollDict dict = new KrollDict();
				if (json != null && !json.equals("undefined")) {
					dict = new KrollDict(new JSONObject(json));
				}
				module.fireEvent(event, dict);
			} catch (JSONException e) {
				Log.e(LCAT, "Error parsing event JSON", e);
			}
		}

		public int addEventListener(String event, int id)
		{
			WebViewCallback callback = new WebViewCallback(id);

			int result = module.addEventListener(event, callback);
			appListeners.put(event, result);

			return result;
		}

		public void removeEventListener(String event, int id)
		{
			module.removeEventListener(event, id);
		}

		public void clearEventListeners()
		{
			for (String event : appListeners.keySet()) {
				removeEventListener(event, appListeners.get(event));
			}
		}

		public String getJSCode()
		{
			String code;
			synchronized (this) {
				code = codeSnippets.empty() ? "" : codeSnippets.pop();
			}

			if (destroyed) {
				return null;
			}
			return code;
		}
	}
}
