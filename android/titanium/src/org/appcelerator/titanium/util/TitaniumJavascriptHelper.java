package org.appcelerator.titanium.util;

import org.json.JSONObject;

import android.os.Handler;
import android.util.Config;
import android.util.Log;
import android.webkit.WebView;

public class TitaniumJavascriptHelper
{
	private static final String LCAT = "TiJSHelper";
	private static final boolean DBG = Config.LOGD;

	private static final String JAVASCRIPT = "javascript:";
	private static final String TITANIUM_CALLBACK = "Titanium.callbacks"; //Sent from ti.js

	private static final String NOTIFICATION_1 =
		" var n = Titanium.UI.createAlertDialog(); n.setTitle('HTTPClient');" +
		"n.setMessage('";
	private static final String NOTIFICATION_2 =
		"'); n.setButtonNames('OK'); n.show();"
		;


	public static void evalJS(final WebView webView, final Handler handler, final String method) {
		evalJS(webView, handler, method, (String) null);
	}
	/**
	 * evaluate Javascript in the context of the webview
	 */

	public static void evalJS(final WebView webView, final Handler handler, final String method, final JSONObject data)
	{
		String dataValue = null;

		if (data != null) {
			dataValue = data.toString();
		}

		evalJS(webView, handler, method, dataValue);
	}

	public static void evalJS(final WebView webView, final Handler handler, final String method, final String data)
	{
		String expr = method;
		if (expr != null && expr.startsWith(TITANIUM_CALLBACK)) {
			if (data != null) {
				expr += ".invoke(" + data + ")";
			} else {
				expr += ".invoke()";
			}
			if (DBG) {
				Log.d(LCAT, expr);
			}
		}
		final String fExpr = expr;
		if (handler != null) {
			handler.post(new Runnable() {
				public void run() {
					String expr = fExpr;
					if (!expr.startsWith(JAVASCRIPT)) {
						expr = JAVASCRIPT + expr;
					}
					if (webView != null) {
						webView.loadUrl(expr);
					} else {
						Log.i(LCAT, "Unable to dispatch event: " + expr +". webView no longer exists.");
					}
				}
			});
		} else {
			Log.w(LCAT, "Handler not available for dispatching event");
		}

	}


	public static String createTitaniumNotification(String message) {
		String result = null;

		if (message != null) {
			result = NOTIFICATION_1 + message + NOTIFICATION_2;
		} else {
			result = NOTIFICATION_1 + "null" + NOTIFICATION_2;
		}
		return result;
	}
}
