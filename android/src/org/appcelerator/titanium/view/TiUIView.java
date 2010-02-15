/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.view;


import java.io.IOException;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.TiProxyListener;
import org.appcelerator.titanium.io.TiBaseFile;
import org.appcelerator.titanium.io.TiFileFactory;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiBorderHelper.BorderSupport;
import org.appcelerator.titanium.view.TitaniumCompositeLayout.TitaniumCompositeLayoutParams;

import android.content.Context;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.view.View;
import android.view.ViewGroup;
import android.view.View.OnFocusChangeListener;
import android.view.animation.Animation;
import android.view.animation.AnimationSet;
import android.view.inputmethod.InputMethodManager;

public abstract class TiUIView
	implements TiProxyListener, OnFocusChangeListener
{
	private static final String LCAT = "TiUIView";
	private static final boolean DBG = TiConfig.LOGD;

	private static AtomicInteger idGenerator;

	protected View nativeView; // Native View object

	protected TiViewProxy proxy;
	protected TiViewProxy parent;
	protected Animation anim;

	protected TitaniumCompositeLayoutParams layoutParams;
	protected int zIndex;

	public TiUIView(TiViewProxy proxy)
	{
		if (idGenerator == null) {
			idGenerator = new AtomicInteger(0);
		}

		this.proxy = proxy;
		this.layoutParams = new TitaniumCompositeLayout.TitaniumCompositeLayoutParams();
	}

	public void add(TiUIView child)
	{
		if (child != null) {
			View cv = child.getNativeView();
			if (cv != null) {
				View nv = getNativeView();
				if (nv instanceof ViewGroup) {
					((ViewGroup) nv).addView(cv, child.getLayoutParams());
				}
			}
		}
	}

	public void remove(TiUIView child)
	{
		if (child != null) {
			View cv = child.getNativeView();
			if (cv != null) {
				View nv = getNativeView();
				if (nv instanceof ViewGroup) {
					((ViewGroup) nv).removeView(cv);
				}
			}
		}
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
	protected View getNativeView() {
		return nativeView;
	}
	protected void setNativeView(View view) {
		if (view.getId() == View.NO_ID) {
			view.setId(idGenerator.incrementAndGet());
		}
		this.nativeView = view;
		nativeView.setOnFocusChangeListener(this);
	}
	protected void setLayoutParams(TitaniumCompositeLayoutParams layoutParams) {
		this.layoutParams = layoutParams;
	}
	protected void setZIndex(int index) {
		zIndex = index;
	}
	public void animate(final AnimationSet as) {
		if (as != null) {
			final View nv = getNativeView();
			if (nv != null) {
				getProxy().getTiContext().getActivity().runOnUiThread(new Runnable(){

					@Override
					public void run() {
						nv.startAnimation(as);
					}

				});
			} else {
				anim = as;
			}
		}
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
		} else if (key.equals("visible")) {
			nativeView.setVisibility(TiConvert.toBoolean(newValue) ? View.VISIBLE : View.INVISIBLE);
		} else {
			Log.i(LCAT, "Unhandled property key: " + key);
		}
	}

	public void processProperties(TiDict d)
	{
		if (TiConvert.fillLayout(d, layoutParams)) {
			if (nativeView != null) {
				nativeView.requestLayout();
			}
		}

		Integer bgColor = null;

		// Default background processing.
		// Prefer image to color.
		if (d.containsKey("backgroundImage")) {
			String path = TiConvert.toString(d, "backgroundImage");
			String url = getProxy().getTiContext().resolveUrl(path);
			TiBaseFile file = TiFileFactory.createTitaniumFile(getProxy().getTiContext(), new String[] { url }, false);
			try {
				nativeView.setBackgroundDrawable(Drawable.createFromStream(
					file.getInputStream(), file.getNativeFile().getName()));
			} catch (IOException e) {
				Log.e(LCAT, "Error creating background image from path: " + path.toString(), e);
			}
		} else if (d.containsKey("backgroundColor")) {
			bgColor = TiConvert.toColor(d, "backgroundColor", "opacity");
			nativeView.setBackgroundDrawable(new ColorDrawable(bgColor));
		}
		if (d.containsKey("visible")) {
			nativeView.setVisibility(TiConvert.toBoolean(d, "visible") ? View.VISIBLE : View.INVISIBLE);
		}

		if (nativeView instanceof BorderSupport) {
			TiBorderHelper borderHelper = ((BorderSupport) nativeView).getBorderHelper();
			if (borderHelper != null) {
				if (d.containsKey("borderColor") || d.containsKey("borderRadius")) {
					if (d.containsKey("borderRadius")) {
						borderHelper.setBorderRadius(TiConvert.toFloat(d, "borderRadius"));
					}
					if (d.containsKey("borderColor")) {
						borderHelper.setBorderColor(TiConvert.toColor(d, "borderColor", "opacity"));
					} else {
						borderHelper.setBorderColor(bgColor);
					}

					if (d.containsKey("borderWidth")) {
						borderHelper.setBorderWidth(TiConvert.toFloat(d, "borderWidth"));
					}
				}
			} else {
				throw new IllegalStateException("Views providing BorderSupport, must return a non-null TiBorderHelper");
			}
		}
	}

	public void onFocusChange(View v, boolean hasFocus)
	{
		if (hasFocus) {
			proxy.fireEvent("focus", getFocusEventObject(hasFocus));
		} else {
			proxy.fireEvent("blur", getFocusEventObject(hasFocus));
		}
	}

	protected TiDict getFocusEventObject(boolean hasFocus) {
		return null;
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

	public void release()
	{
		Log.i(LCAT, "Release: " + getClass().getSimpleName());
		View nv = getNativeView();
		if (nv != null) {
			if (nv instanceof ViewGroup) {
				ViewGroup vg = (ViewGroup) nv;
				Log.d(LCAT, "Group has: " + vg.getChildCount());
				vg.removeAllViews();
			}
		}
	}
	
	public void show()
	{
		nativeView.setVisibility(View.VISIBLE);
	}
	
	public void hide()
	{
		nativeView.setVisibility(View.INVISIBLE);
	}
}
