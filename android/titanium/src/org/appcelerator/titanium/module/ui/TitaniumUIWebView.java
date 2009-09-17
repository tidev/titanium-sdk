package org.appcelerator.titanium.module.ui;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.TitaniumWebView;
import org.appcelerator.titanium.api.ITitaniumLifecycle;
import org.appcelerator.titanium.api.ITitaniumUIWebView;
import org.appcelerator.titanium.api.ITitaniumView;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumFileHelper;
import org.appcelerator.titanium.util.TitaniumJSEventManager;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.res.Configuration;
import android.os.Handler;
import android.os.Message;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.webkit.URLUtil;
import android.webkit.WebView;

public class TitaniumUIWebView
	implements ITitaniumUIWebView, ITitaniumView, Handler.Callback
{
	private static final String LCAT = "TitaniumUIWebView";

	public static final String EVENT_FOCUSED = "focused";
	public static final String EVENT_FOCUSED_JSON = "{type:'" + EVENT_FOCUSED + "'}";
	public static final String EVENT_UNFOCUSED = "unfocused";
	public static final String EVENT_UNFOCUSED_JSON = "{type:'" + EVENT_UNFOCUSED + "'}";
	// App/UI level events
	public static final String EVENT_UI_TABCHANGED = "ui.tabchange";

	private static final int MSG_SHOWING = 300;
	private static final int MSG_CONFIG = 301;

	private TitaniumModuleManager tmm;
	private WebView view;
	private String url;
	private Handler handler;
	private String name;
	private boolean hasBeenOpened;
	private TitaniumJSEventManager eventListeners;
	private String key;

	public TitaniumUIWebView(TitaniumModuleManager tmm) {
		this.tmm = tmm;
		handler = new Handler(this);
		this.hasBeenOpened = false;

		this.eventListeners = new TitaniumJSEventManager(tmm);
		this.eventListeners.supportEvent(EVENT_FOCUSED);
		this.eventListeners.supportEvent(EVENT_UNFOCUSED);
		this.eventListeners.supportEvent(EVENT_UI_TABCHANGED);
	}

	public boolean handleMessage(Message msg) {
		if (msg.what == MSG_CONFIG) {
			String u = url;
			if (!URLUtil.isNetworkUrl(url)) {
				TitaniumFileHelper tfh = new TitaniumFileHelper(tmm.getActivity());
				u = tfh.getResourceUrl(url);
				view = new TitaniumWebView(tmm.getActivity(), u, this);
			} else {
				view = new WebView(tmm.getAppContext());
			}
			return true;
		} else if (msg.what == MSG_SHOWING) {
			if (view != null) {
				if (view instanceof TitaniumWebView) {
					((TitaniumWebView) view).showing();
				} else {
					view.loadUrl(url);
				}
				hasBeenOpened = true;
			}
		}
		return false;
	}

	public void processOptions(String options) {
		try {
			JSONObject o = new JSONObject(options);

			if (o.has("url")) {
				setUrl(o.getString("url"));
			}
			if (o.has("name")) {
				setName(o.getString("name"));
			}

		} catch (JSONException e) {
			Log.e(LCAT, "Unable to process options: " + options, e);
		}
		handler.obtainMessage(MSG_CONFIG).sendToTarget();
	}

	public void setUrl(String url) {
		this.url = url;
	}

	public void showing() {
		if (!hasBeenOpened) {
			handler.obtainMessage(MSG_SHOWING).sendToTarget();
		} else {
			eventListeners.invokeSuccessListeners((TitaniumWebView) view, EVENT_FOCUSED, EVENT_FOCUSED_JSON);
		}
	}

	public void hiding() {
		eventListeners.invokeSuccessListeners((TitaniumWebView) view, EVENT_UNFOCUSED, EVENT_UNFOCUSED_JSON);
	}

	public int addEventListener(String eventName, String listener) {
		return eventListeners.addListener(eventName, listener);
	}

	public void removeEventListener(String eventName, int listenerId) {
		eventListeners.removeListener(eventName, listenerId);
	}

	public void dispatchConfigurationChange(Configuration newConfig) {
		// TODO Auto-generated method stub

	}

	public boolean dispatchOptionsItemSelected(MenuItem item) {
		// TODO Auto-generated method stub
		return false;
	}

	public boolean dispatchPrepareOptionsMenu(Menu menu) {
		// TODO Auto-generated method stub
		return false;
	}

	public void dispatchWindowFocusChanged(boolean hasFocus) {
		// TODO Auto-generated method stub

	}

	public void dispatchApplicationEvent(String eventName, String data) {
		eventListeners.invokeSuccessListeners(eventName, data);
	}

	public ITitaniumLifecycle getLifecycle() {
		return null;
	}

	public View getNativeView() {
		return view;
	}

	public boolean isPrimary() {
		return true;
	}

	public void requestLayout() {
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getKey() {
		return key;
	}

	public void setKey(String key) {
		this.key = key;
	}
}
