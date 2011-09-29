/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.view;


import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollPropertyChange;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.KrollProxyListener;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiAnimationBuilder;
import org.appcelerator.titanium.util.TiAnimationBuilder.TiMatrixAnimation;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutParams;

import android.content.Context;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.view.GestureDetector;
import android.view.GestureDetector.SimpleOnGestureListener;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.View.OnFocusChangeListener;
import android.view.View.OnKeyListener;
import android.view.View.OnLongClickListener;
import android.view.View.OnTouchListener;
import android.view.ViewGroup;
import android.view.animation.Animation;
import android.view.animation.AnimationSet;
import android.view.inputmethod.InputMethodManager;
import android.widget.AdapterView;

public abstract class TiUIView
	implements KrollProxyListener, OnFocusChangeListener
{
	private static final String LCAT = "TiUIView";
	private static final boolean DBG = TiConfig.LOGD;

	private static AtomicInteger idGenerator;

	public static final int SOFT_KEYBOARD_DEFAULT_ON_FOCUS = 0;
	public static final int SOFT_KEYBOARD_HIDE_ON_FOCUS = 1;
	public static final int SOFT_KEYBOARD_SHOW_ON_FOCUS = 2;

	protected View nativeView; // Native View object

	protected TiViewProxy proxy;
	protected TiViewProxy parent;
	protected ArrayList<TiUIView> children = new ArrayList<TiUIView>();

	protected LayoutParams layoutParams;
	protected int zIndex;
	protected TiAnimationBuilder animBuilder;
	protected TiBackgroundDrawable background;

	private KrollDict lastUpEvent = new KrollDict(2);
	// In the case of heavy-weight windows, the "nativeView" is null,
	// so this holds a reference to the view which is used for touching,
	// i.e., the view passed to registerForTouch.
	private WeakReference<View> mTouchView = null;

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
					children.add(child);
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
					children.remove(child);
				}
			}
		}
	}

	public List<TiUIView> getChildren()
	{
		return children;
	}

	public TiViewProxy getProxy()
	{
		return proxy;
	}

	public void setProxy(TiViewProxy proxy)
	{
		this.proxy = proxy;
	}

	public TiViewProxy getParent()
	{
		return parent;
	}

	public void setParent(TiViewProxy parent)
	{
		this.parent = parent;
	}

	public LayoutParams getLayoutParams()
	{
		return layoutParams;
	}

	public int getZIndex()
	{
		return zIndex;
	}

	public View getNativeView()
	{
		return nativeView;
	}

	protected void setNativeView(View view)
	{
		if (view.getId() == View.NO_ID) {
			view.setId(idGenerator.incrementAndGet());
		}
		this.nativeView = view;
		boolean clickable = true;
		// TODO hack
		KrollDict d = proxy.getCreationDict();
		if (d.containsKey(TiC.PROPERTY_TOUCH_ENABLED)) {
			clickable = TiConvert.toBoolean(d, TiC.PROPERTY_TOUCH_ENABLED);
		}
		doSetClickable(nativeView, clickable);
		nativeView.setOnFocusChangeListener(this);
	}

	protected void setLayoutParams(LayoutParams layoutParams)
	{
		this.layoutParams = layoutParams;
	}

	protected void setZIndex(int index)
	{
		zIndex = index;
	}

	public void animate()
	{
		TiAnimationBuilder builder = proxy.getPendingAnimation();
		if (builder != null && nativeView != null) {
			AnimationSet as = builder.render(proxy, nativeView);
			if (DBG) {
				Log.d(LCAT, "starting animation: "+as);
			}
			nativeView.startAnimation(as);
			// Clean up proxy
			proxy.clearAnimation();
		}
	}

	public void listenerAdded(String type, int count, KrollProxy proxy) {
	}

	public void listenerRemoved(String type, int count, KrollProxy proxy){
	}

	private boolean hasImage(KrollDict d)
	{
		return d.containsKeyAndNotNull(TiC.PROPERTY_BACKGROUND_IMAGE)
			|| d.containsKeyAndNotNull(TiC.PROPERTY_BACKGROUND_SELECTED_IMAGE) 
			|| d.containsKeyAndNotNull(TiC.PROPERTY_BACKGROUND_FOCUSED_IMAGE)
			|| d.containsKeyAndNotNull(TiC.PROPERTY_BACKGROUND_DISABLED_IMAGE);
	}

	private boolean hasBorder(KrollDict d)
	{
		return d.containsKeyAndNotNull(TiC.PROPERTY_BORDER_COLOR) 
			|| d.containsKeyAndNotNull(TiC.PROPERTY_BORDER_RADIUS)
			|| d.containsKeyAndNotNull(TiC.PROPERTY_BORDER_WIDTH);
	}

	private boolean hasColorState(KrollDict d)
	{
		return d.containsKeyAndNotNull(TiC.PROPERTY_BACKGROUND_SELECTED_COLOR)
			|| d.containsKeyAndNotNull(TiC.PROPERTY_BACKGROUND_FOCUSED_COLOR)
			|| d.containsKeyAndNotNull(TiC.PROPERTY_BACKGROUND_FOCUSED_COLOR);
	}

	protected void applyTransform(Ti2DMatrix matrix)
	{
		layoutParams.optionTransform = matrix;
		if (animBuilder == null) {
			animBuilder = new TiAnimationBuilder();
		}
		if (nativeView != null) {
			if (matrix != null) {
				TiMatrixAnimation matrixAnimation = animBuilder.createMatrixAnimation(matrix);
				matrixAnimation.interpolate = false;
				matrixAnimation.setDuration(1);
				matrixAnimation.setFillAfter(true);
				nativeView.startAnimation(matrixAnimation);
			} else {
				nativeView.clearAnimation();
			}
		}
	}

	protected void layoutNativeView()
	{
		if (nativeView != null) {
			Animation a = nativeView.getAnimation();
			if (a != null && a instanceof TiMatrixAnimation) {
				TiMatrixAnimation matrixAnimation = (TiMatrixAnimation) a;
				matrixAnimation.invalidateWithMatrix(nativeView);
			}
			nativeView.requestLayout();
		}
	}

	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (key.equals(TiC.PROPERTY_LEFT)) {
			if (newValue != null) {
				layoutParams.optionLeft = TiConvert.toTiDimension(TiConvert.toString(newValue), TiDimension.TYPE_LEFT);
			} else {
				layoutParams.optionLeft = null;
			}
			layoutNativeView();
		} else if (key.equals(TiC.PROPERTY_TOP)) {
			if (newValue != null) {
				layoutParams.optionTop = TiConvert.toTiDimension(TiConvert.toString(newValue), TiDimension.TYPE_TOP);
			} else {
				layoutParams.optionTop = null;
			}
			layoutNativeView();
		} else if (key.equals(TiC.PROPERTY_CENTER)) {
			TiConvert.updateLayoutCenter(newValue, layoutParams);
			layoutNativeView();
		} else if (key.equals(TiC.PROPERTY_RIGHT)) {
			if (newValue != null) {
				layoutParams.optionRight = TiConvert.toTiDimension(TiConvert.toString(newValue), TiDimension.TYPE_RIGHT);
			} else {
				layoutParams.optionRight = null;
			}
			layoutNativeView();
		} else if (key.equals(TiC.PROPERTY_BOTTOM)) {
			if (newValue != null) {
				layoutParams.optionBottom = TiConvert.toTiDimension(TiConvert.toString(newValue), TiDimension.TYPE_BOTTOM);
			} else {
				layoutParams.optionBottom = null;
			}
			layoutNativeView();
		} else if (key.equals(TiC.PROPERTY_SIZE)) {
			if (newValue instanceof KrollDict) {
				KrollDict d = (KrollDict)newValue;
				propertyChanged(TiC.PROPERTY_WIDTH, oldValue, d.get(TiC.PROPERTY_WIDTH), proxy);
				propertyChanged(TiC.PROPERTY_HEIGHT, oldValue, d.get(TiC.PROPERTY_HEIGHT), proxy);
			}else if (newValue != null){
				Log.w(LCAT, "Unsupported property type ("+(newValue.getClass().getSimpleName())+") for key: " + key+". Must be an object/dictionary");
			}
		} else if (key.equals(TiC.PROPERTY_HEIGHT)) {
			if (newValue != null) {
				if (!newValue.equals(TiC.SIZE_AUTO)) {
					layoutParams.optionHeight = TiConvert.toTiDimension(TiConvert.toString(newValue), TiDimension.TYPE_HEIGHT);
					layoutParams.autoHeight = false;
				} else {
					layoutParams.optionHeight = null;
					layoutParams.autoHeight = true;
				}
			} else {
				layoutParams.optionHeight = null;
			}
			layoutNativeView();
		} else if (key.equals(TiC.PROPERTY_WIDTH)) {
			if (newValue != null) {
				if (!newValue.equals(TiC.SIZE_AUTO)) {
					layoutParams.optionWidth = TiConvert.toTiDimension(TiConvert.toString(newValue), TiDimension.TYPE_WIDTH);
					layoutParams.autoWidth = false;
				} else {
					layoutParams.optionWidth = null;
					layoutParams.autoWidth = true;
				}
			} else {
				layoutParams.optionWidth = null;
			}
			layoutNativeView();
		} else if (key.equals(TiC.PROPERTY_ZINDEX)) {
			if (newValue != null) {
				layoutParams.optionZIndex = TiConvert.toInt(TiConvert.toString(newValue));
			} else {
				layoutParams.optionZIndex = 0;
			}
			layoutNativeView();
		} else if (key.equals(TiC.PROPERTY_FOCUSABLE)) {
			boolean focusable = TiConvert.toBoolean(proxy.get(TiC.PROPERTY_FOCUSABLE));
			nativeView.setFocusable(focusable);
			if (focusable) {
				registerForKeyClick(nativeView);
			} else {
				//nativeView.setOnClickListener(null); // ? mistake? I assume OnKeyListener was meant
				nativeView.setOnKeyListener(null);
			}
		} else if (key.equals(TiC.PROPERTY_TOUCH_ENABLED)) {
			doSetClickable(TiConvert.toBoolean(newValue));
		} else if (key.equals(TiC.PROPERTY_VISIBLE)) {
			nativeView.setVisibility(TiConvert.toBoolean(newValue) ? View.VISIBLE : View.INVISIBLE);
		} else if (key.equals(TiC.PROPERTY_ENABLED)) {
			nativeView.setEnabled(TiConvert.toBoolean(newValue));
		} else if (key.startsWith(TiC.PROPERTY_BACKGROUND_PADDING)) {
			Log.i(LCAT, key + " not yet implemented.");
		} else if (key.equals(TiC.PROPERTY_OPACITY)
			|| key.startsWith(TiC.PROPERTY_BACKGROUND_PREFIX)
			|| key.startsWith(TiC.PROPERTY_BORDER_PREFIX)) {
			// Update first before querying.
			proxy.set(key, newValue);

			/*TODO KrollDict d = proxy.getProperties();

			boolean hasImage = hasImage(d);
			boolean hasColorState = hasColorState(d);
			boolean hasBorder = hasBorder(d);

			boolean requiresCustomBackground = hasImage || hasColorState || hasBorder;

			if (!requiresCustomBackground) {
				if (background != null) {
					background.releaseDelegate();
					background.setCallback(null);
					background = null;
				}

				if (d.containsKeyAndNotNull(TiC.PROPERTY_BACKGROUND_COLOR)) {
					Integer bgColor = TiConvert.toColor(d, TiC.PROPERTY_BACKGROUND_COLOR);
					if (nativeView != null){
						nativeView.setBackgroundColor(bgColor);
						nativeView.postInvalidate();
					}
				} else {
					if (key.equals(TiC.PROPERTY_OPACITY)) {
						setOpacity(TiConvert.toFloat(newValue));
					}
					if (nativeView != null) {
						nativeView.setBackgroundDrawable(null);
						nativeView.postInvalidate();
					}
				}
			} else {
				boolean newBackground = background == null;
				if (newBackground) {
					background = new TiBackgroundDrawable();
				}

				Integer bgColor = null;

				if (!hasColorState) {
					if (d.get(TiC.PROPERTY_BACKGROUND_COLOR) != null) {
						bgColor = TiConvert.toColor(d, TiC.PROPERTY_BACKGROUND_COLOR);
						if (newBackground
							|| (key.equals(TiC.PROPERTY_OPACITY)
							|| key.equals(TiC.PROPERTY_BACKGROUND_COLOR)))
						{
							background.setBackgroundColor(bgColor);
						}
					}
				}

				if (hasImage || hasColorState) {
					if (newBackground || key.startsWith(TiC.PROPERTY_BACKGROUND_PREFIX)) {
						handleBackgroundImage(d);
					}
				}

				if (hasBorder) {
					if (newBackground) {
						initializeBorder(d, bgColor);
					} else if (key.startsWith(TiC.PROPERTY_BORDER_PREFIX)) {
						handleBorderProperty(key, newValue);
					}
				}
				applyCustomBackground();
			}
			if (nativeView != null) {
				nativeView.postInvalidate();
			}*/
		} else if (key.equals(TiC.PROPERTY_SOFT_KEYBOARD_ON_FOCUS)) {
			Log.w(LCAT, "Focus state changed to " + TiConvert.toString(newValue) + " not honored until next focus event.");
		} else if (key.equals(TiC.PROPERTY_TRANSFORM)) {
			if (nativeView != null) {
				applyTransform((Ti2DMatrix)newValue);
			}
		} else if (key.equals(TiC.PROPERTY_KEEP_SCREEN_ON)) {
			if (nativeView != null) {
				nativeView.setKeepScreenOn(TiConvert.toBoolean(newValue));
			}
		} else {
			TiViewProxy viewProxy = getProxy();
			if (viewProxy != null && viewProxy.isLocalizedTextId(key)) {
				viewProxy.setLocalizedText(key, TiConvert.toString(newValue));
			} else {
				if (DBG) {
					Log.d(LCAT, "Unhandled property key: " + key);
				}
			}
		}
	}

	public void processProperties(KrollDict d)
	{
		if (d.containsKey(TiC.PROPERTY_LAYOUT)) {
			String layout = TiConvert.toString(d, TiC.PROPERTY_LAYOUT);
			if (nativeView instanceof TiCompositeLayout) {
				((TiCompositeLayout)nativeView).setLayoutArrangement(layout);
			}
		}
		if (TiConvert.fillLayout(d, layoutParams)) {
			if (nativeView != null) {
				nativeView.requestLayout();
			}
		}

		Integer bgColor = null;

		// Default background processing.
		// Prefer image to color.
		if (hasImage(d) || hasColorState(d) || hasBorder(d)) {
			handleBackgroundImage(d);
		} else if (d.containsKey(TiC.PROPERTY_BACKGROUND_COLOR)) {
			bgColor = TiConvert.toColor(d, TiC.PROPERTY_BACKGROUND_COLOR);
			nativeView.setBackgroundColor(bgColor);
		}
		if (d.containsKey(TiC.PROPERTY_OPACITY)) {
			if (nativeView != null) {
				setOpacity(TiConvert.toFloat(d, TiC.PROPERTY_OPACITY));
			}
		}
		
		if (d.containsKey(TiC.PROPERTY_VISIBLE)) {
			nativeView.setVisibility(TiConvert.toBoolean(d, TiC.PROPERTY_VISIBLE) ? View.VISIBLE : View.INVISIBLE);
		}
		if (d.containsKey(TiC.PROPERTY_ENABLED)) {
			nativeView.setEnabled(TiConvert.toBoolean(d, TiC.PROPERTY_ENABLED));
		}

		if (d.containsKey(TiC.PROPERTY_FOCUSABLE)) {
			boolean focusable = TiConvert.toBoolean(d, TiC.PROPERTY_FOCUSABLE);
			nativeView.setFocusable(focusable);
			if (focusable) {
				registerForKeyClick(nativeView);
			} else {
				//nativeView.setOnClickListener(null); // ? mistake? I assume OnKeyListener was meant
				nativeView.setOnKeyListener(null);
			}
		}

		initializeBorder(d, bgColor);

		if (d.containsKey(TiC.PROPERTY_TRANSFORM)) {
			Ti2DMatrix matrix = (Ti2DMatrix) d.get(TiC.PROPERTY_TRANSFORM);
			if (matrix != null) {
				applyTransform(matrix);
			}
		}
		
		if (d.containsKey(TiC.PROPERTY_KEEP_SCREEN_ON)) {
			nativeView.setKeepScreenOn(TiConvert.toBoolean(d, TiC.PROPERTY_KEEP_SCREEN_ON));
		}
	}

	// TODO @Override
	public void propertiesChanged(List<KrollPropertyChange> changes, KrollProxy proxy)
	{
		for (KrollPropertyChange change : changes) {
			propertyChanged(change.getName(), change.getOldValue(), change.getNewValue(), proxy);
		}
	}
	
	private void applyCustomBackground()
	{
		applyCustomBackground(true);
	}

	private void applyCustomBackground(boolean reuseCurrentDrawable)
	{
		if (nativeView != null) {
			if (background == null) {
				background = new TiBackgroundDrawable();
	
				Drawable currentDrawable = nativeView.getBackground();
				if (currentDrawable != null) {
					if (reuseCurrentDrawable) {
						background.setBackgroundDrawable(currentDrawable);
					} else {
						nativeView.setBackgroundDrawable(null);
						currentDrawable.setCallback(null);
						if (currentDrawable instanceof TiBackgroundDrawable) {
							((TiBackgroundDrawable) currentDrawable).releaseDelegate();
						}
					}
				}
			}
			nativeView.setBackgroundDrawable(background);
		}
	}

	public void onFocusChange(View v, boolean hasFocus)
	{
		if (hasFocus) {
			TiUIHelper.requestSoftInputChange(proxy, v);
			proxy.fireEvent(TiC.EVENT_FOCUS, getFocusEventObject(hasFocus));
		} else {
			proxy.fireEvent(TiC.EVENT_BLUR, getFocusEventObject(hasFocus));
		}
	}

	protected KrollDict getFocusEventObject(boolean hasFocus)
	{
		return null;
	}

	protected InputMethodManager getIMM()
	{
		InputMethodManager imm = null;
		imm = (InputMethodManager) TiApplication.getInstance().getSystemService(Context.INPUT_METHOD_SERVICE);
		return imm;
	}

	public void focus()
	{
		if (nativeView != null) {
			nativeView.requestFocus();
		}
	}

	public void blur()
	{
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
		if (DBG) {
			Log.d(LCAT, "Releasing: " + this);
		}
		View nv = getNativeView();
		if (nv != null) {
			if (nv instanceof ViewGroup) {
				ViewGroup vg = (ViewGroup) nv;
				if (DBG) {
					Log.d(LCAT, "Group has: " + vg.getChildCount());
				}
				if (!(vg instanceof AdapterView<?>)) {
					vg.removeAllViews();
				}
			}
			Drawable d = nv.getBackground();
			if (d != null) {
				nv.setBackgroundDrawable(null);
				d.setCallback(null);
				if (d instanceof TiBackgroundDrawable) {
					((TiBackgroundDrawable)d).releaseDelegate();
				}
				d = null;
			}
			nativeView = null;
			if (proxy != null) {
				proxy.setModelListener(null);
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

	private void handleBackgroundImage(KrollDict d)
	{
		String bg = d.getString(TiC.PROPERTY_BACKGROUND_IMAGE);
		String bgSelected = d.getString(TiC.PROPERTY_BACKGROUND_SELECTED_IMAGE);
		String bgFocused = d.getString(TiC.PROPERTY_BACKGROUND_FOCUSED_IMAGE);
		String bgDisabled = d.getString(TiC.PROPERTY_BACKGROUND_DISABLED_IMAGE);
		
		String bgColor = d.getString(TiC.PROPERTY_BACKGROUND_COLOR);
		String bgSelectedColor = d.getString(TiC.PROPERTY_BACKGROUND_SELECTED_COLOR);
		String bgFocusedColor = d.getString(TiC.PROPERTY_BACKGROUND_FOCUSED_COLOR);
		String bgDisabledColor = d.getString(TiC.PROPERTY_BACKGROUND_DISABLED_COLOR);

		if (bg != null) {
			bg = proxy.resolveUrl(null, bg);
		}
		if (bgSelected != null) {
			bgSelected = proxy.resolveUrl(null, bgSelected);
		}
		if (bgFocused != null) {
			bgFocused = proxy.resolveUrl(null, bgFocused);
		}
		if (bgDisabled != null) {
			bgDisabled = proxy.resolveUrl(null, bgDisabled);
		}

		if (bg != null || bgSelected != null || bgFocused != null || bgDisabled != null ||
				bgColor != null || bgSelectedColor != null || bgFocusedColor != null || bgDisabledColor != null) 
		{
			if (background == null) {
				applyCustomBackground(false);
			}

			Drawable bgDrawable = TiUIHelper.buildBackgroundDrawable(bg, bgColor, bgSelected, bgSelectedColor, bgDisabled, bgDisabledColor, bgFocused, bgFocusedColor);
			background.setBackgroundDrawable(bgDrawable);
		}
	}

	private void initializeBorder(KrollDict d, Integer bgColor)
	{
		if (d.containsKey(TiC.PROPERTY_BORDER_RADIUS)
			|| d.containsKey(TiC.PROPERTY_BORDER_COLOR)
			|| d.containsKey(TiC.PROPERTY_BORDER_WIDTH)) {

			if(nativeView != null) {
				if (background == null) {
					applyCustomBackground();
				}

				if (background.getBorder() == null) {
					background.setBorder(new TiBackgroundDrawable.Border());
				}

				TiBackgroundDrawable.Border border = background.getBorder();

				if (d.containsKey(TiC.PROPERTY_BORDER_RADIUS)) {
					border.setRadius(TiConvert.toFloat(d, TiC.PROPERTY_BORDER_RADIUS));
				}
				if (d.containsKey(TiC.PROPERTY_BORDER_COLOR) || d.containsKey(TiC.PROPERTY_BORDER_WIDTH)) {
					if (d.containsKey(TiC.PROPERTY_BORDER_COLOR)) {
						border.setColor(TiConvert.toColor(d, TiC.PROPERTY_BORDER_COLOR));
					} else {
						if (bgColor != null) {
							border.setColor(bgColor);
						}
					}
					if (d.containsKey(TiC.PROPERTY_BORDER_WIDTH)) {
						border.setWidth(TiConvert.toFloat(d, TiC.PROPERTY_BORDER_WIDTH));
					}
				}
				//applyCustomBackground();
			}
		}
	}

	private void handleBorderProperty(String property, Object value)
	{
		if (background.getBorder() == null) {
			background.setBorder(new TiBackgroundDrawable.Border());
		}
		TiBackgroundDrawable.Border border = background.getBorder();

		if (property.equals(TiC.PROPERTY_BORDER_COLOR)) {
			border.setColor(TiConvert.toColor(value.toString()));
		} else if (property.equals(TiC.PROPERTY_BORDER_RADIUS)) {
			border.setRadius(TiConvert.toFloat(value));
		} else if (property.equals(TiC.PROPERTY_BORDER_WIDTH)) {
			border.setWidth(TiConvert.toFloat(value));
		}
		applyCustomBackground();
	}

	private static HashMap<Integer, String> motionEvents = new HashMap<Integer,String>();
	static
	{
		motionEvents.put(MotionEvent.ACTION_DOWN, TiC.EVENT_TOUCH_START);
		motionEvents.put(MotionEvent.ACTION_UP, TiC.EVENT_TOUCH_END);
		motionEvents.put(MotionEvent.ACTION_MOVE, TiC.EVENT_TOUCH_MOVE);
		motionEvents.put(MotionEvent.ACTION_CANCEL, TiC.EVENT_TOUCH_CANCEL);
	}

	private KrollDict dictFromEvent(MotionEvent e)
	{
		KrollDict data = new KrollDict();
		data.put(TiC.EVENT_PROPERTY_X, (double)e.getX());
		data.put(TiC.EVENT_PROPERTY_Y, (double)e.getY());
		data.put(TiC.EVENT_PROPERTY_SOURCE, proxy);
		return data;
	}

	private KrollDict dictFromEvent(KrollDict dictToCopy){
		KrollDict data = new KrollDict();
		if (dictToCopy.containsKey(TiC.EVENT_PROPERTY_X)){
			data.put(TiC.EVENT_PROPERTY_X, dictToCopy.get(TiC.EVENT_PROPERTY_X));
		} else {
			data.put(TiC.EVENT_PROPERTY_X, (double)0);
		}
		if (dictToCopy.containsKey(TiC.EVENT_PROPERTY_Y)){
			data.put(TiC.EVENT_PROPERTY_Y, dictToCopy.get(TiC.EVENT_PROPERTY_Y));
		} else {
			data.put(TiC.EVENT_PROPERTY_Y, (double)0);
		}
		data.put(TiC.EVENT_PROPERTY_SOURCE, proxy);
		return data;
	}

	protected boolean allowRegisterForTouch()
	{
		return true;
	}

	public void registerForTouch()
	{
		if (allowRegisterForTouch()) {
			registerForTouch(getNativeView());
		}
	}

	protected void registerForTouch(final View touchable)
	{
		if (touchable == null) {
			return;
		}
		mTouchView = new WeakReference<View>(touchable);
		final GestureDetector detector = new GestureDetector(touchable.getContext(),
			new SimpleOnGestureListener() {
				@Override
				public boolean onDoubleTap(MotionEvent e) {
					boolean handledTap = proxy.fireEvent(TiC.EVENT_DOUBLE_TAP, dictFromEvent(e));
					boolean handledClick = proxy.fireEvent(TiC.EVENT_DOUBLE_CLICK, dictFromEvent(e));
					return handledTap || handledClick;
				}
				@Override
				public boolean onSingleTapConfirmed(MotionEvent e) {
					if (DBG) { Log.d(LCAT, "TAP, TAP, TAP on " + proxy); }
					boolean handledTap = proxy.fireEvent(TiC.EVENT_SINGLE_TAP, dictFromEvent(e));
					// Moved click handling to the onTouch listener, because a single tap is not the
					// same as a click.  A single tap is a quick tap only, whereas clicks can be held
					// before lifting.
					// boolean handledClick = proxy.fireEvent(TiC.EVENT_CLICK, dictFromEvent(event));
					// Note: this return value is irrelevant in our case.  We "want" to use it
					// in onTouch below, when we call detector.onTouchEvent(event);  But, in fact,
					// onSingleTapConfirmed is *not* called in the course of onTouchEvent.  It's
					// called via Handler in GestureDetector. <-- See its Java source.
					return handledTap;// || handledClick;
				}
				@Override
				public void onLongPress(MotionEvent e)
				{
					if (DBG){
						Log.d(LCAT, "LONGPRESS on " + proxy);
					}
					proxy.fireEvent(TiC.EVENT_LONGPRESS, dictFromEvent(e));
				}
			});
		touchable.setOnTouchListener(new OnTouchListener() {
			public boolean onTouch(View view, MotionEvent event) {
				if (event.getAction() == MotionEvent.ACTION_UP) {
					lastUpEvent.put(TiC.EVENT_PROPERTY_X, (double)event.getX());
					lastUpEvent.put(TiC.EVENT_PROPERTY_Y, (double)event.getY());
				}
				boolean handled = detector.onTouchEvent(event);
				if (!handled && motionEvents.containsKey(event.getAction())) {
					if (event.getAction() == MotionEvent.ACTION_UP) {
						Rect r = new Rect(0, 0, view.getWidth(), view.getHeight());
						int actualAction = r.contains((int)event.getX(), (int)event.getY())
							? MotionEvent.ACTION_UP : MotionEvent.ACTION_CANCEL;
						handled = proxy.fireEvent(motionEvents.get(actualAction), dictFromEvent(event));
						if (handled && actualAction == MotionEvent.ACTION_UP) {
							// If this listener returns true, a click event does not occur,
							// because part of the Android View's default ACTION_UP handling
							// is to call performClick() which leads to invoking the click
							// listener.  If we return true, that won't run, so we're doing it
							// here instead.
							touchable.performClick();
						}
						return handled;
					} else {
						handled = proxy.fireEvent(motionEvents.get(event.getAction()), dictFromEvent(event));
					}
				}
				return handled;
			}
		});
		// Previously, we used the single tap handling above to fire our click event.  It doesn't
		// work: a single tap is not the same as a click.  A click can be held for a while before
		// lifting the finger; a single-tap is only generated from a quick tap (which will also cause
		// a click.)  We wanted to do it in single-tap handling presumably because the singletap
		// listener gets a MotionEvent, which gives us the information we want to provide to our
		// users in our click event, whereas Android's standard OnClickListener does _not_ contain
		// that info.  However, an "up" seems to always occur before the click listener gets invoked,
		// so we store the last up event's x,y coordinates (see onTouch above) and use them here.
		// Note: AdapterView throws an exception if you try to put a click listener on it.
		doSetClickable(touchable);
	}

	public void setOpacity(float opacity)
	{
		setOpacity(nativeView, opacity);
	}

	protected void setOpacity(View view, float opacity)
	{
		if (view != null) {
			TiUIHelper.setDrawableOpacity(view.getBackground(), opacity);
			if (opacity == 1) {
				clearOpacity(view);
			}
			view.invalidate();
		}
	}

	public void clearOpacity(View view)
	{
		Drawable d = view.getBackground();
		if (d != null) {
			d.clearColorFilter();
		}
	}

	protected void registerForKeyClick(View clickable) 
	{
		clickable.setOnKeyListener(new OnKeyListener() {
			
			// TODO @Override
			public boolean onKey(View view, int keyCode, KeyEvent event) 
			{
				if (event.getAction() == KeyEvent.ACTION_UP) {
					switch(keyCode) {
					case KeyEvent.KEYCODE_ENTER :
					case KeyEvent.KEYCODE_DPAD_CENTER :
						if (proxy.hasListeners(TiC.EVENT_CLICK)) {
							proxy.fireEvent(TiC.EVENT_CLICK, null);
							return true;
						}
					}
				}
				return false;
			}
		});
	}

	public KrollDict toImage()
	{
		return null;
		//return TiUIHelper.viewToImage(proxy.getTiContext(), proxy.getProperties(), getNativeView());
	}

	private View getTouchView()
	{
		if (nativeView != null) {
			return nativeView;
		} else {
			if (mTouchView != null) {
				return mTouchView.get();
			}
		}
		return null;
	}
	private void doSetClickable(View view, boolean clickable)
	{
		if (view == null) {
			return;
		}
		if (!clickable) {
			view.setOnClickListener(null); // This will set clickable to true in the view, so make sure it stays here so the next line turns it off.
			view.setClickable(false);
			view.setOnLongClickListener(null);
			view.setLongClickable(false);
		} else if ( ! (view instanceof AdapterView) ){
			// n.b.: AdapterView throws if click listener set.
			// n.b.: setting onclicklistener automatically sets clickable to true.
			setOnClickListener(view);
			setOnLongClickListener(view);
		}
	}
	private void doSetClickable(boolean clickable)
	{
		doSetClickable(getTouchView(), clickable);
	}
	/*
	 * Used just to setup the click listener if applicable.
	 */
	private void doSetClickable(View view)
	{
		if (view == null) {
			return;
		}
		doSetClickable(view, view.isClickable());
	}
	/*
	 * Used just to setup the click listener if applicable.
	 */
	private void doSetClickable()
	{
		View view = getTouchView();
		if (view == null) {
			return;
		}
		doSetClickable(view, view.isClickable());
	}

	/**
	 * Can be overriden by inheriting views for special click handling.  For example,
	 * the Facebook module's login button view needs special click handling.
	 */
	protected void setOnClickListener(View view)
	{
		view.setOnClickListener(new OnClickListener()
		{
			// TODO @Override
			public void onClick(View view)
			{
				proxy.fireEvent(TiC.EVENT_CLICK, dictFromEvent(lastUpEvent));
			}
		});
	}
	protected void setOnLongClickListener(View view)
	{
		view.setOnLongClickListener(new OnLongClickListener()
		{
			// TODO @Override
			public boolean onLongClick(View view)
			{
				/*TODO return */proxy.fireEvent(TiC.EVENT_LONGCLICK, null);
				return true;
			}
		});
	}
}
