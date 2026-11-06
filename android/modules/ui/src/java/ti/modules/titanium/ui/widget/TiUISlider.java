/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import java.lang.ref.SoftReference;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.content.res.ColorStateList;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;

import com.google.android.material.slider.LabelFormatter;
import com.google.android.material.slider.Slider;

public class TiUISlider extends TiUIView implements Slider.OnChangeListener, Slider.OnSliderTouchListener
{
	private static final String TAG = "TiUISlider";

	private int min;
	private int max;
	private float pos;
	private int minRange;
	private int maxRange;

	private SoftReference<Drawable> thumbDrawable;

	public TiUISlider(final TiViewProxy proxy)
	{
		super(proxy);
		Log.d(TAG, "Creating a slider", Log.DEBUG_MODE);

		layoutParams.autoFillsWidth = true;

		this.min = 0;
		this.max = 1;
		this.pos = 0;

		Slider slider = new Slider(proxy.getActivity()) {
			@Override
			protected void onLayout(boolean changed, int left, int top, int right, int bottom)
			{
				super.onLayout(changed, left, top, right, bottom);
				TiUIHelper.firePostLayoutEvent(proxy);
			}
		};
		// Titanium sliders never showed a value label. Apps can't format it, so keep it hidden.
		slider.setLabelBehavior(LabelFormatter.LABEL_GONE);
		slider.addOnChangeListener(this);
		slider.addOnSliderTouchListener(this);
		setNativeView(slider);
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		Slider slider = (Slider) getNativeView();
		Activity activity = proxy.getActivity();

		if (d.containsKey(TiC.PROPERTY_VALUE)) {
			pos = TiConvert.toFloat(d, TiC.PROPERTY_VALUE, 0);
		}
		if (d.containsKey(TiC.PROPERTY_MIN)) {
			min = TiConvert.toInt(d.get(TiC.PROPERTY_MIN), 0);
		}
		if (d.containsKey(TiC.PROPERTY_MAX)) {
			max = TiConvert.toInt(d.get(TiC.PROPERTY_MAX), 0);
		}
		if (d.containsKey("minRange")) {
			minRange = TiConvert.toInt(d.get("minRange"), 0);
		} else {
			minRange = min;
		}
		if (d.containsKey("maxRange")) {
			maxRange = TiConvert.toInt(d.get("maxRange"), 0);
		} else {
			maxRange = max;
		}
		if (d.containsKey("thumbImage")) {
			Log.w(TAG, "Ti.UI.Slider property 'thumbImage' is deprecated on Android as of Titanium 14.0.0.");
			updateThumb(slider, d);
		}
		if (d.containsKey(TiC.PROPERTY_SPLIT_TRACK)) {
			if (d.getBoolean(TiC.PROPERTY_SPLIT_TRACK)) {
				Log.w(TAG, "Ti.UI.Slider property 'splitTrack' is no longer supported on Android"
					+ " as of Titanium 14.0.0 and will be ignored.");
			}
		}
		if (d.containsKey("leftTrackImage") || d.containsKey("rightTrackImage")) {
			Log.w(TAG, "Ti.UI.Slider properties 'leftTrackImage' and 'rightTrackImage' are no longer supported"
				+ " on Android as of Titanium 14.0.0 and will be ignored."
				+ " Use 'tintColor' and 'trackTintColor' instead.");
		}
		if (d.containsKeyAndNotNull(TiC.PROPERTY_TINT_COLOR)) {
			handleSetTintColor(TiConvert.toColor(d, TiC.PROPERTY_TINT_COLOR, activity));
		}
		if (d.containsKeyAndNotNull(TiC.PROPERTY_TRACK_TINT_COLOR)) {
			handleSetTrackTintColor(TiConvert.toColor(d, TiC.PROPERTY_TRACK_TINT_COLOR, activity));
		}
		updateRange();
		updateControl();
	}

	private void updateRange()
	{
		minRange = Math.max(minRange, min);
		minRange = Math.min(minRange, max);
		proxy.setProperty("minRange", minRange);

		maxRange = Math.min(maxRange, max);
		maxRange = Math.max(maxRange, minRange);
		proxy.setProperty("maxRange", maxRange);
	}

	private void updateControl()
	{
		Slider slider = (Slider) getNativeView();
		if (max <= min) {
			Log.w(TAG, "Ti.UI.Slider 'max' must be greater than 'min'. Ignoring value range update.");
			return;
		}
		pos = Math.max(Math.min(pos, maxRange), minRange);
		slider.setValueFrom(min);
		slider.setValueTo(max);
		slider.setValue(pos);
	}

	private void updateThumb(Slider slider, KrollDict d)
	{
		String thumbImage = TiConvert.toString(d, "thumbImage");
		if (thumbImage != null) {
			TiFileHelper tfh = new TiFileHelper(slider.getContext());
			String url = proxy.resolveUrl(null, thumbImage);
			Drawable thumb = tfh.loadDrawable(url, false);
			if (thumb != null) {
				thumbDrawable = new SoftReference<>(thumb);
				slider.setCustomThumbDrawable(thumb);
			} else {
				Log.e(TAG, "Unable to locate thumb image for slider: " + url);
			}
		} else {
			Log.w(TAG, "Removing a previously assigned 'thumbImage' is not supported.");
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (Log.isDebugModeEnabled()) {
			Log.d(TAG, "Property: " + key + " old: " + oldValue + " new: " + newValue, Log.DEBUG_MODE);
		}

		Slider slider = (Slider) getNativeView();
		if (slider == null) {
			return;
		}

		if (key.equals(TiC.PROPERTY_VALUE)) {
			pos = TiConvert.toFloat(newValue);
			updateControl();
		} else if (key.equals("min")) {
			min = TiConvert.toInt(newValue);
			minRange = min;
			updateRange();
			updateControl();
		} else if (key.equals("minRange")) {
			minRange = TiConvert.toInt(newValue);
			updateRange();
			updateControl();
		} else if (key.equals("max")) {
			max = TiConvert.toInt(newValue);
			maxRange = max;
			updateRange();
			updateControl();
		} else if (key.equals("maxRange")) {
			maxRange = TiConvert.toInt(newValue);
			updateRange();
			updateControl();
		} else if (key.equals(TiC.PROPERTY_TINT_COLOR)) {
			// TODO: reset to default value when property is null
			if (newValue != null) {
				handleSetTintColor(TiConvert.toColor(newValue, proxy.getActivity()));
			}
		} else if (key.equals(TiC.PROPERTY_TRACK_TINT_COLOR)) {
			// TODO: reset to default value when property is null
			if (newValue != null) {
				handleSetTrackTintColor(TiConvert.toColor(newValue, proxy.getActivity()));
			}
		} else if (key.equals("thumbImage")) {
			Log.w(TAG, "Ti.UI.Slider property 'thumbImage' is deprecated on Android as of Titanium 14.0.0.");
			updateThumb(slider, this.proxy.getProperties());
		} else if (key.equals(TiC.PROPERTY_SPLIT_TRACK)) {
			Log.w(TAG, "Ti.UI.Slider property 'splitTrack' is no longer supported on Android"
				+ " as of Titanium 14.0.0 and will be ignored.");
		} else if (key.equals("leftTrackImage") || key.equals("rightTrackImage")) {
			Log.w(TAG, "Ti.UI.Slider properties 'leftTrackImage' and 'rightTrackImage' are no longer supported"
				+ " on Android as of Titanium 14.0.0 and will be ignored."
				+ " Use 'tintColor' and 'trackTintColor' instead.");
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	@Override
	public void onValueChange(Slider slider, float value, boolean fromUser)
	{
		// Keep the thumb within the "minRange" and "maxRange" bounds.
		float clampedValue = Math.max(Math.min(value, maxRange), minRange);
		if (clampedValue != value) {
			slider.setValue(clampedValue);
			return;
		}
		pos = value;

		Drawable thumb = (thumbDrawable != null) ? thumbDrawable.get() : null;
		KrollDict offset = new KrollDict();
		offset.put(TiC.EVENT_PROPERTY_X, 0);
		offset.put(TiC.EVENT_PROPERTY_Y, 0);
		KrollDict size = new KrollDict();
		size.put(TiC.PROPERTY_WIDTH, 0);
		size.put(TiC.PROPERTY_HEIGHT, 0);
		if (thumb != null) {
			Rect thumbBounds = thumb.getBounds();
			if (thumbBounds != null) {
				offset.put(TiC.EVENT_PROPERTY_X, thumbBounds.left);
				offset.put(TiC.EVENT_PROPERTY_Y, thumbBounds.top);
				size.put(TiC.PROPERTY_WIDTH, thumbBounds.width());
				size.put(TiC.PROPERTY_HEIGHT, thumbBounds.height());
			}
		}
		KrollDict data = new KrollDict();
		Log.d(TAG,
			  "Value " + pos + " Min " + min + " Max " + max + " MinRange " + minRange + " MaxRange " + maxRange,
			  Log.DEBUG_MODE);
		data.put(TiC.PROPERTY_VALUE, pos);
		data.put(TiC.EVENT_PROPERTY_THUMB_OFFSET, offset);
		data.put(TiC.EVENT_PROPERTY_THUMB_SIZE, size);
		data.put("isTrusted", fromUser);
		proxy.setProperty(TiC.PROPERTY_VALUE, pos);

		fireEvent(TiC.EVENT_CHANGE, data);
	}

	@Override
	public void onStartTrackingTouch(Slider slider)
	{
		KrollDict data = new KrollDict();
		data.put(TiC.PROPERTY_VALUE, pos);
		fireEvent(TiC.EVENT_START, data, false);
	}

	@Override
	public void onStopTrackingTouch(Slider slider)
	{
		KrollDict data = new KrollDict();
		data.put(TiC.PROPERTY_VALUE, pos);
		fireEvent(TiC.EVENT_STOP, data, false);
	}

	protected void handleSetTintColor(int color)
	{
		Slider slider = (Slider) getNativeView();
		slider.setTrackActiveTintList(ColorStateList.valueOf(color));
	}

	protected void handleSetTrackTintColor(int color)
	{
		Slider slider = (Slider) getNativeView();
		slider.setTrackInactiveTintList(ColorStateList.valueOf(color));
	}
}
