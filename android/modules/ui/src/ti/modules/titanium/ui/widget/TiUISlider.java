/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import java.lang.ref.SoftReference;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper;
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
	private int pos;
	private int offset;
	
	private SoftReference<Drawable> thumbDrawable;

	public TiUISlider(TiViewProxy proxy) {
		super(proxy);
		if (DBG) {
			Log.d(LCAT, "Creating a seekBar");
		}

		layoutParams.autoFillsWidth = true;

		this.min = 0;
		this.max = 0;
		this.pos = 0;

		SeekBar seekBar = new SeekBar(proxy.getContext());
		seekBar.setOnSeekBarChangeListener(this);
		setNativeView(seekBar);
	}


	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		SeekBar seekBar = (SeekBar) getNativeView();
		
		if (d.containsKey("value")) {
			pos = TiConvert.toInt(d, "value");
		}
		if (d.containsKey("min")) {
			min = TiConvert.toInt(d, "min");
		}
		if (d.containsKey("max")) {
			max = TiConvert.toInt(d, "max");;
		}
		
		if (d.containsKey("thumbImage")) {
			updateThumb(seekBar, d);
		}
		
		if (d.containsKey("leftTrackImage") && d.containsKey("rightTrackImage")) {
			updateTrackingImages(seekBar, d);
		}
		updateControl();
	}

	private void updateControl() {
		offset = -min;
		int length = (int) Math.floor(Math.sqrt(Math.pow(max - min, 2)));
		SeekBar seekBar = (SeekBar) getNativeView();
		seekBar.setMax(length);
		seekBar.setProgress(pos + offset);
	}

	private void updateThumb(SeekBar seekBar, KrollDict d) 
	{
		TiFileHelper tfh = null;
		String thumbImage = TiConvert.toString(d, "thumbImage");
		if (thumbImage != null) {
			if (tfh == null) {
				tfh = new TiFileHelper(seekBar.getContext());
			}
			String url = proxy.getTiContext().resolveUrl(null, thumbImage);
			Drawable thumb = tfh.loadDrawable(proxy.getTiContext(), url, false);
			thumbDrawable = new SoftReference<Drawable>(thumb);
			seekBar.setThumb(thumb);
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
			String leftUrl = proxy.getTiContext().resolveUrl(null, leftImage);
			String rightUrl = proxy.getTiContext().resolveUrl(null, rightImage);

			Drawable[] lda = {
				tfh.loadDrawable(proxy.getTiContext(), rightUrl, false, true),
				new ClipDrawable(tfh.loadDrawable(proxy.getTiContext(), leftUrl, false, true), Gravity.LEFT, ClipDrawable.HORIZONTAL)
			};
			LayerDrawable ld = new LayerDrawable(lda);
			ld.setId(0, android.R.id.background);
			ld.setId(1, android.R.id.progress);
			seekBar.setProgressDrawable(ld);
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
		if (key.equals("value")) {
			pos = TiConvert.toInt(newValue);
			seekBar.setProgress(pos + offset);
			onProgressChanged(seekBar, pos, true);
		} else if (key.equals("min")) {
			min = TiConvert.toInt(newValue);
			if (pos < min) {
				pos = min;
			}
			updateControl();
			onProgressChanged(seekBar, pos, true);
		} else if (key.equals("max")) {
			max = TiConvert.toInt(newValue);
			if (pos > max) {
				pos = max;
			}
			updateControl();
			onProgressChanged(seekBar, pos, true);
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
		pos = seekBar.getProgress();

		Drawable thumb = (thumbDrawable != null) ? thumbDrawable.get() : null;
		KrollDict offset = new KrollDict();
		offset.put("x", 0);
		offset.put("y", 0);
		KrollDict size = new KrollDict();
		size.put("width", 0);
		size.put("height", 0);
		if (thumb != null) {
			Rect thumbBounds = thumb.getBounds();
			if (thumbBounds != null) {
				offset.put("x", thumbBounds.left - seekBar.getThumbOffset());
				offset.put("y", thumbBounds.top);
				size.put("width", thumbBounds.width());
				size.put("height", thumbBounds.height());				
			}
		}
		KrollDict data = new KrollDict();
		data.put("value", scaledValue());
		data.put("thumbOffset", offset);
		data.put("thumbSize", size);
		proxy.setProperty("value", scaledValue(), false);

		proxy.fireEvent("change", data);
	}

	public void onStartTrackingTouch(SeekBar seekBar) {
	}

	public void onStopTrackingTouch(SeekBar seekBar) {
	}

	private int scaledValue() {
		return pos + min;
	}

}
