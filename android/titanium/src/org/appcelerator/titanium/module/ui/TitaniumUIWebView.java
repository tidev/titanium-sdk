package org.appcelerator.titanium.module.ui;

import org.appcelerator.titanium.TitaniumModuleManager;
import org.appcelerator.titanium.TitaniumWebView;
import org.appcelerator.titanium.api.ITitaniumLifecycle;
import org.appcelerator.titanium.api.ITitaniumUIWebView;
import org.appcelerator.titanium.api.ITitaniumView;
import org.appcelerator.titanium.util.TitaniumFileHelper;

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

	private static final int MSG_SHOWING = 300;
	private static final int MSG_CONFIG = 301;

	private TitaniumModuleManager tmm;
	private WebView view;
	private String url;
	private Handler handler;
	private String name;
	private String openJSON;
	private boolean hasBeenOpened;

	public TitaniumUIWebView(TitaniumModuleManager tmm) {
		this.tmm = tmm;
		handler = new Handler(this);
		this.hasBeenOpened = false;
	}

	public boolean handleMessage(Message msg) {
		if (msg.what == MSG_CONFIG) {
			String u = url;
			if (!URLUtil.isNetworkUrl(url)) {
				TitaniumFileHelper tfh = new TitaniumFileHelper(tmm.getActivity());
				u = tfh.getResourceUrl(url);
				view = new TitaniumWebView(tmm.getActivity(), u, true);
			} else {
				view = new WebView(tmm.getActivity());
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
	public void setUrl(String url) {
		this.url = url;
	}

	public void configure(String json) {
		this.openJSON = json;
		handler.obtainMessage(MSG_CONFIG).sendToTarget();
	}
	public void showing() {
		if (!hasBeenOpened) {
			handler.obtainMessage(MSG_SHOWING).sendToTarget();
		}
	}

	public void hiding() {
		// TODO Auto-generated method stub

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
}
