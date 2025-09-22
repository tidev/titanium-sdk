/**
* Titanium SDK
* Copyright TiDev, Inc. 04/07/2022-Present
* Licensed under the terms of the Apache Public License
* Please see the LICENSE included with this distribution for details.
*/
package ti.modules.titanium.ui.widget;

import android.graphics.Color;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import androidx.annotation.Nullable;

import eightbitlab.com.blurview.BlurView;
import ti.modules.titanium.ui.UIModule;

public class TiUIBlurView extends TiUIView
{
	private static final String TAG = "TiUIBlurView";

	// Custom property keys (Android-only)
	private static final String PROPERTY_EFFECT = "effect"; // Number (Ti.UI.BLUR_EFFECT_STYLE_*)
	private static final String PROPERTY_BLUR_RADIUS = "blurRadius"; // Number
	private static final String PROPERTY_OVERLAY_COLOR = "overlayColor"; // String color

	private final BlurView blurView;
	private final TiCompositeLayout contentLayout;

	// Current config
	private float blurRadius = 16f;
	private int overlayColor = 0x00FFFFFF; // transparent by default
	private int effectStyle = -1; // unset

	private class BlurContainer extends FrameLayout
	{
		final TiCompositeLayout layout;
		final BlurView innerBlurView;

		BlurContainer()
		{
			super(proxy.getActivity());

			// Determine arrangement from proxy
			TiCompositeLayout.LayoutArrangement arrangement = TiCompositeLayout.LayoutArrangement.DEFAULT;
			Object layoutValue = proxy.getProperty(TiC.PROPERTY_LAYOUT);
			if (TiC.LAYOUT_VERTICAL.equals(layoutValue)) {
				arrangement = TiCompositeLayout.LayoutArrangement.VERTICAL;
			} else if (TiC.LAYOUT_HORIZONTAL.equals(layoutValue)) {
				arrangement = TiCompositeLayout.LayoutArrangement.HORIZONTAL;
			}

			// Create blur and content layout
			innerBlurView = new BlurView(proxy.getActivity());
			innerBlurView.setLayoutParams(new FrameLayout.LayoutParams(
				ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

			layout = new TiCompositeLayout(proxy.getActivity(), arrangement, proxy);
			layout.setLayoutParams(new FrameLayout.LayoutParams(
				ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

			// Add in order: blur background then content overlay
			super.addView(innerBlurView);
			super.addView(layout);
		}

		TiCompositeLayout getLayout()
		{
			return layout;
		}

		BlurView getBlurView()
		{
			return innerBlurView;
		}

		@Override
		public void addView(View child, ViewGroup.LayoutParams params)
		{
			// Route adds to TiCompositeLayout to ensure correct LayoutParams
			layout.addView(child, params);
		}
	}

	public TiUIBlurView(TiViewProxy proxy)
	{
		super(proxy);

		BlurContainer container = new BlurContainer();
		this.blurView = container.getBlurView();
		this.contentLayout = container.getLayout();

		setNativeView(container);
		// Defer setup until we know the target (if provided)
		setupOrUpdateBlur();
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		if (d.containsKey(PROPERTY_BLUR_RADIUS)) {
			this.blurRadius = TiConvert.toFloat(d, PROPERTY_BLUR_RADIUS, this.blurRadius);
		}
		if (d.containsKey(PROPERTY_OVERLAY_COLOR)) {
			this.overlayColor = TiConvert.toColor(d.get(PROPERTY_OVERLAY_COLOR), proxy.getActivity());
		}
		if (d.containsKey(PROPERTY_EFFECT)) {
			this.effectStyle = TiConvert.toInt(d.get(PROPERTY_EFFECT), -1);
			applyEffectPresetIfAny();
		}

		setupOrUpdateBlur();
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (Log.isDebugModeEnabled()) {
			Log.d(TAG, "Property changed: " + key + ", new: " + newValue, Log.DEBUG_MODE);
		}

		if (PROPERTY_BLUR_RADIUS.equals(key)) {
			this.blurRadius = TiConvert.toFloat(newValue, this.blurRadius);
			if (blurView != null) {
				blurView.setBlurRadius(this.blurRadius);
			}
		} else if (PROPERTY_OVERLAY_COLOR.equals(key)) {
			this.overlayColor = TiConvert.toColor(newValue, proxy.getActivity());
			if (blurView != null) {
				blurView.setOverlayColor(this.overlayColor);
			}
		} else if (PROPERTY_EFFECT.equals(key)) {
			this.effectStyle = TiConvert.toInt(newValue, -1);
			applyEffectPresetIfAny();
			if (blurView != null) {
				blurView.setOverlayColor(this.overlayColor);
				blurView.setBlurRadius(this.blurRadius);
			}
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	private void setupOrUpdateBlur()
	{
		if (blurView == null) {
			return;
		}

		Drawable windowBackground = getWindowBackground();
		if (windowBackground == null) {
			windowBackground = new ColorDrawable(Color.TRANSPARENT);
		}

		// Legacy API: setup with root content view, using RenderScriptBlur for <31
		ViewGroup rootView = getRootContentView();
		if (rootView == null) {
			return;
		}

		blurView.setupWith(rootView)
			.setFrameClearDrawable(windowBackground)
			.setBlurRadius(this.blurRadius)
			.setOverlayColor(this.overlayColor);
	}

	private void applyEffectPresetIfAny()
	{
		// Map iOS-like styles to Android parameters.
		// These constants are defined on Ti.UI.*
		// Default values already set on fields.
		switch (this.effectStyle) {
			case UIModule.BLUR_EFFECT_STYLE_EXTRA_LIGHT:
				this.blurRadius = 16f;
				this.overlayColor = 0x66FFFFFF; // strongest white tint
				break;
			case UIModule.BLUR_EFFECT_STYLE_LIGHT:
				this.blurRadius = 16f;
				this.overlayColor = 0x44FFFFFF; // medium white tint
				break;
			case UIModule.BLUR_EFFECT_STYLE_DARK:
				this.blurRadius = 16f;
				this.overlayColor = 0x66000000; // dark tint
				break;
			default:
				// leave custom values as-is when unknown
				break;
		}
	}

	@Nullable
	private ViewGroup getRootContentView()
	{
		if (proxy == null || proxy.getActivity() == null || proxy.getActivity().getWindow() == null) {
			return null;
		}
		View decor = proxy.getActivity().getWindow().getDecorView();
		View content = decor.findViewById(android.R.id.content);
		if (content instanceof ViewGroup) {
			return (ViewGroup) content;
		}
		return null;
	}

	@Nullable
	private Drawable getWindowBackground()
	{
		if (proxy == null || proxy.getActivity() == null || proxy.getActivity().getWindow() == null) {
			return null;
		}
		return proxy.getActivity().getWindow().getDecorView().getBackground();
	}
}
