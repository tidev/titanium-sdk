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
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.proxy.TiViewProxy.PendingAnimation;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiBorderHelper.BorderSupport;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutParams;

import android.content.Context;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.view.View;
import android.view.ViewGroup;
import android.view.View.OnClickListener;
import android.view.View.OnFocusChangeListener;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.view.animation.AnimationSet;
import android.view.animation.RotateAnimation;
import android.view.animation.ScaleAnimation;
import android.view.animation.TranslateAnimation;
import android.view.inputmethod.InputMethodManager;

public abstract class TiUIView
	implements TiProxyListener, OnFocusChangeListener, OnClickListener
{
	private static final String LCAT = "TiUIView";
	private static final boolean DBG = TiConfig.LOGD;

	private static AtomicInteger idGenerator;

	protected View nativeView; // Native View object

	protected TiViewProxy proxy;
	protected TiViewProxy parent;

	protected LayoutParams layoutParams;
	protected int zIndex;

	public TiUIView(TiViewProxy proxy)
	{
		if (idGenerator == null) {
			idGenerator = new AtomicInteger(0);
		}

		this.proxy = proxy;
		this.layoutParams = new TiCompositeLayout.LayoutParams();
	}

	public void add(TiUIView child)
	{
		if (child != null) {
			View cv = child.getNativeView();
			if (cv != null) {
				View nv = getNativeView();
				if (nv instanceof ViewGroup) {
					if (cv.getParent() == null) {
						((ViewGroup) nv).addView(cv, child.getLayoutParams());
					}
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
	public LayoutParams getLayoutParams() {
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
	protected void setLayoutParams(LayoutParams layoutParams) {
		this.layoutParams = layoutParams;
	}
	protected void setZIndex(int index) {
		zIndex = index;
	}

	public void animate()
	{
		PendingAnimation pa = proxy.getPendingAnimation();
		if (pa != null && pa.options != null && nativeView != null) {

			// Default anchor point
			double anchorX = 0.5;
			double anchorY = 0.5;

			// Capture dimension
			int w = nativeView.getMeasuredWidth();
			int h = nativeView.getMeasuredHeight();

			TiDict props = proxy.getDynamicProperties();
			if (props.containsKey("anchorPoint")) {
				TiDict point = (TiDict) props.get("anchorPoint");
				anchorX = TiConvert.toDouble(point, "x");
				anchorY = TiConvert.toDouble(point, "y");
			}

			// Calculate anchor coordinate

			float anchorPointX = (float)((w * anchorX));
			float anchorPointY = (float)((h * anchorY));

			Ti2DMatrix tdm = null;
			Double delay = null;
			Double duration = null;
			Double toOpacity = null;
			Double fromOpacity = null;

			if (pa.options.containsKey("transform")) {
				tdm = (Ti2DMatrix) pa.options.get("transform");
			}
			if (pa.options.containsKey("delay")) {
				delay = TiConvert.toDouble(pa.options, "delay");
			}
			if (pa.options.containsKey("duration")) {
				duration = TiConvert.toDouble(pa.options, "duration");
			}
			if (pa.options.containsKey("opacity")) {
				toOpacity = TiConvert.toDouble(pa.options, "opacity");
				fromOpacity = 1.0 - toOpacity;
			}

			AnimationSet as = new AnimationSet(false);
			if (toOpacity != null) {
				Animation a = new AlphaAnimation(fromOpacity.floatValue(), toOpacity.floatValue());
				as.addAnimation(a);
			}

			if (tdm != null) {
				as.setFillAfter(true);
				if (tdm.hasRotation()) {
					Animation a = new RotateAnimation(0,tdm.getRotation(), anchorPointX, anchorPointY);
					as.addAnimation(a);
				}
				if (tdm.hasScaleFactor()) {
					Animation a = new ScaleAnimation(1, tdm.getScaleFactor(), 1, tdm.getScaleFactor(), anchorPointX, anchorPointY);
					as.addAnimation(a);
				}
				if (tdm.hasTranslation()) {
					Animation a = new TranslateAnimation(
						0,
						anchorPointX + tdm.getXTranslation(),
						0,
						anchorPointY + tdm.getYTranslation()
						);
					as.addAnimation(a);
				}
			}

			// Set duration after adding children.
			if (duration != null) {
				as.setDuration(duration.longValue());
			}
			if (delay != null) {
				as.setStartTime(delay.longValue());
			}

			if (pa.callback != null) {
				final KrollCallback kb = pa.callback;
				as.setAnimationListener(new Animation.AnimationListener(){

					@Override
					public void onAnimationEnd(Animation a) {
						if (kb != null) {
							kb.call();
						}
					}

					@Override
					public void onAnimationRepeat(Animation a) {
					}

					@Override
					public void onAnimationStart(Animation a) {
					}

				});
			}

			//TODO launch
			nativeView.startAnimation(as);

			// Clean up proxy
			proxy.clearAnimation();
		}
	}

	public void listenerAdded(String type, int count, TiProxy proxy) {
	}

	public void listenerRemoved(String type, int count, TiProxy proxy) {
	}

	public void propertyChanged(String key, Object oldValue, Object newValue, TiProxy proxy)
	{
		if (key.equals("left")) {
			if (newValue != null) {
				layoutParams.optionLeft = TiConvert.toTiDimension(TiConvert.toString(newValue)).getIntValue();
			} else {
				layoutParams.optionLeft = TiCompositeLayout.NOT_SET;
			}
			if (nativeView != null) {
				nativeView.requestLayout();
			}
		} else if (key.equals("top")) {
			if (newValue != null) {
				layoutParams.optionTop = TiConvert.toTiDimension(TiConvert.toString(newValue)).getIntValue();
			} else {
				layoutParams.optionTop = TiCompositeLayout.NOT_SET;
			}
			if (nativeView != null) {
				nativeView.requestLayout();
			}
		} else if (key.equals("right")) {
			if (newValue != null) {
				layoutParams.optionRight = TiConvert.toTiDimension(TiConvert.toString(newValue)).getIntValue();
			} else {
				layoutParams.optionRight = TiCompositeLayout.NOT_SET;
			}
			if (nativeView != null) {
				nativeView.requestLayout();
			}
		} else if (key.equals("bottom")) {
			if (newValue != null) {
				layoutParams.optionBottom = TiConvert.toTiDimension(TiConvert.toString(newValue)).getIntValue();
			} else {
				layoutParams.optionBottom = TiCompositeLayout.NOT_SET;
			}
			if (nativeView != null) {
				nativeView.requestLayout();
			}
		} else if (key.equals("height")) {
			if (newValue != null) {
				if (!newValue.equals("auto")) {
					layoutParams.optionHeight = TiConvert.toTiDimension(TiConvert.toString(newValue)).getIntValue();
					layoutParams.autoHeight = false;
				} else {
					layoutParams.optionHeight = TiCompositeLayout.NOT_SET;
					layoutParams.autoHeight = true;
				}
			} else {
				layoutParams.optionHeight = TiCompositeLayout.NOT_SET;
			}
			if (nativeView != null) {
				nativeView.requestLayout();
			}
		} else if (key.equals("width")) {
			if (newValue != null) {
				if (!newValue.equals("auto")) {
					layoutParams.optionWidth = TiConvert.toTiDimension(TiConvert.toString(newValue)).getIntValue();
					layoutParams.autoWidth = false;
				} else {
					layoutParams.optionWidth = TiCompositeLayout.NOT_SET;
					layoutParams.autoWidth = true;
				}
			} else {
				layoutParams.optionWidth = TiCompositeLayout.NOT_SET;
			}
			if (nativeView != null) {
				nativeView.requestLayout();
			}
		} else if (key.equals("visible")) {
			nativeView.setVisibility(TiConvert.toBoolean(newValue) ? View.VISIBLE : View.INVISIBLE);
		} else if (key.equals("opacity") || key.equals("backgroundColor")) {
			TiDict d = proxy.getDynamicProperties();
			if (proxy.getDynamicValue("backgroundColor") != null) {
				Integer bgColor = TiConvert.toColor(d, "backgroundColor", "opacity");
				nativeView.setBackgroundDrawable(new ColorDrawable(bgColor));
			} else {
				Log.w(LCAT, "Unable to set opacity w/o background color");
			}
		} else if (key.equals("backgroundImage")) {
			handleBackgroundImage(proxy.getDynamicProperties());
		} else {
			Log.i(LCAT, "Unhandled property key: " + key);
		}
	}

	public void processProperties(TiDict d)
	{
		if (TiConvert.fillLayout(d, layoutParams)) {
			if (nativeView != null) {
				nativeView.requestLayout();
				nativeView.setOnClickListener(this);
			}
		}

		Integer bgColor = null;

		// Default background processing.
		// Prefer image to color.
		if (d.containsKey("backgroundImage")) {
			handleBackgroundImage(d);
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
		if (nativeView != null) {
			nativeView.setVisibility(View.VISIBLE);
		} else {
			if (DBG) {
				Log.w(LCAT, "Attempt to show null native control");
			}
		}
	}

	public void hide()
	{
		if (nativeView != null) {
			nativeView.setVisibility(View.INVISIBLE);
		} else {
			if (DBG) {
				Log.w(LCAT, "Attempt to hide null native control");
			}
		}
	}

	// Initial implementation.
	// TODO implement other background states.
	private void handleBackgroundImage(TiDict d)
	{
		String path = TiConvert.toString(d, "backgroundImage");
		String url = getProxy().getTiContext().resolveUrl(null, path);
		TiBaseFile file = TiFileFactory.createTitaniumFile(getProxy().getTiContext(), new String[] { url }, false);
		try {
			nativeView.setBackgroundDrawable(Drawable.createFromStream(
				file.getInputStream(), file.getNativeFile().getName()));
		} catch (IOException e) {
			Log.e(LCAT, "Error creating background image from path: " + path.toString(), e);
		}

	}

	@Override
	public void onClick(View view) {
		TiDict data = new TiDict();
		data.put("source", getProxy());

		getProxy().fireEvent("click", data);
	}

	public TiDict toImage() {
		return TiUIHelper.viewToImage(proxy.getTiContext(), getNativeView());
	}
}
