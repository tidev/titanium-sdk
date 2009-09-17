/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium;

import java.lang.ref.WeakReference;

import org.appcelerator.titanium.api.ITitaniumView;
import org.appcelerator.titanium.config.TitaniumConfig;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumActivityHelper;
import org.appcelerator.titanium.util.TitaniumUIHelper;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.webkit.URLUtil;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class TiWebViewClient extends WebViewClient
{
	private static final String LCAT = "TiWVC";
	private static final boolean DBG = TitaniumConfig.LOGD;

	private WeakReference<TitaniumActivity> weakActivity;

	public TiWebViewClient(TitaniumActivity activity)
	{
		super();
		this.weakActivity = new WeakReference<TitaniumActivity>(activity);
	}

	@Override
	public void onPageFinished (WebView view, String url)
	{
		super.onPageFinished(view,url);
		if (DBG) {
			Log.d(LCAT, "Page Finished");
		}
		TitaniumActivity activity = weakActivity.get();
		if (activity != null) {
			if (activity.getLoadOnPageEnd()) {
				ITitaniumView tiView = (ITitaniumView) view;
				if (activity.getViewCount() == 1) {
					activity.setActiveView(tiView, null);
				} else {
					if (tiView != null) {
						tiView.showing();
					}
				}
			}

			// Fire a fake tab change
			Activity root = TitaniumActivityHelper.getRootActivity(activity);
			if (root != null && root instanceof TitaniumActivityGroup) {
				TitaniumActivityGroup tag = (TitaniumActivityGroup) root;
				if (view instanceof TitaniumWebView) {
					TitaniumWebView twv = (TitaniumWebView) view;
					if (!twv.isUseAsView()) {
						String data = tag.getLastTabChange();
						if (data != null) {
							try {
								activity.onTabChange(data);
							} catch (Throwable t) {
								Log.e(LCAT, "Error while firing initial tab change on open: ", t);
							}
						}
					} else {
						if (DBG) {
							Log.d(LCAT, "Not sending fake tabchange to webview used as a view");
						}
					}
				}
			}
		}
	}

	@Override
	public void onReceivedError(WebView view, int errorCode, String description, String failingUrl)
	{
		super.onReceivedError(view, errorCode, description, failingUrl);
		String text = "Err("+errorCode+") " + description;
		TitaniumUIHelper.doKillOrContinueDialog(view.getContext(), "Resource Not Found", text, null, null);
		Log.e(LCAT, "Received on error" + text);
	}

	@Override
	public boolean shouldOverrideUrlLoading(final WebView view, String url) {
		if (DBG) {
			Log.d(LCAT, "url=" + url);
		}

		if (URLUtil.isAssetUrl(url) || URLUtil.isContentUrl(url) || URLUtil.isFileUrl(url)) {
			TitaniumWebView twv = (TitaniumWebView) view;
			twv.loadFromSource(url, null);
			return true;
		} else if (URLUtil.isNetworkUrl(url)) {
            Intent i = new Intent( Intent.ACTION_VIEW, Uri.parse(url) );
            i.addFlags( Intent.FLAG_ACTIVITY_NEW_TASK);
            view.getContext().startActivity(i);
            return true;
		} else if(url.startsWith(WebView.SCHEME_TEL)) {
			Log.i(LCAT, "Launching dialer for " + url);
			Intent dialer = Intent.createChooser(new Intent(Intent.ACTION_DIAL, Uri.parse(url)), "Choose Dialer");
			TitaniumActivity activity = weakActivity.get();
			if (activity != null) {
				activity.startActivity(dialer);
			}
	        return true;
		} else if (url.startsWith(WebView.SCHEME_MAILTO)) {
			Log.i(LCAT, "Launching mailer for " + url);
			Intent mailer = Intent.createChooser(new Intent(Intent.ACTION_SENDTO, Uri.parse(url)), "Send Message");
			TitaniumActivity activity = weakActivity.get();
			if (activity != null) {
				activity.startActivity(mailer);
			}
	        return true;
		} else if (url.startsWith(WebView.SCHEME_GEO)) {
			Log.i(LCAT, "Launching app for " + url);
			/*geo:latitude,longitude
			geo:latitude,longitude?z=zoom
			geo:0,0?q=my+street+address
			geo:0,0?q=business+near+city
			*/
			Intent geoviewer = Intent.createChooser(new Intent(Intent.ACTION_VIEW, Uri.parse(url)), "Choose Viewer");
			TitaniumActivity activity = weakActivity.get();
			if (activity != null) {
				activity.startActivity(geoviewer);
			}
			return true;
		} else {
			if (DBG) {
				Log.e(LCAT, "NEED to Handle " + url);
			}
		}

		return false;
	}
}
