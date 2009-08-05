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

	private static final int MSG_OPEN = 300;

	private TitaniumModuleManager tmm;
	private WebView view;
	private String url;
	private Handler handler;

	public TitaniumUIWebView(TitaniumModuleManager tmm) {
		this.tmm = tmm;
		handler = new Handler(this);
	}

	public boolean handleMessage(Message msg) {
		if (msg.what == MSG_OPEN) {
			String u = url;
			if (!URLUtil.isNetworkUrl(url)) {
				TitaniumFileHelper tfh = new TitaniumFileHelper(tmm.getActivity());
				u = tfh.getResourceUrl(url);
				view = new TitaniumWebView(tmm.getActivity(), u, true);
			} else {
				view = new WebView(tmm.getActivity());
				view.loadUrl(u);
			}
			return true;
		}
		return false;
	}
	public void setUrl(String url) {
		this.url = url;
	}

	public void open() {
		handler.obtainMessage(MSG_OPEN).sendToTarget();
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

}
