/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
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

import android.content.res.ColorStateList;
import android.graphics.Rect;
import android.graphics.drawable.ClipDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.os.Build;
import android.view.Gravity;
import android.widget.SeekBar;

public class TiUISlider extends TiUIView implements SeekBar.OnSeekBarChangeListener
{
	private static final String TAG = "TiUISlider";

	private int min;
	private int max;
	private float pos;
	private int offset;
	private int minRange;
	private int maxRange;
	private int scaleFactor;
	private ClipDrawable rightClipDrawable;

	private SoftReference<Drawable> thumbDrawable;

	public TiUISlider(final TiViewProxy proxy)
	{
		super(proxy);
		Log.d(TAG, "Creating a seekBar", Log.DEBUG_MODE);

		layoutParams.autoFillsWidth = true;

		this.min = 0;
		this.max = 1;
		this.pos = 0;

		SeekBar seekBar = new SeekBar(proxy.getActivity()) {
			@Override
			protected void onLayout(boolean changed, int left, int top, int right, int bottom)
			{
				super.onLayout(changed, left, top, right, bottom);
				TiUIHelper.firePostLayoutEvent(proxy);
			}
		};
		seekBar.setOnSeekBarChangeListener(this);
		setNativeView(seekBar);
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		SeekBar seekBar = (SeekBar) getNativeView();

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
			updateThumb(seekBar, d);
		}
		if (d.containsKey(TiC.PROPERTY_SPLIT_TRACK)) {
			if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
				seekBar.setSplitTrack(TiConvert.toBoolean(d.get(TiC.PROPERTY_SPLIT_TRACK)));
			}
		}
		if (d.containsKey("leftTrackImage") || d.containsKey("rightTrackImage")) {
			updateTrackingImages(seekBar, d);
		}
		if (d.containsKeyAndNotNull(TiC.PROPERTY_TINT_COLOR)) {
			handleSetTintColor(TiConvert.toColor(d, TiC.PROPERTY_TINT_COLOR));
		}
		if (d.containsKeyAndNotNull(TiC.PROPERTY_TRACK_TINT_COLOR)) {
			handleSetTrackTintColor(TiConvert.toColor(d, TiC.PROPERTY_TRACK_TINT_COLOR));
		}
		updateRange();
		updateControl();
		updateRightDrawable();
	}

	private void updateRightDrawable()
	{
		if (rightClipDrawable != null) {
			SeekBar seekBar = (SeekBar) getNativeView();
			double percent = (double) seekBar.getProgress() / (double) seekBar.getMax();
			int level = 10000 - (int) Math.floor(percent * 10000);
			rightClipDrawable.setLevel(level);
		}
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
		offset = -min;
		scaleFactor = 100;
		int length = (int) Math.floor(Math.sqrt(Math.pow(max - min, 2)));
		if ((length > 0) && (Integer.MAX_VALUE / length < scaleFactor)) {
			scaleFactor = Integer.MAX_VALUE / length;
			scaleFactor = (scaleFactor == 0) ? 1 : scaleFactor;
		}
		length *= scaleFactor;
		SeekBar seekBar = (SeekBar) getNativeView();
		int curPos = (int) Math.floor(scaleFactor * (pos + offset));
		//On Android 4.0+ this will result in a callback to the listener. So set length after calculating position
		seekBar.setMax(length);
		seekBar.setProgress(curPos);
	}

	private void updateThumb(SeekBar seekBar, KrollDict d)
	{
		TiFileHelper tfh = null;
		String thumbImage = TiConvert.toString(d, "thumbImage");
		if (thumbImage != null) {
			if (tfh == null) {
				tfh = new TiFileHelper(seekBar.getContext());
			}
			String url = proxy.resolveUrl(null, thumbImage);
			Drawable thumb = tfh.loadDrawable(url, false);
			if (thumb != null) {
				thumbDrawable = new SoftReference<Drawable>(thumb);
				seekBar.setThumb(thumb);
			} else {
				Log.e(TAG, "Unable to locate thumb image for progress bar: " + url);
			}
		} else {
			seekBar.setThumb(null);
		}
	}

	private void updateTrackingImages(SeekBar seekBar, KrollDict d)
	{
		String leftImage = TiConvert.toString(d, "leftTrackImage");
		String rightImage = TiConvert.toString(d, "rightTrackImage");

		Drawable leftDrawable = null;
		Drawable rightDrawable = null;
		TiFileHelper tfh = new TiFileHelper(seekBar.getContext());

		if (leftImage != null) {
			String leftUrl = proxy.resolveUrl(null, leftImage);
			if (leftUrl != null) {
				leftDrawable = tfh.loadDrawable(leftUrl, false, true);
				if (leftDrawable == null) {
					Log.e(TAG, "Unable to locate left image for progress bar: " + leftUrl);
				}
			}
		}

		if (rightImage != null) {
			String rightUrl = proxy.resolveUrl(null, rightImage);
			if (rightUrl != null) {
				rightDrawable = tfh.loadDrawable(rightUrl, false, true);
				if (rightDrawable == null) {
					Log.e(TAG, "Unable to locate right image for progress bar: " + rightUrl);
				}
			}
		}

		if (leftDrawable != null || rightDrawable != null) {
			LayerDrawable ld = null;
			if (rightDrawable == null) {
				Drawable[] lda = { new ClipDrawable(leftDrawable, Gravity.LEFT, ClipDrawable.HORIZONTAL) };
				ld = new LayerDrawable(lda);
				ld.setId(0, android.R.id.progress);
			} else if (leftDrawable == null) {
				rightClipDrawable = new ClipDrawable(rightDrawable, Gravity.RIGHT, ClipDrawable.HORIZONTAL);
				Drawable[] lda = { rightClipDrawable };
				ld = new LayerDrawable(lda);
				ld.setId(0, android.R.id.secondaryProgress);
			} else {
				Drawable[] lda = {
					rightDrawable,
					new ClipDrawable(leftDrawable, Gravity.LEFT, ClipDrawable.HORIZONTAL)
				};
				ld = new LayerDrawable(lda);
				ld.setId(0, android.R.id.background);
				ld.setId(1, android.R.id.progress);
			}
			seekBar.setProgressDrawable(ld);
		} else {
			Log.w(TAG, "Custom tracking images could not be loaded.");
		}
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (Log.isDebugModeEnabled()) {
			Log.d(TAG, "Property: " + key + " old: " + oldValue + " new: " + newValue, Log.DEBUG_MODE);
		}

		SeekBar seekBar = (SeekBar) getNativeView();
		if (seekBar == null) {
			return;
		}

		if (key.equals(TiC.PROPERTY_VALUE)) {
			pos = TiConvert.toFloat(newValue);
			int curPos = (int) Math.floor(scaleFactor * (pos + offset));
			seekBar.setProgress(curPos);
			onProgressChanged(seekBar, curPos, true);
		} else if (key.equals("min")) {
			min = TiConvert.toInt(newValue);
			minRange = min;
			updateRange();
			if (pos < minRange) {
				pos = minRange;
			}
			updateControl();
			int curPos = (int) Math.floor(scaleFactor * (pos + offset));
			onProgressChanged(seekBar, curPos, true);
		} else if (key.equals("minRange")) {
			minRange = TiConvert.toInt(newValue);
			updateRange();
			if (pos < minRange) {
				pos = minRange;
			}
			updateControl();
			int curPos = (int) Math.floor(scaleFactor * (pos + offset));
			onProgressChanged(seekBar, curPos, true);
		} else if (key.equals("max")) {
			max = TiConvert.toInt(newValue);
			maxRange = max;
			updateRange();
			if (pos > maxRange) {
				pos = maxRange;
			}
			updateControl();
			int curPos = (int) Math.floor(scaleFactor * (pos + offset));
			onProgressChanged(seekBar, curPos, true);
		} else if (key.equals("maxRange")) {
			maxRange = TiConvert.toInt(newValue);
			updateRange();
			if (pos > maxRange) {
				pos = maxRange;
			}
			updateControl();
			int curPos = (int) Math.floor(scaleFactor * (pos + offset));
			onProgressChanged(seekBar, curPos, true);
		} else if (key.equals(TiC.PROPERTY_TINT_COLOR)) {
			String stringValue = TiConvert.toString(newValue);
			if (stringValue != null) {
				handleSetTintColor(TiConvert.toColor(stringValue));
			}
		} else if (key.equals(TiC.PROPERTY_TRACK_TINT_COLOR)) {
			String stringValue = TiConvert.toString(newValue);
			if (stringValue != null) {
				handleSetTrackTintColor(TiConvert.toColor(stringValue));
			}
		} else if (key.equals("thumbImage")) {
			//updateThumb(seekBar, proxy.getDynamicProperties());
			//seekBar.invalidate();
			Log.i(TAG, "Dynamically changing thumbImage is not yet supported. Native control doesn't draw");
		} else if (key.equals(TiC.PROPERTY_SPLIT_TRACK)) {
			if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
				seekBar.setSplitTrack(TiConvert.toBoolean(newValue));
			}
		} else if (key.equals("leftTrackImage") || key.equals("rightTrackImage")) {
			//updateTrackingImages(seekBar, proxy.getDynamicProperties());
			//seekBar.invalidate();
			String infoMessage
				= "Dynamically changing leftTrackImage or rightTrackImage is not yet supported. "
				+ "Native control doesn't draw.";
			Log.i(TAG, infoMessage);
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser)
	{
		pos = seekBar.getProgress() * 1.0f / scaleFactor;

		// Range check
		int actualMinRange = minRange + offset;
		int actualMaxRange = maxRange + offset;

		if (pos < actualMinRange) {
			seekBar.setProgress(actualMinRange * scaleFactor);
			pos = minRange;
		} else if (pos > actualMaxRange) {
			seekBar.setProgress(actualMaxRange * scaleFactor);
			pos = maxRange;
		}

		updateRightDrawable();

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
				offset.put(TiC.EVENT_PROPERTY_X, thumbBounds.left - seekBar.getThumbOffset());
				offset.put(TiC.EVENT_PROPERTY_Y, thumbBounds.top);
				size.put(TiC.PROPERTY_WIDTH, thumbBounds.width());
				size.put(TiC.PROPERTY_HEIGHT, thumbBounds.height());
			}
		}
		KrollDict data = new KrollDict();
		float scaledValue = scaledValue();
		Log.d(TAG,
			  "Progress " + seekBar.getProgress() + " ScaleFactor " + scaleFactor + " Calculated Position " + pos
				  + " ScaledValue " + scaledValue + " Min " + min + " Max" + max + " MinRange" + minRange + " MaxRange"
				  + maxRange,
			  Log.DEBUG_MODE);
		data.put(TiC.PROPERTY_VALUE, scaledValue);
		data.put(TiC.EVENT_PROPERTY_THUMB_OFFSET, offset);
		data.put(TiC.EVENT_PROPERTY_THUMB_SIZE, size);
		proxy.setProperty(TiC.PROPERTY_VALUE, scaledValue);

		fireEvent(TiC.EVENT_CHANGE, data);
	}

	public void onStartTrackingTouch(SeekBar seekBar)
	{
		KrollDict data = new KrollDict();
		data.put(TiC.PROPERTY_VALUE, scaledValue());
		fireEvent(TiC.EVENT_START, data, false);
	}

	public void onStopTrackingTouch(SeekBar seekBar)
	{
		KrollDict data = new KrollDict();
		data.put(TiC.PROPERTY_VALUE, scaledValue());
		fireEvent(TiC.EVENT_STOP, data, false);
	}

	protected void handleSetTintColor(int color)
	{
		SeekBar seekBar = (SeekBar) getNativeView();

		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
			ColorStateList singleColorStateList = ColorStateList.valueOf(color);
			seekBar.setProgressTintList(singleColorStateList);
		}
	}

	protected void handleSetTrackTintColor(int color)
	{
		SeekBar seekBar = (SeekBar) getNativeView();

		ColorStateList singleColorStateList = ColorStateList.valueOf(color);
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
			seekBar.setProgressBackgroundTintList(singleColorStateList);
		}
	}

	private float scaledValue()
	{
		return pos + min;
	}
}
