/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui.widget.webview;

import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;

import ti.modules.titanium.ui.WebViewProxy;
import android.content.Intent;
import android.net.Uri;
import android.webkit.URLUtil;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class TiWebViewClient extends WebViewClient
{
	private static final String LCAT = "TiWVC";
	private static final boolean DBG = TiConfig.LOGD;
	private WebViewProxy proxy;
	
	public TiWebViewClient(WebViewProxy proxy) {
		super();
		this.proxy = proxy;
	}
	
	@Override
	public void onReceivedError(WebView view, int errorCode, String description, String failingUrl)
	{
		super.onReceivedError(view, errorCode, description, failingUrl);
		
		//TODO report this to the user
		String text = "Javascript Error("+errorCode+"): " + description;
		Log.e(LCAT, "Received on error" + text);
	}

	@Override
	public boolean shouldOverrideUrlLoading(final WebView view, String url) {
		if (DBG) {
			Log.d(LCAT, "url=" + url);
		}

		if (URLUtil.isAssetUrl(url) || URLUtil.isContentUrl(url) || URLUtil.isFileUrl(url)) {
			// go through the proxy to ensure we're on the UI thread
			proxy.setUrl(url);
			return true;
		} else if (URLUtil.isNetworkUrl(url)) {
            Intent i = new Intent( Intent.ACTION_VIEW, Uri.parse(url) );
            i.addFlags( Intent.FLAG_ACTIVITY_NEW_TASK);
            view.getContext().startActivity(i);
            return true;
		} else if(url.startsWith(WebView.SCHEME_TEL)) {
			Log.i(LCAT, "Launching dialer for " + url);
			Intent dialer = Intent.createChooser(new Intent(Intent.ACTION_DIAL, Uri.parse(url)), "Choose Dialer");
			proxy.getTiContext().getActivity().startActivity(dialer);
	        return true;
		} else if (url.startsWith(WebView.SCHEME_MAILTO)) {
			Log.i(LCAT, "Launching mailer for " + url);
			Intent mailer = Intent.createChooser(new Intent(Intent.ACTION_SENDTO, Uri.parse(url)), "Send Message");
			proxy.getTiContext().getActivity().startActivity(mailer);
	        return true;
		} else if (url.startsWith(WebView.SCHEME_GEO)) {
			Log.i(LCAT, "Launching app for " + url);
			/*geo:latitude,longitude
			geo:latitude,longitude?z=zoom
			geo:0,0?q=my+street+address
			geo:0,0?q=business+near+city
			*/
			Intent geoviewer = Intent.createChooser(new Intent(Intent.ACTION_VIEW, Uri.parse(url)), "Choose Viewer");
			proxy.getTiContext().getActivity().startActivity(geoviewer);
			return true;
		} else {
			if (DBG) {
				Log.e(LCAT, "NEED to Handle " + url);
			}
		}

		return false;
	}
}
