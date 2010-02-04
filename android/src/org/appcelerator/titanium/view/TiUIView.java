package org.appcelerator.titanium.view;


import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.TiProxyListener;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TitaniumCompositeLayout.TitaniumCompositeLayoutParams;

import android.content.Context;
import android.view.View;
import android.view.View.OnFocusChangeListener;
import android.view.inputmethod.InputMethodManager;

public abstract class TiUIView
	implements TiProxyListener, OnFocusChangeListener
{
	private static final String LCAT = "TiUIView";

	protected View nativeView; // Native View object

	protected TiViewProxy proxy;
	protected TiViewProxy parent;

	protected TitaniumCompositeLayoutParams layoutParams;
	protected int zIndex;

	public TiUIView(TiViewProxy proxy)
	{
		this.proxy = proxy;
		this.layoutParams = new TitaniumCompositeLayout.TitaniumCompositeLayoutParams();
	}

	public TiViewProxy getProxy() {
		return proxy;
	}
	public void setProxy(TiViewProxy proxy) {
		this.proxy = proxy;
	}
	public TiViewProxy getParent() {
		return parent;
	}
	public void setParent(TiViewProxy parent) {
		this.parent = parent;
	}
	public TitaniumCompositeLayoutParams getLayoutParams() {
		return layoutParams;
	}
	public int getZIndex() {
		return zIndex;
	}
	public View getNativeView() {
		return nativeView;
	}
	public void setNativeView(View view) {
		this.nativeView = view;
		nativeView.setOnFocusChangeListener(this);
	}
	protected void setLayoutParams(TitaniumCompositeLayoutParams layoutParams) {
		this.layoutParams = layoutParams;
	}
	protected void setZIndex(int index) {
		zIndex = index;
	}

	public void listenerAdded(String type, int count, TiProxy proxy) {
	}

	public void listenerRemoved(String type, int count, TiProxy proxy) {
	}

	public void propertyChanged(String key, Object oldValue, Object newValue, TiProxy proxy)
	{
		if (key.equals("left")) {
			layoutParams.optionLeft = TiConvert.toTiDimension((String) newValue).getIntValue();
			nativeView.requestLayout();
		} else if (key.equals("top")) {
			layoutParams.optionTop = TiConvert.toTiDimension((String) newValue).getIntValue();
			nativeView.requestLayout();
		} else if (key.equals("right")) {
			layoutParams.optionRight = TiConvert.toTiDimension((String) newValue).getIntValue();
			nativeView.requestLayout();
		} else if (key.equals("bottom")) {
			layoutParams.optionBottom = TiConvert.toTiDimension((String) newValue).getIntValue();
			nativeView.requestLayout();
		} else if (key.equals("height")) {
			layoutParams.optionHeight = TiConvert.toTiDimension((String) newValue).getIntValue();
			nativeView.requestLayout();
		} else if (key.equals("width")) {
			layoutParams.optionWidth = TiConvert.toTiDimension((String) newValue).getIntValue();
			nativeView.requestLayout();
		} else {
			Log.i(LCAT, "Unhandled property key: " + key);
		}
	}

	public void processProperties(TiDict d)
	{
		if (TiConvert.fillLayout(d, layoutParams)) {
			nativeView.requestLayout();
		}

		// Default background processing.
		// Prefer image to color.
		if (d.containsKey("backgroundImage")) {
			throw new IllegalArgumentException("Please Implement.");
		} else if (d.containsKey("backgroundColor")) {
			nativeView.setBackgroundDrawable(TiConvert.toColorDrawable(d, "backgroundColor"));
		}
	}

	public void onFocusChange(View v, boolean hasFocus)
	{
		if (hasFocus) {
			proxy.fireEvent("focus", null);
		} else {
			proxy.fireEvent("blur", null);
		}
	}

	protected InputMethodManager getIMM() {
		InputMethodManager imm = null;
		imm = (InputMethodManager) proxy.getTiContext().getTiApp().getSystemService(Context.INPUT_METHOD_SERVICE);
		return imm;
	}

	public void focus() {
		if (nativeView != null) {
			nativeView.requestFocus();
		}
	}

	public void blur() {
		if (nativeView != null) {
	        InputMethodManager imm = getIMM();
	        if (imm != null) {
	        	imm.hideSoftInputFromWindow(nativeView.getWindowToken(), 0);
	        }
			nativeView.clearFocus();
		}
	}
}
