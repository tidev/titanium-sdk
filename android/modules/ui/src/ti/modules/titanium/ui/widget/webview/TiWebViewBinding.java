/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.webview;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.concurrent.Semaphore;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;
import org.json.JSONException;
import org.json.JSONObject;

import ti.modules.titanium.api.APIModule;
import ti.modules.titanium.app.AppModule;
import android.webkit.WebView;

public class TiWebViewBinding {

	private static final String LCAT = "TiWebViewBinding";
	
	private WebView webView;
	private APIBinding apiBinding;
	private AppBinding appBinding;
	
	public TiWebViewBinding(TiContext context, WebView webView)
	{
		this.webView = webView;
		
		apiBinding = new APIBinding(context);
		appBinding = new AppBinding(context);
		webView.addJavascriptInterface(apiBinding, "TiAPI");
		webView.addJavascriptInterface(appBinding, "TiApp");
		webView.addJavascriptInterface(new TiReturn(), "_TiReturn");
		insertApiBindings();		
	}
	
	public void insertApiBindings() 
	{
		evalJS(getClass().getClassLoader().getResourceAsStream("ti/modules/titanium/ui/widget/webview/json2.js"));
		evalJS(getClass().getClassLoader().getResourceAsStream("ti/modules/titanium/ui/widget/webview/binding.js"));	
	}
	
	public void destroy() {
		appBinding.module.onDestroy();
		apiBinding.module.onDestroy();
	}
	
	private void evalJS(InputStream stream)
	{
		BufferedReader reader = new BufferedReader(new InputStreamReader(stream));
		StringBuffer code = new StringBuffer();
		try {
			for (String line = reader.readLine(); line != null; line = reader.readLine()) {
				code.append(line+"\n");
			}
			evalJS(code.toString());
		} catch (IOException e) {
			Log.e(LCAT, "Error reading input stream", e);
		}
	}
	
	private void evalJS(String code)
	{
		webView.loadUrl("javascript:"+code);
	}
	
	private Semaphore returnSemaphore = new Semaphore(0);
	private String returnValue;
	public String getJSValue(String expression)
	{
		String code = "javascript:_TiReturn.setValue((function(){return "+expression+"+\"\";})());";
		Log.d(LCAT, "getJSValue:"+code);
		webView.loadUrl(code);
		try {
			returnSemaphore.acquire();
			return returnValue;
		} catch (InterruptedException e) {
			Log.e(LCAT, "Interrupted", e);
		}
		return null;
	}
	
	
	private class TiReturn {
		public void setValue(String value) {
			if (value != null) {
				returnValue = value;
			}
			returnSemaphore.release();
		}
	}
	
	private class WebViewCallback implements IKrollCallable
	{
		private int id;
		public WebViewCallback(int id) {
			this.id = id;
		}
		
		// These shouldn't be necessary?
		public void call() {}
		public void call(Object[] args) {}
		
		public void callWithProperties(KrollDict data) {
			String code = "Ti.executeListener("+id+", "+data.toString()+");";
			evalJS(code);
		}
	}

	private class APIBinding
	{
		private APIModule module;
		public APIBinding(TiContext context) {
			module = new APIModule(context);
		}
		public void critical(String msg) {
			module.critical(msg);
		}
		public void debug(String msg) {
			module.debug(msg);
		}
		public void error(String msg) {
			module.error(msg);
		}
		public void fatal(String msg) {
			module.fatal(msg);
		}
		public void info(String msg) {
			module.info(msg);
		}
		public void log(String level, String msg) {
			module.log(level, msg);
		}
		public void notice(String msg) {
			module.notice(msg);
		}
		public void trace(String msg) {
			module.trace(msg);
		}
		public void warn(String msg) {
			module.warn(msg);
		}
	}
	
	private class AppBinding
	{
		private AppModule module;
		
		public AppBinding(TiContext context)
		{
			module = new AppModule(context);
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
			return module.addEventListener(event, new WebViewCallback(id));
		}
		
		public void removeEventListener(String event, int id)
		{
			module.removeEventListener(event, id);
		}
	}
}
