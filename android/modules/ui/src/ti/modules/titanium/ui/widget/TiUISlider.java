/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.view.TiUIView;

import android.graphics.Color;
import android.graphics.drawable.ClipDrawable;
import android.graphics.drawable.ColorDrawable;
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
	public void processProperties(TiDict d)
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
		TiFileHelper tfh = null;
		
		if (d.containsKey("thumbImage")) {
			String url = proxy.getTiContext().resolveUrl(null, TiConvert.toString(d, "thumbImage"));
			if (url != null) {
				if (tfh == null) {
					tfh = new TiFileHelper(seekBar.getContext());
				}
			}
			Drawable thumb = tfh.loadDrawable(url, false);
			seekBar.setThumb(thumb);
			Drawable[] lda = {
				new ClipDrawable(new ColorDrawable(Color.RED), Gravity.LEFT, ClipDrawable.HORIZONTAL),
				tfh.loadDrawable(url, false)
			};
			LayerDrawable ld = new LayerDrawable(lda);
			ld.setId(0, android.R.id.progress);
			ld.setId(1, android.R.id.background);
			seekBar.setProgressDrawable(ld);
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

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, TiProxy proxy)
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
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
		pos = seekBar.getProgress();
		TiDict data = new TiDict();
		data.put("value", scaledValue());
		proxy.internalSetDynamicValue("value", scaledValue(), false);
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
