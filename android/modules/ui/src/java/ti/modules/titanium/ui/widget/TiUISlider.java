/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import java.lang.ref.SoftReference;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.kroll.common.TiConfig;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import android.graphics.Rect;
import android.graphics.drawable.ClipDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.view.Gravity;
import android.widget.SeekBar;

public class TiUISlider extends TiUIView
	implements SeekBar.OnSeekBarChangeListener
{
	private static final String LCAT = "TiUISlider";
	private static final boolean DBG = TiConfig.LOGD;

	private int min;
	private int max;
	private float pos;
	private int offset;
	private int minRange;
	private int maxRange;
	private int scaleFactor;
	
	private SoftReference<Drawable> thumbDrawable;

	public TiUISlider(final TiViewProxy proxy)
	{
		super(proxy);
		if (DBG) {
			Log.d(LCAT, "Creating a seekBar");
		}

		layoutParams.autoFillsWidth = true;

		this.min = 0;
		this.max = 1;
		this.pos = 0;
		
		SeekBar seekBar = new SeekBar(proxy.getActivity())
		{
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
			pos = TiConvert.toFloat(d, TiC.PROPERTY_VALUE);
		}
		if (d.containsKey("min")) {
			min = TiConvert.toInt(d, "min");
		}
		if (d.containsKey("max")) {
			max = TiConvert.toInt(d, "max");;
		}
		if (d.containsKey("minRange")) {
			minRange = TiConvert.toInt(d, "minRange");
		} else {
			minRange = min;
		}
		if (d.containsKey("maxRange")) {
			maxRange = TiConvert.toInt(d, "maxRange");
		} else {
			maxRange = max;
		}
		
		if (d.containsKey("thumbImage")) {
			updateThumb(seekBar, d);
		}
		
		if (d.containsKey("leftTrackImage") && d.containsKey("rightTrackImage")) {
			updateTrackingImages(seekBar, d);
		}
		updateRange();
		updateControl();
	}

	private void updateRange() {
		minRange = Math.max(minRange, min);
		minRange = Math.min(minRange, max);
		proxy.setProperty("minRange", minRange, false);
		
		maxRange = Math.min(maxRange, max);
		maxRange = Math.max(maxRange, minRange);
		proxy.setProperty("maxRange", maxRange, false);
	}
	
	private void updateControl() {
		offset = -min;
		scaleFactor = 100;
		int length = (int) Math.floor(Math.sqrt(Math.pow(max - min, 2)));
		if ( (length > 0) && (Integer.MAX_VALUE/length < scaleFactor) ) {
			scaleFactor = Integer.MAX_VALUE/length;
			scaleFactor = (scaleFactor == 0) ? 1 : scaleFactor;
		}
		length *= scaleFactor;
		SeekBar seekBar = (SeekBar) getNativeView();
		seekBar.setMax(length);
		int curPos = (int)Math.floor(scaleFactor* (pos + offset));
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
				Log.e(LCAT, "Unable to locate thumb image for progress bar: " + url);
			}
		} else {
			seekBar.setThumb(null);
		}
	}
	
	private void updateTrackingImages(SeekBar seekBar, KrollDict d) 
	{
		TiFileHelper tfh = null;
		String leftImage =  TiConvert.toString(d, "leftTrackImage");
		String rightImage = TiConvert.toString(d, "rightTrackImage");
		if (leftImage != null && rightImage != null) {
			if (tfh == null) {
				tfh = new TiFileHelper(seekBar.getContext());
			}
			String leftUrl = proxy.resolveUrl(null, leftImage);
			String rightUrl = proxy.resolveUrl(null, rightImage);

			Drawable rightDrawable = tfh.loadDrawable(rightUrl, false, true);
			Drawable leftDrawable = tfh.loadDrawable(leftUrl, false, true);
			if (rightDrawable != null && leftDrawable != null) {
				Drawable[] lda = {
					rightDrawable,
					new ClipDrawable(leftDrawable, Gravity.LEFT, ClipDrawable.HORIZONTAL)
				};
				LayerDrawable ld = new LayerDrawable(lda);
				ld.setId(0, android.R.id.background);
				ld.setId(1, android.R.id.progress);
				seekBar.setProgressDrawable(ld);
			} else {
				if (leftDrawable == null) {
					Log.e(LCAT, "Unable to locate left image for progress bar: " + leftUrl);
				}
				if (rightDrawable == null) {
					Log.e(LCAT, "Unable to locate right image for progress bar: " + rightUrl);
				}
				// release
				leftDrawable = null;
				rightDrawable = null;
			}
		} else if (leftImage == null && rightImage == null) {
			seekBar.setProgressDrawable(null);
		} else {
			Log.w(LCAT, "Custom tracking images must both be set before they'll be drawn.");
		}
	}
	
	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (DBG) {
			Log.d(LCAT, "Property: " + key + " old: " + oldValue + " new: " + newValue);
		}
		SeekBar seekBar = (SeekBar) getNativeView();
		if (key.equals(TiC.PROPERTY_VALUE)) {
			pos = TiConvert.toFloat(newValue);
			int curPos = (int)Math.floor(scaleFactor* (pos + offset));
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
			int curPos = (int)Math.floor(scaleFactor* (pos + offset));
			onProgressChanged(seekBar, curPos, true);
		} else if (key.equals("minRange")) {
			minRange = TiConvert.toInt(newValue);
			updateRange();
			if (pos < minRange) {
				pos = minRange;
			}
			updateControl();
			int curPos = (int)Math.floor(scaleFactor* (pos + offset));
			onProgressChanged(seekBar, curPos, true);
		} else if (key.equals("max")) {
			max = TiConvert.toInt(newValue);
			maxRange = max;
			updateRange();
			if (pos > maxRange) {
				pos = maxRange;
			}
			updateControl();
			int curPos = (int)Math.floor(scaleFactor* (pos + offset));
			onProgressChanged(seekBar, curPos, true);
		} else if (key.equals("maxRange")) {
			maxRange = TiConvert.toInt(newValue);
			updateRange();
			if (pos > maxRange) {
				pos = maxRange;
			}
			updateControl();
			int curPos = (int)Math.floor(scaleFactor* (pos + offset));
			onProgressChanged(seekBar, curPos, true);
		} else if (key.equals("thumbImage")) {
			//updateThumb(seekBar, proxy.getDynamicProperties());
			//seekBar.invalidate();
			Log.i(LCAT, "Dynamically changing thumbImage is not yet supported. Native control doesn't draw");
		} else if (key.equals("leftTrackImage") || key.equals("rightTrackImage")) {
			//updateTrackingImages(seekBar, proxy.getDynamicProperties());
			//seekBar.invalidate();
			Log.i(LCAT, "Dynamically changing leftTrackImage or rightTrackImage is not yet supported. Native control doesn't draw");
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
		pos = seekBar.getProgress()*1.0f/scaleFactor;
		
		// Range check
		int actualMinRange = minRange + offset;
		int actualMaxRange = maxRange + offset;
		
		if (pos < actualMinRange) {
			seekBar.setProgress(actualMinRange*scaleFactor);
			pos = minRange;
		} else if (pos > actualMaxRange) {
			seekBar.setProgress(actualMaxRange*scaleFactor);
			pos = maxRange;
		}
		
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
		if (DBG) {
			Log.d(LCAT,"Progress "+seekBar.getProgress()+" ScaleFactor "+scaleFactor+" Calculated Position "+pos+" ScaledValue "+scaledValue+" Min "+min+" Max"+max+" MinRange"+minRange+" MaxRange"+maxRange);
		}
		data.put(TiC.PROPERTY_VALUE, scaledValue);
		data.put(TiC.EVENT_PROPERTY_THUMB_OFFSET, offset);
		data.put(TiC.EVENT_PROPERTY_THUMB_SIZE, size);
		proxy.setProperty(TiC.PROPERTY_VALUE, scaledValue, false);

		proxy.fireEvent(TiC.EVENT_CHANGE, data);
	}

	public void onStartTrackingTouch(SeekBar seekBar) {
	}

	public void onStopTrackingTouch(SeekBar seekBar) {
		KrollDict data = new KrollDict();
		data.put(TiC.PROPERTY_VALUE, scaledValue());
		proxy.fireEvent(TiC.EVENT_STOP, data);
	}

	private float scaledValue() {
		return pos + min;
	}

}
