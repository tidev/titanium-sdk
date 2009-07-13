package org.appcelerator.titanium;

import org.appcelerator.titanium.config.TitaniumConfig;
import org.json.JSONObject;

import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.util.Log;
import android.webkit.MimeTypeMap;
import android.webkit.WebSettings;
import android.webkit.WebView;

public class TitaniumWebView extends WebView implements Handler.Callback
{
	private static final String LCAT = "TiWebView";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private static final String JAVASCRIPT = "javascript:";
	private static final String TITANIUM_CALLBACK = "Titanium.callbacks"; //Sent from ti.js

	public static final int MSG_RUN_JAVASCRIPT = 300;
	public static final int MSG_LOAD_FROM_SOURCE = 301;

	protected static final String MSG_EXTRA_URL = "url";
	protected static final String MSG_EXTRA_SOURCE = "source";

	private TitaniumActivity activity;
	private Handler handler;
	private MimeTypeMap mtm;


	public TitaniumWebView(TitaniumActivity activity) {
		super(activity);
		this.activity = activity;
		this.handler = new Handler(this);
		this.mtm = MimeTypeMap.getSingleton();

		WebSettings settings = getSettings();

		setVerticalScrollbarOverlay(true);

        settings.setJavaScriptEnabled(true);
        settings.setSupportMultipleWindows(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setSupportZoom(false);
        settings.setLoadsImagesAutomatically(true);
        settings.setLightTouchEnabled(true);

		Log.e(LCAT, "WVThreadName: " + Thread.currentThread().getName());
	}

	public void evalJS(final String method) {
		evalJS(method, (String) null);
	}

	public void evalJS(final String method, final JSONObject data)
	{
		String dataValue = null;

		if (data != null) {
			dataValue = data.toString();
		}

		evalJS(method, dataValue);
	}

	public void evalJS(final String method, final String data)
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

		if (handler != null) {
			if (!expr.startsWith(JAVASCRIPT)) {
				expr = JAVASCRIPT + expr;
			}
			handler.obtainMessage(MSG_RUN_JAVASCRIPT, expr).sendToTarget();
		} else {
			Log.w(LCAT, "Handler not available for dispatching event");
		}

	}

	public boolean handleMessage(Message msg)
	{
		boolean handled = false;
		Bundle b = msg.getData();

		switch (msg.what) {
		case MSG_RUN_JAVASCRIPT :
				loadUrl((String) msg.obj);
				handled = true;
			break;
		case MSG_LOAD_FROM_SOURCE:
      		String url = b.getString(MSG_EXTRA_URL);
      		String source = b.getString(MSG_EXTRA_SOURCE);

			String extension = MimeTypeMap.getFileExtensionFromUrl(url);
			String mimetype = "application/octet-stream";
			if (extension != null) {
				String type = mtm.getMimeTypeFromExtension(extension);
				if (type != null) {
					mimetype = type;
				} else {
					mimetype = "text/html";
				}

				if("text/html".equals(mimetype)) {

					if (source != null) {
							loadDataWithBaseURL(url, source, mimetype, "utf-8", "about:blank");
							return true;
					} else {
						loadUrl(url); // For testing, doesn't normally run.
					}
				}
			}
			handled = true;
			break;
		}

		return handled;
	}

	public void loadFromSource(String url, String source)
	{
		Message m = handler.obtainMessage(MSG_LOAD_FROM_SOURCE);
		Bundle b = m.getData();
		b.putString(MSG_EXTRA_URL, url);
		b.putString(MSG_EXTRA_SOURCE, source);
		m.sendToTarget();
	}
}
