/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.view;

import java.lang.ref.WeakReference;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollPropertyChange;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.KrollProxyListener;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiAnimationBuilder;
import org.appcelerator.titanium.util.TiAnimationBuilder.TiMatrixAnimation;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutParams;
import org.appcelerator.titanium.view.TiGradientDrawable.GradientType;

import android.app.Activity;
import android.content.Context;
import android.graphics.Paint;
import android.graphics.Point;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.util.Pair;
import android.view.GestureDetector;
import android.view.GestureDetector.SimpleOnGestureListener;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.ScaleGestureDetector.SimpleOnScaleGestureListener;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.View.OnFocusChangeListener;
import android.view.View.OnKeyListener;
import android.view.View.OnLongClickListener;
import android.view.View.OnTouchListener;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.view.animation.Animation;
import android.view.animation.AnimationSet;
import android.view.inputmethod.InputMethodManager;
import android.widget.AdapterView;

/**
 * This class is for Titanium View implementations, that correspond with TiViewProxy. 
 * A TiUIView is responsible for creating and maintaining a native Android View instance.
 */
public abstract class TiUIView
	implements KrollProxyListener, OnFocusChangeListener
{
	private static final boolean HONEYCOMB_OR_GREATER = (Build.VERSION.SDK_INT >= 11);
	private static final int LAYER_TYPE_SOFTWARE = 1;
	private static final String TAG = "TiUIView";

	private static AtomicInteger idGenerator;

	public static final int SOFT_KEYBOARD_DEFAULT_ON_FOCUS = 0;
	public static final int SOFT_KEYBOARD_HIDE_ON_FOCUS = 1;
	public static final int SOFT_KEYBOARD_SHOW_ON_FOCUS = 2;

	protected View nativeView; // Native View object

	protected TiViewProxy proxy;
	protected TiViewProxy parent;
	protected ArrayList<TiUIView> children = new ArrayList<TiUIView>();

	protected LayoutParams layoutParams;
	protected TiAnimationBuilder animBuilder;
	protected TiBackgroundDrawable background;

	// Since Android doesn't have a property to check to indicate
	// the current animated x/y scale (from a scale animation), we track it here
	// so if another scale animation is done we can gleen the fromX and fromY values
	// rather than starting the next animation always from scale 1.0f (i.e., normal scale).
	// This gives us parity with iPhone for scale animations that use the 2-argument variant
	// of Ti2DMatrix.scale().
	private Pair<Float, Float> animatedScaleValues = Pair.create(Float.valueOf(1f), Float.valueOf(1f)); // default = full size (1f)

	// Same for rotation animation and for alpha animation.
	private float animatedRotationDegrees = 0f; // i.e., no rotation.
	private float animatedAlpha = Float.MIN_VALUE; // i.e., no animated alpha.

	private KrollDict lastUpEvent = new KrollDict(2);
	// In the case of heavy-weight windows, the "nativeView" is null,
	// so this holds a reference to the view which is used for touching,
	// i.e., the view passed to registerForTouch.
	private WeakReference<View> touchView = null;

	private Method mSetLayerTypeMethod = null; // Honeycomb, for turning off hw acceleration.

	private boolean zIndexChanged = false;
	private TiBorderWrapperView borderView;

	/**
	 * Constructs a TiUIView object with the associated proxy.
	 * @param proxy the associated proxy.
	 * @module.api
	 */
	public TiUIView(TiViewProxy proxy)
	{
		if (idGenerator == null) {
			idGenerator = new AtomicInteger(0);
		}

		this.proxy = proxy;
		this.layoutParams = new TiCompositeLayout.LayoutParams();
	}

	/**
	 * Adds a child view into the ViewGroup.
	 * @param child the view to be added.
	 */
	public void add(TiUIView child)
	{
		if (child != null) {
			View cv = child.getOuterView();
			if (cv != null) {
				View nv = getNativeView();
				if (nv instanceof ViewGroup) {
					if (cv.getParent() == null) {
						((ViewGroup) nv).addView(cv, child.getLayoutParams());
					}
					children.add(child);
					child.parent = proxy;
				}
			}
		}
	}

	/**
	 * Removes the child view from the ViewGroup, if child exists.
	 * @param child the view to be removed.
	 */
	public void remove(TiUIView child)
	{
		if (child != null) {
			View cv = child.getOuterView();
			if (cv != null) {
				View nv = getNativeView();
				if (nv instanceof ViewGroup) {
					((ViewGroup) nv).removeView(cv);
					children.remove(child);
					child.parent = null;
				}
			}
		}
	}

	/**
	 * @return list of views added.
	 */
	public List<TiUIView> getChildren()
	{
		return children;
	}

	/**
	 * @return the view proxy.
	 * @module.api
	 */
	public TiViewProxy getProxy()
	{
		return proxy;
	}

	/**
	 * Sets the view proxy.
	 * @param proxy the proxy to set.
	 * @module.api
	 */
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

	/**
	 * @return the view's layout params.
	 * @module.api
	 */
	public LayoutParams getLayoutParams()
	{
		return layoutParams;
	}

	/**
	 * @return the Android native view.
	 * @module.api
	 */
	public View getNativeView()
	{
		return nativeView;
	}

	/**
	 * Sets the nativeView to view.
	 * @param view the view to set
	 * @module.api
	 */
	protected void setNativeView(View view)
	{
		if (view.getId() == View.NO_ID) {
			view.setId(idGenerator.incrementAndGet());
		}
		this.nativeView = view;
		boolean clickable = true;

		if (proxy.hasProperty(TiC.PROPERTY_TOUCH_ENABLED)) {
			clickable = TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_TOUCH_ENABLED));
		}
		doSetClickable(nativeView, clickable);
		nativeView.setOnFocusChangeListener(this);
	}

	protected void setLayoutParams(LayoutParams layoutParams)
	{
		this.layoutParams = layoutParams;
	}

	/**
	 * Animates the view if there are pending animations.
	 */
	public void animate()
	{
		if (nativeView == null) {
			return;
		}

		// Pre-honeycomb, if one animation clobbers another you get a problem whereby the background of the
		// animated view's parent (or the grandparent) bleeds through.  It seems to improve if you cancel and clear
		// the older animation.  So here we cancel and clear, then re-queue the desired animation.
		if (Build.VERSION.SDK_INT < TiC.API_LEVEL_HONEYCOMB) {
			Animation currentAnimation = nativeView.getAnimation();
			if (currentAnimation != null && currentAnimation.hasStarted() && !currentAnimation.hasEnded()) {
				// Cancel existing animation and
				// re-queue desired animation.
				currentAnimation.cancel();
				nativeView.clearAnimation();
				proxy.handlePendingAnimation(true);
				return;
			}

		}

		TiAnimationBuilder builder = proxy.getPendingAnimation();
		if (builder == null) {
			return;
		}

		proxy.clearAnimation(builder);
		AnimationSet as = builder.render(proxy, nativeView);

		// If a view is "visible" but not currently seen (such as because it's covered or
		// its position is currently set to be fully outside its parent's region),
		// then Android might not animate it immediately because by default it animates
		// "on first frame" and apparently "first frame" won't happen right away if the
		// view has no visible rectangle on screen.  In that case invalidate its parent, which will
		// kick off the pending animation.
		boolean invalidateParent = false;
		ViewParent viewParent = nativeView.getParent();

		if (nativeView.getVisibility() == View.VISIBLE && viewParent instanceof View) {
			int width = nativeView.getWidth();
			int height = nativeView.getHeight();

			if (width == 0 || height == 0) {
				// Could be animating from nothing to something
				invalidateParent = true;
			} else {
				Rect r = new Rect(0, 0, width, height);
				Point p = new Point(0, 0);
				invalidateParent = !(viewParent.getChildVisibleRect(nativeView, r, p));
			}
		}

		Log.d(TAG, "starting animation: " + as, Log.DEBUG_MODE);
		nativeView.startAnimation(as);

		if (invalidateParent) {
			((View) viewParent).postInvalidate();
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

	private boolean hasRepeat(KrollDict d)
	{
		return d.containsKeyAndNotNull(TiC.PROPERTY_BACKGROUND_REPEAT);
	}

	private boolean hasGradient(KrollDict d)
	{
		return d.containsKeyAndNotNull(TiC.PROPERTY_BACKGROUND_GRADIENT);
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

	public void forceLayoutNativeView(boolean imformParent)
	{
		layoutNativeView(imformParent);
	}

	protected void layoutNativeView()
	{
		if (!this.proxy.isLayoutStarted()) {
			layoutNativeView(false);
		}
	}

	protected void layoutNativeView(boolean informParent)
	{
		if (nativeView != null) {
			Animation a = nativeView.getAnimation();
			if (a != null && a instanceof TiMatrixAnimation) {
				TiMatrixAnimation matrixAnimation = (TiMatrixAnimation) a;
				matrixAnimation.invalidateWithMatrix(nativeView);
			}
			if (informParent) {				
				if (parent != null) {
					TiUIView uiv = parent.peekView();
					if (uiv != null) {
						View v = uiv.getNativeView();
						if (v instanceof TiCompositeLayout) {
							((TiCompositeLayout) v).resort();
						}
					}
				}
			}
			nativeView.requestLayout();
		}
	}

	public boolean iszIndexChanged()
	{
		return zIndexChanged;
	}

	public void setzIndexChanged(boolean zIndexChanged)
	{
		this.zIndexChanged = zIndexChanged;
	}

	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (key.equals(TiC.PROPERTY_LEFT)) {
			resetPostAnimationValues();
			if (newValue != null) {
				layoutParams.optionLeft = TiConvert.toTiDimension(TiConvert.toString(newValue), TiDimension.TYPE_LEFT);
			} else {
				layoutParams.optionLeft = null;
			}
			layoutNativeView();
		} else if (key.equals(TiC.PROPERTY_TOP)) {
			resetPostAnimationValues();
			if (newValue != null) {
				layoutParams.optionTop = TiConvert.toTiDimension(TiConvert.toString(newValue), TiDimension.TYPE_TOP);
			} else {
				layoutParams.optionTop = null;
			}
			layoutNativeView();
		} else if (key.equals(TiC.PROPERTY_CENTER)) {
			resetPostAnimationValues();
			TiConvert.updateLayoutCenter(newValue, layoutParams);
			layoutNativeView();
		} else if (key.equals(TiC.PROPERTY_RIGHT)) {
			resetPostAnimationValues();
			if (newValue != null) {
				layoutParams.optionRight = TiConvert.toTiDimension(TiConvert.toString(newValue), TiDimension.TYPE_RIGHT);
			} else {
				layoutParams.optionRight = null;
			}
			layoutNativeView();
		} else if (key.equals(TiC.PROPERTY_BOTTOM)) {
			resetPostAnimationValues();
			if (newValue != null) {
				layoutParams.optionBottom = TiConvert.toTiDimension(TiConvert.toString(newValue), TiDimension.TYPE_BOTTOM);
			} else {
				layoutParams.optionBottom = null;
			}
			layoutNativeView();
		} else if (key.equals(TiC.PROPERTY_SIZE)) {
			if (newValue instanceof HashMap) {
				HashMap<String, Object> d = (HashMap) newValue;
				propertyChanged(TiC.PROPERTY_WIDTH, oldValue, d.get(TiC.PROPERTY_WIDTH), proxy);
				propertyChanged(TiC.PROPERTY_HEIGHT, oldValue, d.get(TiC.PROPERTY_HEIGHT), proxy);
			}else if (newValue != null){
				Log.w(TAG, "Unsupported property type ("+(newValue.getClass().getSimpleName())+") for key: " + key+". Must be an object/dictionary");
			}
		} else if (key.equals(TiC.PROPERTY_HEIGHT)) {
			resetPostAnimationValues();
			if (newValue != null) {
				layoutParams.optionHeight = null;
				layoutParams.sizeOrFillHeightEnabled = true;
				if (newValue.equals(TiC.LAYOUT_SIZE)) {
					layoutParams.autoFillsHeight = false;
				} else if (newValue.equals(TiC.LAYOUT_FILL)) {
					layoutParams.autoFillsHeight = true;
				} else if (!newValue.equals(TiC.SIZE_AUTO)) {
					layoutParams.optionHeight = TiConvert.toTiDimension(TiConvert.toString(newValue),
						TiDimension.TYPE_HEIGHT);
					layoutParams.sizeOrFillHeightEnabled = false;
				}
			} else {
				layoutParams.optionHeight = null;
			}
			layoutNativeView();
		} else if (key.equals(TiC.PROPERTY_HORIZONTAL_WRAP)) {
			if (nativeView instanceof TiCompositeLayout) {
				((TiCompositeLayout) nativeView).setEnableHorizontalWrap(TiConvert.toBoolean(newValue));
			}
			layoutNativeView();
		} else if (key.equals(TiC.PROPERTY_WIDTH)) {
			resetPostAnimationValues();
			if (newValue != null) {
				layoutParams.optionWidth = null;
				layoutParams.sizeOrFillWidthEnabled = true;
				if (newValue.equals(TiC.LAYOUT_SIZE)) {
					layoutParams.autoFillsWidth = false;
				} else if (newValue.equals(TiC.LAYOUT_FILL)) {
					layoutParams.autoFillsWidth = true;
				} else if (!newValue.equals(TiC.SIZE_AUTO)) {
					layoutParams.optionWidth = TiConvert.toTiDimension(TiConvert.toString(newValue), TiDimension.TYPE_WIDTH);
					layoutParams.sizeOrFillWidthEnabled = false;
				}
			} else {
				layoutParams.optionWidth = null;
			}
			layoutNativeView();
		} else if (key.equals(TiC.PROPERTY_ZINDEX)) {
			if (newValue != null) {
				layoutParams.optionZIndex = TiConvert.toInt(newValue);
			} else {
				layoutParams.optionZIndex = 0;
			}
			if (!this.proxy.isLayoutStarted()) {
				layoutNativeView(true);
			} else {
				setzIndexChanged(true);
			}
		} else if (key.equals(TiC.PROPERTY_FOCUSABLE)) {
			boolean focusable = TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_FOCUSABLE));
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
			Log.i(TAG, key + " not yet implemented.");
		} else if (key.equals(TiC.PROPERTY_OPACITY)
			|| key.startsWith(TiC.PROPERTY_BACKGROUND_PREFIX)
			|| key.startsWith(TiC.PROPERTY_BORDER_PREFIX)) {
			// Update first before querying.
			proxy.setProperty(key, newValue);

			KrollDict d = proxy.getProperties();

			boolean hasImage = hasImage(d);
			boolean hasRepeat = hasRepeat(d);
			boolean hasColorState = hasColorState(d);
			boolean hasBorder = hasBorder(d);
			boolean hasGradient = hasGradient(d);
			boolean nativeViewNull = (nativeView == null);

			boolean requiresCustomBackground = hasImage || hasRepeat || hasColorState || hasBorder || hasGradient;

			if (!requiresCustomBackground) {
				if (background != null) {
					background.releaseDelegate();
					background.setCallback(null);
					background = null;
				}

				if (d.containsKeyAndNotNull(TiC.PROPERTY_BACKGROUND_COLOR)) {
					Integer bgColor = TiConvert.toColor(d, TiC.PROPERTY_BACKGROUND_COLOR);
					if (!nativeViewNull) {
						nativeView.setBackgroundColor(bgColor);
						nativeView.postInvalidate();
					}
				} else {
					if (key.equals(TiC.PROPERTY_OPACITY)) {
						setOpacity(TiConvert.toFloat(newValue, 1f));
					}
					if (!nativeViewNull) {
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

				if (!hasColorState && !hasGradient) {
					if (d.get(TiC.PROPERTY_BACKGROUND_COLOR) != null) {
						bgColor = TiConvert.toColor(d, TiC.PROPERTY_BACKGROUND_COLOR);
						if (newBackground || (key.equals(TiC.PROPERTY_OPACITY) || key.equals(TiC.PROPERTY_BACKGROUND_COLOR))) {
							background.setBackgroundColor(bgColor);
						}
					}
				}

				if (hasImage || hasRepeat || hasColorState || hasGradient) {
					if (newBackground || key.equals(TiC.PROPERTY_OPACITY) || key.startsWith(TiC.PROPERTY_BACKGROUND_PREFIX)) {
						handleBackgroundImage(d);
					}
				}

				if (hasBorder) {
					if (borderView == null && parent != null) {
						// Since we have to create a new border wrapper view, we need to remove this view, and re-add it.
						// This will ensure the border wrapper view is added correctly.
						TiUIView parentView = parent.getOrCreateView();
						parentView.remove(this);
						initializeBorder(d, bgColor);
						parentView.add(this);
					} else if (key.startsWith(TiC.PROPERTY_BORDER_PREFIX)) {
						handleBorderProperty(key, newValue);
					}
				}

				applyCustomBackground();

				if (key.equals(TiC.PROPERTY_OPACITY)) {
					setOpacity(TiConvert.toFloat(newValue, 1f));
				}

			}
			if (!nativeViewNull) {
				nativeView.postInvalidate();
			}
		} else if (key.equals(TiC.PROPERTY_SOFT_KEYBOARD_ON_FOCUS)) {
			Log.w(TAG, "Focus state changed to " + TiConvert.toString(newValue) + " not honored until next focus event.",
				Log.DEBUG_MODE);
		} else if (key.equals(TiC.PROPERTY_TRANSFORM)) {
			if (nativeView != null) {
				applyTransform((Ti2DMatrix)newValue);
			}
		} else if (key.equals(TiC.PROPERTY_KEEP_SCREEN_ON)) {
			if (nativeView != null) {
				nativeView.setKeepScreenOn(TiConvert.toBoolean(newValue));
			}
		} else {
			Log.d(TAG, "Unhandled property key: " + key, Log.DEBUG_MODE);
		}
	}

	public void processProperties(KrollDict d)
	{
		boolean nativeViewNull = false;
		if (nativeView == null) {
			nativeViewNull = true;
			Log.d(TAG, "Nativeview is null", Log.DEBUG_MODE);
		}
		if (d.containsKey(TiC.PROPERTY_LAYOUT)) {
			String layout = TiConvert.toString(d, TiC.PROPERTY_LAYOUT);
			if (nativeView instanceof TiCompositeLayout) {
				((TiCompositeLayout)nativeView).setLayoutArrangement(layout);
			}
		}
		if (TiConvert.fillLayout(d, layoutParams) && !nativeViewNull) {
			nativeView.requestLayout();
		}

		if (d.containsKey(TiC.PROPERTY_HORIZONTAL_WRAP)) {
			if (nativeView instanceof TiCompositeLayout) {
				((TiCompositeLayout) nativeView).setEnableHorizontalWrap(TiConvert.toBoolean(d, TiC.PROPERTY_HORIZONTAL_WRAP));
			}
		}

		Integer bgColor = null;

		// Default background processing.
		// Prefer image to color.
		if (hasImage(d) || hasColorState(d) || hasGradient(d)) {
			handleBackgroundImage(d);

		} else if (d.containsKey(TiC.PROPERTY_BACKGROUND_COLOR) && !nativeViewNull) {
			bgColor = TiConvert.toColor(d, TiC.PROPERTY_BACKGROUND_COLOR);

			// Set the background color on the view directly only
			// if there is no border. If a border is present we must
			// use the TiBackgroundDrawable.
			if (hasBorder(d)) {
				if (background == null) {
					applyCustomBackground(false);
				}
				background.setBackgroundColor(bgColor);

			} else {
				nativeView.setBackgroundColor(bgColor);
			}
		}

		if (d.containsKey(TiC.PROPERTY_VISIBLE) && !nativeViewNull) {
			nativeView.setVisibility(TiConvert.toBoolean(d, TiC.PROPERTY_VISIBLE) ? View.VISIBLE : View.INVISIBLE);
			
		}
		if (d.containsKey(TiC.PROPERTY_ENABLED) && !nativeViewNull) {
			nativeView.setEnabled(TiConvert.toBoolean(d, TiC.PROPERTY_ENABLED));
		}

		if (d.containsKey(TiC.PROPERTY_FOCUSABLE) && !nativeViewNull) {
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

		if (d.containsKey(TiC.PROPERTY_OPACITY) && !nativeViewNull) {
			setOpacity(TiConvert.toFloat(d, TiC.PROPERTY_OPACITY, 1f));

		}

		if (d.containsKey(TiC.PROPERTY_TRANSFORM)) {
			Ti2DMatrix matrix = (Ti2DMatrix) d.get(TiC.PROPERTY_TRANSFORM);
			if (matrix != null) {
				applyTransform(matrix);
			}
		}
		
		if (d.containsKey(TiC.PROPERTY_KEEP_SCREEN_ON) && !nativeViewNull) {
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

	/**
	 * Focuses the view.
	 */
	public void focus()
	{
		if (nativeView != null) {
			nativeView.requestFocus();
		}
	}

	/**
	 * Blurs the view.
	 */
	public void blur()
	{
		if (nativeView != null) {
			TiUIHelper.showSoftKeyboard(nativeView, false);
			nativeView.clearFocus();
		}
	}

	public void release()
	{
		Log.d(TAG, "Releasing: " + this, Log.DEBUG_MODE);
		View nv = getNativeView();
		if (nv != null) {
			if (nv instanceof ViewGroup) {
				ViewGroup vg = (ViewGroup) nv;
				Log.d(TAG, "Group has: " + vg.getChildCount(), Log.DEBUG_MODE);
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

	/**
	 * Shows the view, changing the view's visibility to View.VISIBLE.
	 */
	public void show()
	{
		if (nativeView != null) {
			nativeView.setVisibility(View.VISIBLE);
		} else {
			Log.w(TAG, "Attempt to show null native control", Log.DEBUG_MODE);
		}
	}

	/**
	 * Hides the view, changing the view's visibility to View.INVISIBLE.
	 */
	public void hide()
	{
		if (nativeView != null) {
			nativeView.setVisibility(View.INVISIBLE);
		} else {
			Log.w(TAG, "Attempt to hide null native control", Log.DEBUG_MODE);
		}
	}

	private String resolveImageUrl(String path) {
		return path.length() > 0 ? proxy.resolveUrl(null, path) : null;
	}

	private void handleBackgroundImage(KrollDict d)
	{
		String bg = d.getString(TiC.PROPERTY_BACKGROUND_IMAGE);
		String bgSelected = d.optString(TiC.PROPERTY_BACKGROUND_SELECTED_IMAGE, bg);
		String bgFocused = d.optString(TiC.PROPERTY_BACKGROUND_FOCUSED_IMAGE, bg);
		String bgDisabled = d.optString(TiC.PROPERTY_BACKGROUND_DISABLED_IMAGE, bg);
		
		String bgColor = d.getString(TiC.PROPERTY_BACKGROUND_COLOR);
		String bgSelectedColor = d.optString(TiC.PROPERTY_BACKGROUND_SELECTED_COLOR, bgColor);
		String bgFocusedColor = d.optString(TiC.PROPERTY_BACKGROUND_FOCUSED_COLOR, bgColor);
		String bgDisabledColor = d.optString(TiC.PROPERTY_BACKGROUND_DISABLED_COLOR, bgColor);

		if (bg != null) {
			bg = resolveImageUrl(bg);
		}
		if (bgSelected != null) {
			bgSelected = resolveImageUrl(bgSelected);
		}
		if (bgFocused != null) {
			bgFocused = resolveImageUrl(bgFocused);
		}
		if (bgDisabled != null) {
			bgDisabled = resolveImageUrl(bgDisabled);
		}

		TiGradientDrawable gradientDrawable = null;
		KrollDict gradientProperties = d.getKrollDict(TiC.PROPERTY_BACKGROUND_GRADIENT);
		if (gradientProperties != null) {
			try {
				gradientDrawable = new TiGradientDrawable(nativeView, gradientProperties);
				if (gradientDrawable.getGradientType() == GradientType.RADIAL_GRADIENT) {
					// TODO: Remove this once we support radial gradients.
					Log.w(TAG, "Android does not support radial gradients.");
					gradientDrawable = null;
				}
			}
			catch (IllegalArgumentException e) {
				gradientDrawable = null;
			}
		}

		if (bg != null || bgSelected != null || bgFocused != null || bgDisabled != null ||
				bgColor != null || bgSelectedColor != null || bgFocusedColor != null || bgDisabledColor != null || gradientDrawable != null) 
		{
			if (background == null) {
				applyCustomBackground(false);
			}

			Drawable bgDrawable = TiUIHelper.buildBackgroundDrawable(
					bg,
					d.getBoolean(TiC.PROPERTY_BACKGROUND_REPEAT),
					bgColor,
					bgSelected,
					bgSelectedColor,
					bgDisabled,
					bgDisabledColor,
					bgFocused,
					bgFocusedColor,
					gradientDrawable);

			background.setBackgroundDrawable(bgDrawable);
		}
	}

	private void initializeBorder(KrollDict d, Integer bgColor)
	{
		if (hasBorder(d)) {

			if(nativeView != null) {

				if (borderView == null) {
					Activity currentActivity = proxy.getActivity();
					if (currentActivity == null) {
						currentActivity = TiApplication.getAppCurrentActivity();
					}
					borderView = new TiBorderWrapperView(currentActivity);

					// Create new layout params for the child view since we just want the
					// wrapper to control the layout
					LayoutParams params = new LayoutParams();
					params.height = android.widget.FrameLayout.LayoutParams.MATCH_PARENT;
					params.width = android.widget.FrameLayout.LayoutParams.MATCH_PARENT;
					borderView.addView(nativeView, params);
				}

				if (d.containsKey(TiC.PROPERTY_BORDER_RADIUS)) {
					float radius = TiConvert.toFloat(d, TiC.PROPERTY_BORDER_RADIUS, 0f);
					if (radius > 0f && HONEYCOMB_OR_GREATER) {
						disableHWAcceleration();
					}
					borderView.setRadius(radius);
				}
				if (d.containsKey(TiC.PROPERTY_BORDER_COLOR) || d.containsKey(TiC.PROPERTY_BORDER_WIDTH)) {
					if (d.containsKey(TiC.PROPERTY_BORDER_COLOR)) {
						borderView.setColor(TiConvert.toColor(d, TiC.PROPERTY_BORDER_COLOR));
					} else {
						if (bgColor != null) {
							borderView.setColor(bgColor);
						}
					}
					if (d.containsKey(TiC.PROPERTY_BORDER_WIDTH)) {
						borderView.setBorderWidth(TiConvert.toFloat(d, TiC.PROPERTY_BORDER_WIDTH, 0f));
					}
				}
			}
		}
	}

	private void handleBorderProperty(String property, Object value)
	{
		if (TiC.PROPERTY_BORDER_COLOR.equals(property)) {
			borderView.setColor(TiConvert.toColor(value.toString()));
		} else if (TiC.PROPERTY_BORDER_RADIUS.equals(property)) {
			float radius = TiConvert.toFloat(value, 0f);
			if (radius > 0f && HONEYCOMB_OR_GREATER) {
				disableHWAcceleration();
			}
			borderView.setRadius(radius);
		} else if (TiC.PROPERTY_BORDER_WIDTH.equals(property)) {
			borderView.setBorderWidth(TiConvert.toFloat(value, 0f));
		}
	}

	private static HashMap<Integer, String> motionEvents = new HashMap<Integer,String>();
	static
	{
		motionEvents.put(MotionEvent.ACTION_DOWN, TiC.EVENT_TOUCH_START);
		motionEvents.put(MotionEvent.ACTION_UP, TiC.EVENT_TOUCH_END);
		motionEvents.put(MotionEvent.ACTION_MOVE, TiC.EVENT_TOUCH_MOVE);
		motionEvents.put(MotionEvent.ACTION_CANCEL, TiC.EVENT_TOUCH_CANCEL);
	}

	protected KrollDict dictFromEvent(MotionEvent e)
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

	public View getOuterView()
	{
		if (borderView == null) {
			return nativeView;
		}
		return borderView;
	}

	public void registerForTouch()
	{
		if (allowRegisterForTouch()) {
			registerForTouch(getNativeView());
		}
	}

	protected void registerTouchEvents(final View touchable)
	{

		touchView = new WeakReference<View>(touchable);

		final ScaleGestureDetector scaleDetector = new ScaleGestureDetector(touchable.getContext(),
			new SimpleOnScaleGestureListener()
			{
				// protect from divide by zero errors
				long minTimeDelta = 1;
				float minStartSpan = 1.0f;
				float startSpan;

				@Override
				public boolean onScale(ScaleGestureDetector sgd)
				{
					if (proxy.hierarchyHasListener(TiC.EVENT_PINCH)) {
						float timeDelta = sgd.getTimeDelta() == 0 ? minTimeDelta : sgd.getTimeDelta();

						KrollDict data = new KrollDict();
						data.put(TiC.EVENT_PROPERTY_SCALE, sgd.getCurrentSpan() / startSpan);
						data.put(TiC.EVENT_PROPERTY_VELOCITY, (sgd.getScaleFactor() - 1.0f) / timeDelta * 1000);
						data.put(TiC.EVENT_PROPERTY_SOURCE, proxy);

						return proxy.fireEvent(TiC.EVENT_PINCH, data);
					}
					return false;
				}

				@Override
				public boolean onScaleBegin(ScaleGestureDetector sgd)
				{
					startSpan = sgd.getCurrentSpan() == 0 ? minStartSpan : sgd.getCurrentSpan();
					return true;
				}
			});

		final GestureDetector detector = new GestureDetector(touchable.getContext(), new SimpleOnGestureListener()
		{
			@Override
			public boolean onDoubleTap(MotionEvent e)
			{
				if (proxy.hierarchyHasListener(TiC.EVENT_DOUBLE_TAP) || proxy.hierarchyHasListener(TiC.EVENT_DOUBLE_CLICK)) {
					boolean handledTap = proxy.fireEvent(TiC.EVENT_DOUBLE_TAP, dictFromEvent(e));
					boolean handledClick = proxy.fireEvent(TiC.EVENT_DOUBLE_CLICK, dictFromEvent(e));
					return handledTap || handledClick;
				}
				return false;
			}

			@Override
			public boolean onSingleTapConfirmed(MotionEvent e)
			{
				Log.d(TAG, "TAP, TAP, TAP on " + proxy, Log.DEBUG_MODE);
				if (proxy.hierarchyHasListener(TiC.EVENT_SINGLE_TAP)) {
					return proxy.fireEvent(TiC.EVENT_SINGLE_TAP, dictFromEvent(e));
					// Moved click handling to the onTouch listener, because a single tap is not the
					// same as a click. A single tap is a quick tap only, whereas clicks can be held
					// before lifting.
					// boolean handledClick = proxy.fireEvent(TiC.EVENT_CLICK, dictFromEvent(event));
					// Note: this return value is irrelevant in our case. We "want" to use it
					// in onTouch below, when we call detector.onTouchEvent(event); But, in fact,
					// onSingleTapConfirmed is *not* called in the course of onTouchEvent. It's
					// called via Handler in GestureDetector. <-- See its Java source.
					// return handledTap;// || handledClick;
				}
				return false;
			}

			@Override
			public boolean onFling(MotionEvent e1, MotionEvent e2, float velocityX, float velocityY)
			{
				Log.d(TAG, "SWIPE on " + proxy, Log.DEBUG_MODE);
				if (proxy.hierarchyHasListener(TiC.EVENT_SWIPE)) {
					KrollDict data = dictFromEvent(e2);
					if (Math.abs(velocityX) > Math.abs(velocityY)) {
						data.put(TiC.EVENT_PROPERTY_DIRECTION, velocityX > 0 ? "right" : "left");
					} else {
						data.put(TiC.EVENT_PROPERTY_DIRECTION, velocityY > 0 ? "down" : "up");
					}
					return proxy.fireEvent(TiC.EVENT_SWIPE, data);
				}
				return false;
			}

			@Override
			public void onLongPress(MotionEvent e)
			{
				Log.d(TAG, "LONGPRESS on " + proxy, Log.DEBUG_MODE);

				if (proxy.hierarchyHasListener(TiC.EVENT_LONGPRESS)) {
					proxy.fireEvent(TiC.EVENT_LONGPRESS, dictFromEvent(e));
				}
			}
		});
		
		touchable.setOnTouchListener(new OnTouchListener()
		{
			public boolean onTouch(View view, MotionEvent event)
			{
				if (event.getAction() == MotionEvent.ACTION_UP) {
					lastUpEvent.put(TiC.EVENT_PROPERTY_X, (double) event.getX());
					lastUpEvent.put(TiC.EVENT_PROPERTY_Y, (double) event.getY());
				}

				scaleDetector.onTouchEvent(event);
				if (scaleDetector.isInProgress()) {
					return true;
				}

				boolean handled = detector.onTouchEvent(event);
				if (handled) {
					return true;
				}

				String motionEvent = motionEvents.get(event.getAction());
				if (motionEvent != null) {
					if (proxy.hierarchyHasListener(motionEvent)) {
						proxy.fireEvent(motionEvent, dictFromEvent(event));
					}
				}

				// Inside View.java, dispatchTouchEvent() does not call onTouchEvent() if this listener returns true. As
				// a result, click and other motion events do not occur on the native Android side. To prevent this, we
				// always return false and let Android generate click and other motion events.
				return false;
			}
		});
		
	}
	protected void registerForTouch(final View touchable)
	{
		if (touchable == null) {
			return;
		}
		
		registerTouchEvents(touchable);
		
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

	/**
	 * Sets the nativeView's opacity.
	 * @param opacity the opacity to set.
	 */
	public void setOpacity(float opacity)
	{
		if (opacity < 0 || opacity > 1) {
			Log.w(TAG, "Ignoring invalid value for opacity: " + opacity);
			return;
		}
		if (borderView != null) {
			borderView.setBorderAlpha(Math.round(opacity * 255));
		}
		setOpacity(nativeView, opacity);
	}

	/**
	 * Sets the view's opacity.
	 * @param view the view object.
	 * @param opacity the opacity to set.
	 */
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
		return TiUIHelper.viewToImage(proxy.getProperties(), getNativeView());
	}

	private View getTouchView()
	{
		if (nativeView != null) {
			return nativeView;
		} else {
			if (touchView != null) {
				return touchView.get();
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

	/**
	 * Can be overriden by inheriting views for special click handling.  For example,
	 * the Facebook module's login button view needs special click handling.
	 */
	protected void setOnClickListener(View view)
	{
		view.setOnClickListener(new OnClickListener()
		{
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
			public boolean onLongClick(View view)
			{
				return proxy.fireEvent(TiC.EVENT_LONGCLICK, null);
			}
		});
	}

	private void disableHWAcceleration()
	{
		if (nativeView == null) {
			return;
		}
		Log.d(TAG, "Disabling hardware acceleration for instance of " + nativeView.getClass().getSimpleName(),
			Log.DEBUG_MODE);
		if (mSetLayerTypeMethod == null) {
			try {
				Class<? extends View> c = nativeView.getClass();
				mSetLayerTypeMethod = c.getMethod("setLayerType", int.class, Paint.class);
			} catch (SecurityException e) {
				Log.e(TAG, "SecurityException trying to get View.setLayerType to disable hardware acceleration.", e,
					Log.DEBUG_MODE);
			} catch (NoSuchMethodException e) {
				Log.e(TAG, "NoSuchMethodException trying to get View.setLayerType to disable hardware acceleration.", e,
					Log.DEBUG_MODE);
			}
		}

		if (mSetLayerTypeMethod == null) {
			return;
		}
		try {
			mSetLayerTypeMethod.invoke(nativeView, LAYER_TYPE_SOFTWARE, null);
		} catch (IllegalArgumentException e) {
			Log.e(TAG, e.getMessage(), e);
		} catch (IllegalAccessException e) {
			Log.e(TAG, e.getMessage(), e);
		} catch (InvocationTargetException e) {
			Log.e(TAG, e.getMessage(), e);
		}
	}

	/**
	 * Retrieve the saved animated scale values, which we store here since Android provides no property
	 * for looking them up.
	 */
	public Pair<Float, Float> getAnimatedScaleValues()
	{
		return animatedScaleValues;
	}

	/**
	 * Store the animated x and y scale values (i.e., the scale after an animation)
	 * since Android provides no property for looking them up.
	 */
	public void setAnimatedScaleValues(Pair<Float, Float> newValues)
	{
		animatedScaleValues = newValues;
	}

	/**
	 * Set the animated rotation degrees, since Android provides no property for looking it up.
	 */
	public void setAnimatedRotationDegrees(float degrees)
	{
		animatedRotationDegrees = degrees;
	}

	/**
	 * Retrieve the animated rotation degrees, which we store here since Android provides no property
	 * for looking it up.
	 */
	public float getAnimatedRotationDegrees()
	{
		return animatedRotationDegrees;
	}

	/**
	 * Set the animated alpha values, since Android provides no property for looking it up.
	 */
	public void setAnimatedAlpha(float alpha)
	{
		animatedAlpha = alpha;
	}

	/**
	 * Retrieve the animated alpha value, which we store here since Android provides no property
	 * for looking it up.
	 */
	public float getAnimatedAlpha()
	{
		return animatedAlpha;
	}

	/**
	 * "Forget" the values we save after scale and rotation and alpha animations.
	 */
	private void resetPostAnimationValues()
	{
		animatedRotationDegrees = 0f; // i.e., no rotation.
		animatedScaleValues = Pair.create(Float.valueOf(1f), Float.valueOf(1f)); // 1 means no scaling
		animatedAlpha = Float.MIN_VALUE; // we use min val to signal no val.
	}

}
