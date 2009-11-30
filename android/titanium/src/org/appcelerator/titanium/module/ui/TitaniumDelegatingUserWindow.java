package org.appcelerator.titanium.module.ui;

import org.appcelerator.titanium.api.ITitaniumUIWebView;
import org.appcelerator.titanium.api.ITitaniumUserWindow;
import org.appcelerator.titanium.api.ITitaniumView;

import android.content.res.Configuration;
import android.view.Menu;
import android.view.MenuItem;

public class TitaniumDelegatingUserWindow implements ITitaniumUserWindow
{
	private ITitaniumUserWindow userWindow;
	private ITitaniumUIWebView uiWebView;

	public TitaniumDelegatingUserWindow(ITitaniumUserWindow userWindow, ITitaniumUIWebView uiWebView)
	{
		this.userWindow = userWindow;
		this.uiWebView = uiWebView;
	}

	public int addEventListener(String eventName, String eventListener) {
		return uiWebView.addWindowEventListener(eventName, eventListener);
	}

	public void addView(String key) {
		userWindow.addView(key);
	}

	public void close() {
		userWindow.close();
	}

	public void dispatchConfigurationChange(Configuration newConfig) {
		userWindow.dispatchConfigurationChange(newConfig);
	}

	public boolean dispatchOptionsItemSelected(MenuItem item) {
		return userWindow.dispatchOptionsItemSelected(item);
	}

	public boolean dispatchPrepareOptionsMenu(Menu menu) {
		return userWindow.dispatchPrepareOptionsMenu(menu);
	}

	public void dispatchTabChange(String data) {
		userWindow.dispatchTabChange(data);
	}

	public void dispatchLoad(String url) {
		userWindow.dispatchLoad(url);
	}

	public void fireEvent(String eventName, String eventData) {
		userWindow.fireEvent(eventName, eventData);
	}

	public int getActiveViewIndex() {
		return userWindow.getActiveViewIndex();
	}

	public ITitaniumView getViewByName(String name) {
		return userWindow.getViewByName(name);
	}

	public int getViewCount() {
		return userWindow.getViewCount();
	}

	public String getViewKey(int i) {
		return userWindow.getViewKey(i);
	}

	public String getViewName(String key) {
		return userWindow.getViewName(key);
	}

	public void removeEventListener(String eventName, int listenerId) {
		uiWebView.removeWindowEventListener(eventName, listenerId);
	}

	public void setActiveViewIndex(int index, String options) {
		userWindow.setActiveViewIndex(index, options);
	}

	public void showView(ITitaniumView view, String options) {
		userWindow.showView(view, options);
	}

	public void showViewByKey(String key, String options) {
		userWindow.showViewByKey(key, options);
	}

	public void open() {
		userWindow.open();
	}

	public void setFullscreen(boolean fullscreen) {
		userWindow.setFullscreen(fullscreen);
	}

	public void setTitle(String title) {
		userWindow.setTitle(title);
	}

	public void setTitleImage(String titleImageUrl) {
		userWindow.setTitleImage(titleImageUrl);
	}

	public void setBackgroundColor(String backgroundColor) {
		userWindow.setBackgroundColor(backgroundColor);
	}

	public void setBackgroundImage(String backgroundImage) {
		userWindow.setBackgroundImage(backgroundImage);
	}

	public void setActivityIndicator(boolean showActivity) {
		userWindow.setActivityIndicator(showActivity);
	}

	public void setOrientation(String orientation) {
		userWindow.setOrientation(orientation);
	}

	public void setUrl(String url) {
		userWindow.setUrl(url);
	}

	public void setWindowId(String windowId) {
		userWindow.setWindowId(windowId);
	}

	public ITitaniumView getViewFromKey(String key) {
		return userWindow.getViewFromKey(key);
	}

	public void registerView(ITitaniumView view) {
		userWindow.registerView(view);
	}

	public void onWindowFocusChanged(boolean hasFocus) {
		userWindow.onWindowFocusChanged(hasFocus);
	}
}
