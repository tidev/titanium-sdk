/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.app.Activity;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.PorterDuff.Mode;
import android.graphics.drawable.Drawable;
import android.text.TextUtils;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;

import androidx.annotation.NonNull;
import androidx.appcompat.widget.AppCompatButton;

import com.google.android.material.button.MaterialButton;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.R;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import java.util.HashMap;

import ti.modules.titanium.ui.AttributedStringProxy;
import ti.modules.titanium.ui.UIModule;

public class TiUIButton extends TiUIView
{
	private static final String TAG = "TiUIButton";
	private static final float DEFAULT_SHADOW_RADIUS = 1f;

	private int defaultColor;
	private ColorStateList defaultRippleColor;
	private float shadowRadius = DEFAULT_SHADOW_RADIUS;
	private float shadowX = 0f;
	private float shadowY = 0f;
	private int shadowColor = Color.TRANSPARENT;

	public TiUIButton(final TiViewProxy proxy)
	{
		super(proxy);

		Log.d(TAG, "Creating a button", Log.DEBUG_MODE);

		// Fetch the material button style to use.
		int styleId = UIModule.BUTTON_STYLE_FILLED;
		styleId = TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_STYLE), styleId);
		switch (styleId) {
			case UIModule.BUTTON_STYLE_OPTION_POSITIVE:
				styleId = R.attr.buttonBarPositiveButtonStyle;
				break;
			case UIModule.BUTTON_STYLE_OPTION_NEGATIVE:
				styleId = R.attr.buttonBarNegativeButtonStyle;
				break;
			case UIModule.BUTTON_STYLE_OPTION_NEUTRAL:
				styleId = R.attr.buttonBarNeutralButtonStyle;
				break;
			case UIModule.BUTTON_STYLE_OUTLINED:
				styleId = R.attr.materialButtonOutlinedStyle;
				break;
			case UIModule.BUTTON_STYLE_TEXT:
				styleId = R.attr.borderlessButtonStyle;
				break;
			case UIModule.BUTTON_STYLE_FILLED:
			default:
				styleId = R.attr.materialButtonStyle;
				break;
		}

		// Determine if a background drawable will be applied to the button.
		boolean hasCustomBackground
			= hasImage(proxy.getProperties())
			|| hasColorState(proxy.getProperties())
			|| hasBorder(proxy.getProperties())
			|| hasGradient(proxy.getProperties());

		// Create and set up the button.
		// Note: MaterialButton does not support replacing its background drawable. Will log a nasty warning.
		AppCompatButton btn;
		if (hasCustomBackground) {
			btn = new AppCompatButton(proxy.getActivity())
			{
				@Override
				public boolean onFilterTouchEventForSecurity(MotionEvent event)
				{
					boolean isTouchAllowed = super.onFilterTouchEventForSecurity(event);
					if (!isTouchAllowed) {
						fireSyncEvent(TiC.EVENT_TOUCH_FILTERED, dictFromEvent(event));
					}
					return isTouchAllowed;
				}
			};
		} else {
			btn = new MaterialButton(proxy.getActivity(), null, styleId)
			{
				@Override
				public boolean onFilterTouchEventForSecurity(MotionEvent event)
				{
					boolean isTouchAllowed = super.onFilterTouchEventForSecurity(event);
					if (!isTouchAllowed) {
						fireSyncEvent(TiC.EVENT_TOUCH_FILTERED, dictFromEvent(event));
					}
					return isTouchAllowed;
				}
			};
			this.defaultRippleColor = ((MaterialButton) btn).getRippleColor();
		}
		btn.addOnLayoutChangeListener(new View.OnLayoutChangeListener()
		{
			@Override
			public void onLayoutChange(
				View v, int left, int top, int right, int bottom,
				int oldLeft, int oldTop, int oldRight, int oldBottom)
			{
				TiUIHelper.firePostLayoutEvent(getProxy());
			}
		});
		btn.setGravity(Gravity.CENTER);
		defaultColor = btn.getCurrentTextColor();
		btn.setEllipsize(TextUtils.TruncateAt.MIDDLE);
		btn.setMaxLines(1);
		setNativeView(btn);
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		boolean needShadow = false;

		Activity activity = proxy.getActivity();
		AppCompatButton btn = (AppCompatButton) getNativeView();
		if (!d.containsKey(TiC.PROPERTY_IMAGE) && d.containsKey(TiC.PROPERTY_BACKGROUND_COLOR)) {
			// Reset the padding here if the background color is set. By default the padding will be calculated
			// for the button, but if we set a background color, it will not look centered unless we reset the padding.
			btn.setPadding(8, 0, 8, 0);
		}
		if ((btn instanceof MaterialButton) && d.containsKey(TiC.PROPERTY_TOUCH_FEEDBACK)) {
			// We only override MaterialButton's native ripple effect if "touchFeedback" property is defined.
			ColorStateList colorStateList = null;
			if (TiConvert.toBoolean(d, TiC.PROPERTY_TOUCH_FEEDBACK, false)) {
				if (d.containsKeyAndNotNull(TiC.PROPERTY_TOUCH_FEEDBACK_COLOR)) {
					colorStateList = ColorStateList.valueOf(
						TiConvert.toColor(d, TiC.PROPERTY_TOUCH_FEEDBACK_COLOR, activity));
				} else {
					colorStateList = this.defaultRippleColor;
				}
			}
			((MaterialButton) btn).setRippleColor(colorStateList);
		}
		if (d.containsKey(TiC.PROPERTY_TITLE)) {
			btn.setText(d.getString(TiC.PROPERTY_TITLE));
		}
		if (d.containsKey(TiC.PROPERTY_ATTRIBUTED_STRING)) {
			Object attributedString = d.get(TiC.PROPERTY_ATTRIBUTED_STRING);
			if (attributedString instanceof AttributedStringProxy) {
				setAttributedStringText((AttributedStringProxy) attributedString);
			}
		}
		if (d.containsKey(TiC.PROPERTY_COLOR) || d.containsKey(TiC.PROPERTY_TINT_COLOR)) {
			String colorString = TiConvert.toString(d.get(TiC.PROPERTY_COLOR));
			if (colorString == null) {
				colorString = TiConvert.toString(d.get(TiC.PROPERTY_TINT_COLOR));
			}
			btn.setTextColor((colorString != null) ? TiConvert.toColor(colorString, activity) : this.defaultColor);
		}
		if (d.containsKey(TiC.PROPERTY_FONT)) {
			TiUIHelper.styleText(btn, d.getKrollDict(TiC.PROPERTY_FONT));
		}
		if (d.containsKey(TiC.PROPERTY_TEXT_ALIGN)) {
			String textAlign = d.getString(TiC.PROPERTY_TEXT_ALIGN);
			TiUIHelper.setAlignment(btn, textAlign, null);
		}
		if (d.containsKey(TiC.PROPERTY_VERTICAL_ALIGN)) {
			String verticalAlign = d.getString(TiC.PROPERTY_VERTICAL_ALIGN);
			TiUIHelper.setAlignment(btn, null, verticalAlign);
		}
		if (d.containsKey(TiC.PROPERTY_SHADOW_OFFSET)) {
			Object value = d.get(TiC.PROPERTY_SHADOW_OFFSET);
			if (value instanceof HashMap) {
				needShadow = true;
				HashMap dict = (HashMap) value;
				shadowX = TiConvert.toFloat(dict.get(TiC.PROPERTY_X), 0);
				shadowY = TiConvert.toFloat(dict.get(TiC.PROPERTY_Y), 0);
			}
		}
		if (d.containsKey(TiC.PROPERTY_SHADOW_RADIUS)) {
			needShadow = true;
			shadowRadius = TiConvert.toFloat(d.get(TiC.PROPERTY_SHADOW_RADIUS), DEFAULT_SHADOW_RADIUS);
		}
		if (d.containsKey(TiC.PROPERTY_SHADOW_COLOR)) {
			needShadow = true;
			shadowColor = TiConvert.toColor(d, TiC.PROPERTY_SHADOW_COLOR, activity);
		}
		if (needShadow) {
			btn.setShadowLayer(shadowRadius, shadowX, shadowY, shadowColor);
		}
		updateButtonImage();
		btn.invalidate();
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (Log.isDebugModeEnabled()) {
			Log.d(TAG, "Property: " + key + " old: " + oldValue + " new: " + newValue, Log.DEBUG_MODE);
		}
		Activity activity = proxy.getActivity();

		AppCompatButton btn = (AppCompatButton) getNativeView();
		if (key.equals(TiC.PROPERTY_TITLE)) {
			btn.setText((String) newValue);
		} else if (key.equals(TiC.PROPERTY_ATTRIBUTED_STRING) && newValue instanceof AttributedStringProxy) {
			setAttributedStringText((AttributedStringProxy) newValue);
		} else if (key.equals(TiC.PROPERTY_COLOR)) {
			String colorString = TiConvert.toString(newValue);
			btn.setTextColor((colorString != null) ? TiConvert.toColor(colorString, activity) : this.defaultColor);
		} else if (key.equals(TiC.PROPERTY_FONT)) {
			TiUIHelper.styleText(btn, (HashMap) newValue);
		} else if (key.equals(TiC.PROPERTY_TEXT_ALIGN)) {
			TiUIHelper.setAlignment(btn, TiConvert.toString(newValue), null);
			btn.requestLayout();
		} else if (key.equals(TiC.PROPERTY_VERTICAL_ALIGN)) {
			TiUIHelper.setAlignment(btn, null, TiConvert.toString(newValue));
			btn.requestLayout();
		} else if (key.equals(TiC.PROPERTY_IMAGE)
			|| key.equals(TiC.PROPERTY_IMAGE_IS_MASK)
			|| key.equals(TiC.PROPERTY_TINT_COLOR)) {
			if (!proxy.hasProperty(TiC.PROPERTY_COLOR) && key.equals(TiC.PROPERTY_TINT_COLOR)) {
				String colorString = TiConvert.toString(newValue);
				int color = (colorString != null) ? TiConvert.toColor(colorString, activity) : this.defaultColor;
				btn.setTextColor(color);
			}
			updateButtonImage();
		} else if ((btn instanceof MaterialButton)
			&& (key.equals(TiC.PROPERTY_TOUCH_FEEDBACK) || key.equals(TiC.PROPERTY_TOUCH_FEEDBACK_COLOR))) {
			// Only override MaterialButton's native ripple effect if "touchFeedback" property is defined.
			if (proxy.hasProperty(TiC.PROPERTY_TOUCH_FEEDBACK)) {
				ColorStateList colorStateList = null;
				if (TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_TOUCH_FEEDBACK), false)) {
					if (proxy.hasPropertyAndNotNull(TiC.PROPERTY_TOUCH_FEEDBACK_COLOR)) {
						String colorString = TiConvert.toString(proxy.getProperty(TiC.PROPERTY_TOUCH_FEEDBACK_COLOR));
						colorStateList = ColorStateList.valueOf(TiConvert.toColor(colorString, activity));
					} else {
						colorStateList = this.defaultRippleColor;
					}
				}
				((MaterialButton) btn).setRippleColor(colorStateList);
			}
		} else if (key.equals(TiC.PROPERTY_SHADOW_OFFSET)) {
			if (newValue instanceof HashMap) {
				HashMap dict = (HashMap) newValue;
				shadowX = TiConvert.toFloat(dict.get(TiC.PROPERTY_X), 0);
				shadowY = TiConvert.toFloat(dict.get(TiC.PROPERTY_Y), 0);
				btn.setShadowLayer(shadowRadius, shadowX, shadowY, shadowColor);
			}
		} else if (key.equals(TiC.PROPERTY_SHADOW_RADIUS)) {
			shadowRadius = TiConvert.toFloat(newValue, DEFAULT_SHADOW_RADIUS);
			btn.setShadowLayer(shadowRadius, shadowX, shadowY, shadowColor);
		} else if (key.equals(TiC.PROPERTY_SHADOW_COLOR)) {
			shadowColor = TiConvert.toColor(TiConvert.toString(newValue), activity);
			btn.setShadowLayer(shadowRadius, shadowX, shadowY, shadowColor);
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	@Override
	protected boolean canApplyTouchFeedback(@NonNull KrollDict props)
	{
		// If we're using MaterialButton, then we must use its setRippleColor() method instead.
		if (getNativeView() instanceof MaterialButton) {
			return false;
		}
		return super.canApplyTouchFeedback(props);
	}

	private void setAttributedStringText(AttributedStringProxy attrString)
	{
		MaterialButton btn = (MaterialButton) getNativeView();

		if (btn == null) {
			return;
		}

		CharSequence text = AttributedStringProxy.toSpannable(attrString, TiApplication.getAppCurrentActivity());
		if (text == null) {
			text = "";
		}

		btn.setText(text);
	}

	private void updateButtonImage()
	{
		// Do not continue if proxy has been released.
		if (this.proxy == null) {
			return;
		}

		// Fetch the button view.
		AppCompatButton button = (AppCompatButton) getNativeView();
		if (button == null) {
			return;
		}

		// Fetch the image.
		Drawable drawable = null;
		Object imageObject = this.proxy.getProperty(TiC.PROPERTY_IMAGE);
		if (imageObject != null) {
			drawable = TiUIHelper.getResourceDrawable(imageObject);
		}

		// Update button's image/icon.
		if (drawable != null) {
			boolean imageIsMask = TiConvert.toBoolean(this.proxy.getProperty(TiC.PROPERTY_IMAGE_IS_MASK), true);
			String colorString = TiConvert.toString(this.proxy.getProperty(TiC.PROPERTY_TINT_COLOR));
			int colorValue = this.defaultColor;
			if (proxy.hasPropertyAndNotNull(TiC.PROPERTY_TINT_COLOR)) {
				colorValue = TiConvert.toColor(proxy.getProperty(TiC.PROPERTY_TINT_COLOR), proxy.getActivity());
			}
			if (button instanceof MaterialButton) {
				MaterialButton materialButton = (MaterialButton) button;
				materialButton.setIcon(drawable);
				materialButton.setIconTintMode(imageIsMask ? Mode.SRC_IN : Mode.DST);
				materialButton.setIconTint(ColorStateList.valueOf(colorValue));
			} else {
				if (imageIsMask) {
					drawable = drawable.mutate();
					drawable.setColorFilter(colorValue, Mode.SRC_IN);
				}
				button.setCompoundDrawablesRelativeWithIntrinsicBounds(drawable, null, null, null);
			}
		} else {
			if (button instanceof MaterialButton) {
				((MaterialButton) button).setIcon(null);
			} else {
				button.setCompoundDrawablesRelativeWithIntrinsicBounds(null, null, null, null);
			}
		}
	}
}
