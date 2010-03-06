package ti.modules.titanium.ui.widget.webview;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.concurrent.Semaphore;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.kroll.IKrollCallable;
import org.appcelerator.titanium.util.Log;
import org.json.JSONException;
import org.json.JSONObject;

import ti.modules.titanium.api.APIModule;
import ti.modules.titanium.app.AppModule;
import android.webkit.WebView;

public class TiWebViewBinding {

	private static final String LCAT = "TiWebViewBinding";
	
	private WebView webView;
	public TiWebViewBinding(TiContext context, WebView webView)
	{
		this.webView = webView;
		
		webView.addJavascriptInterface(new APIBinding(context), "_TiAPI");
		webView.addJavascriptInterface(new AppBinding(context), "_TiApp");
		webView.addJavascriptInterface(new TiReturn(), "_TiReturn");
		
		evalJS(getClass().getClassLoader().getResourceAsStream("ti/modules/titanium/ui/widget/webview/json2.js"));
		evalJS(getClass().getClassLoader().getResourceAsStream("ti/modules/titanium/ui/widget/webview/binding.js"));
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
		Log.d(LCAT, "evaluating code: " + code);
		webView.loadUrl("javascript:"+code);
	}
	
	private Semaphore returnSemaphore = new Semaphore(0);
	private String returnValue;
	public String getJSValue(String expression)
	{
		webView.loadUrl("javascript:_TiReturn.setValue((function(){return "+expression+"})());");
		try {
			returnSemaphore.acquire();
			return returnValue;
		} catch (InterruptedException e) {
			Log.e(LCAT, "Interrupted", e);
		}
		return null;
	}
	
	
	private class TiReturn {
		public void setValue(Object value) {
			if (value instanceof String) {
				returnValue = (String)value;
			} else {
				returnValue = value.toString();
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
		
		public void callWithProperties(TiDict data) {
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
				module.fireEvent(event, new TiDict(new JSONObject(json)));
			} catch (JSONException e) {
				Log.e(LCAT, "Error parsing event JSON", e);
			}
		}
		
		public void addEventListener(String event, int id)
		{
			module.addEventListener(event, new WebViewCallback(id));
		}
	}
}
