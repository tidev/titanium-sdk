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

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;

import android.webkit.WebView;

public class TiWebViewBinding {

	private static final String LCAT = "TiWebViewBinding";
	// This is based on binding.min.js.  If you have to change anything...
	// - change binding.js
	// - minify binding.js to create binding.min.js
	protected final static String SCRIPT_INJECTION_ID = "__ti_injection";
	protected final static String INJECTION_CODE;
	static {
		StringBuilder jsonCode = readResourceFile("json2.js");
		StringBuilder tiCode = readResourceFile("binding.min.js");
		StringBuilder allCode = new StringBuilder();
		allCode.append("\n<script id=\"" + SCRIPT_INJECTION_ID + "\">\n");
		if (jsonCode == null) {
			Log.w(LCAT, "Unable to read JSON code for injection");
		} else {
			allCode.append(jsonCode);
		}

		if (tiCode == null) {
			Log.w(LCAT, "Unable to read Titanium binding code for injection");
		} else {
			allCode.append("\n");
			allCode.append(tiCode.toString());
		}
		allCode.append("\n</script>\n");
		jsonCode = null;
		tiCode = null;
		INJECTION_CODE = allCode.toString();
		allCode = null;
	}

	private WebView webView;
	// TODO private APIBinding apiBinding;
	// TODO private AppBinding appBinding;
	
	public TiWebViewBinding(WebView webView)
	{
		this.webView = webView;
		
		//TODO apiBinding = new APIBinding(context);
		//TODO appBinding = new AppBinding(context);
		//TODO webView.addJavascriptInterface(apiBinding, "TiAPI");
		//TODO webView.addJavascriptInterface(appBinding, "TiApp");
		webView.addJavascriptInterface(new TiReturn(), "_TiReturn");
	}

	public TiWebViewBinding(TiContext tiContext, WebView webView)
	{
		this(webView);
	}

	public void destroy() {
	}
	
	private static StringBuilder readResourceFile(String fileName)
	{
		InputStream stream = TiWebViewBinding.class.getClassLoader().getResourceAsStream("ti/modules/titanium/ui/widget/webview/" + fileName);
		BufferedReader reader = new BufferedReader(new InputStreamReader(stream));
		StringBuilder code = new StringBuilder();
		try {
			for (String line = reader.readLine(); line != null; line = reader.readLine()) {
				code.append(line+"\n");
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
	
	private void evalJS(String code)
	{
		webView.loadUrl("javascript:"+code);
	}
	
	private Semaphore returnSemaphore = new Semaphore(0);
	private String returnValue;
	public String getJSValue(String expression)
	{
		String code = "javascript:_TiReturn.setValue((function(){try{return "+expression+"+\"\";}catch(ti_eval_err){return '';}})());";
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
	
	@SuppressWarnings("unused")
	private class TiReturn {
		public void setValue(String value) {
			if (value != null) {
				returnValue = value;
			}
			returnSemaphore.release();
		}
	}
	
	/*TODO @SuppressWarnings("serial")
	private class WebViewCallback extends KrollMethod
	{
		private int id;
		public WebViewCallback(int id) {
			super("webViewCallback$"+id);
			this.id = id;
		}
		
		@Override
		public Object invoke(KrollInvocation invocation, Object[] args) {
			if (args.length > 0 && args[0] instanceof KrollDict) {
				KrollDict data = (KrollDict) args[0];
				String code = "Ti.executeListener("+id+", "+data.toString()+");";
				evalJS(code);
			}
			return KrollProxy.UNDEFINED;
		}
	}*/

	/* TODO @SuppressWarnings("unused")
	private class APIBinding
	{
		private APIModule module;
		public APIBinding(TiContext context) {
			module = context.getTiApp().getModuleByClass(APIModule.class);
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

	@SuppressWarnings("unused")
	private class AppBinding
	{
		private AppModule module;
		
		public AppBinding(TiContext context)
		{
			module = context.getTiApp().getModuleByClass(AppModule.class);
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
			KrollInvocation invocation = KrollInvocation.createMethodInvocation(module.getTiContext(), module.getTiContext().getScope(), null, "addEventListener", null, module);
			int listenerId = module.addEventListener(invocation, event, new WebViewCallback(id));
			invocation.recycle();
			return listenerId;
		}
		
		public void removeEventListener(String event, int id)
		{
			KrollInvocation invocation = KrollInvocation.createMethodInvocation(module.getTiContext(), module.getTiContext().getScope(), null, "removeEventListener", null, module);
			module.removeEventListener(invocation, event, id);
			invocation.recycle();
		}
	}*/
}
