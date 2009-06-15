package org.appcelerator.titanium.module.ui;

import java.lang.ref.SoftReference;

import org.appcelerator.titanium.api.ITitaniumNotifier;
import org.appcelerator.titanium.util.TitaniumJSEventManager;

import android.os.Handler;
import android.util.Config;
import android.webkit.WebView;

public abstract class TitaniumNotifier implements ITitaniumNotifier
{
	@SuppressWarnings("unused")
	private static final String LCAT = "TiNotifier";
	@SuppressWarnings("unused")
	private static final boolean DBG = Config.LOGD;

	protected SoftReference<WebView> softWebView;
	protected boolean showing;
	protected String callback;
	protected int delay;
	protected String iconUrl;
	protected String message;
	protected String title;
	protected TitaniumJSEventManager eventListeners;

	public TitaniumNotifier(Handler handler, WebView webView) {
		this.softWebView = new SoftReference<WebView>(webView);
		showing = false;
		delay = 0;
		eventListeners = new TitaniumJSEventManager(handler, webView);
	}

	protected SoftReference<WebView> getWebView()
	{
		return this.softWebView;
	}

	public void addEventListener(String eventName, String listener) {
		eventListeners.addListener(eventName, listener);
	}
	public void setCallback(String callback)
	{
		this.callback = callback;
	}

	protected int getDelay()
	{
		return this.delay;
	}
	public void setDelay(int delay)
	{
		this.delay = delay;
	}

	protected String getIcon() {
		return this.iconUrl;
	}
	public void setIcon(String iconUrl) {
		this.iconUrl = iconUrl;
	}

	protected String getMessage()
	{
		return this.message;
	}
	public void setMessage(String message) {
		this.message = message;
	}

	protected String getTitle()
	{
		return this.title;
	}

	public void setTitle(String title) {
		this.title = title;
	}

	abstract public void show(boolean animate, boolean autohide);
	abstract public void hide(boolean animate);
}
