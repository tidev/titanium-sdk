/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.app.Activity;
import android.util.DisplayMetrics;
import android.view.Gravity;
import android.widget.LinearLayout;
import com.google.android.material.progressindicator.LinearProgressIndicator;
import com.google.android.material.textview.MaterialTextView;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.android.ProgressBarStyleModule;

public class TiUIProgressBar extends TiUIView
{
	private MaterialTextView label;
	private LinearProgressIndicator progress;
	private LinearLayout view;

	public TiUIProgressBar(final TiViewProxy proxy)
	{
		super(proxy);

		view = new LinearLayout(proxy.getActivity()) {
			@Override
			protected void onLayout(boolean changed, int left, int top, int right, int bottom)
			{
				super.onLayout(changed, left, top, right, bottom);
				TiUIHelper.firePostLayoutEvent(proxy);
			}
		};
		view.setOrientation(LinearLayout.VERTICAL);
		label = new MaterialTextView(proxy.getActivity());
		label.setGravity(Gravity.TOP | Gravity.START);
		label.setPadding(0, 0, 0, 4);
		label.setSingleLine(false);

		progress = new LinearProgressIndicator(proxy.getActivity());
		progress.setIndeterminate(false);
		progress.setMax(1000);

		view.addView(label);
		view.addView(progress);

		setNativeView(view);
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		Activity activity = proxy.getActivity();
		if (d.containsKey(TiC.PROPERTY_MESSAGE)) {
			handleSetMessage(TiConvert.toString(d, TiC.PROPERTY_MESSAGE));
		}
		if (d.containsKey(TiC.PROPERTY_COLOR)) {
			final int color = TiConvert.toColor(d, TiC.PROPERTY_COLOR, activity);
			handleSetMessageColor(color);
		}
		if (d.containsKey(TiC.PROPERTY_TINT_COLOR)) {
			this.progress.setIndicatorColor(TiConvert.toColor(d, TiC.PROPERTY_TINT_COLOR, activity));
		}
		if (d.containsKey(TiC.PROPERTY_TRACK_TINT_COLOR)) {
			this.progress.setTrackColor(TiConvert.toColor(d, TiC.PROPERTY_TRACK_TINT_COLOR, activity));
		}
		if (d.containsKey(TiC.PROPERTY_STYLE)) {
			handleSetStyle(TiConvert.toInt(d, TiC.PROPERTY_STYLE));
		}
		updateProgress();
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		super.propertyChanged(key, oldValue, newValue, proxy);

		if (key.equals(TiC.PROPERTY_VALUE) || key.equals("min") || key.equals("max")) {
			updateProgress();
		} else if (key.equals(TiC.PROPERTY_MESSAGE)) {
			String message = TiConvert.toString(newValue);
			if (message != null) {
				handleSetMessage(message);
			}
		} else if (key.equals(TiC.PROPERTY_COLOR)) {
			// TODO: reset to default value when property is null
			if (newValue != null) {
				handleSetMessageColor(TiConvert.toColor(newValue, proxy.getActivity()));
			}
		} else if (key.equals(TiC.PROPERTY_TINT_COLOR)) {
			// TODO: reset to default value when property is null
			this.progress.setIndicatorColor(TiConvert.toColor(newValue, proxy.getActivity()));
		} else if (key.equals(TiC.PROPERTY_TRACK_TINT_COLOR)) {
			// TODO: reset to default value when property is null
			this.progress.setTrackColor(TiConvert.toColor(newValue, proxy.getActivity()));
		} else if (key.equals(TiC.PROPERTY_STYLE)) {
			handleSetStyle(TiConvert.toInt(newValue));
		} else if (key.equals(TiC.PROPERTY_ANIMATED)) {
			handleSetStyle(TiConvert.toInt(proxy.getProperty(TiC.PROPERTY_STYLE)));
		}
	}

	private double getMin()
	{
		Object value = proxy.getProperty("min");
		if (value == null) {
			return 0;
		}

		return TiConvert.toDouble(value);
	}

	private double getMax()
	{
		Object value = proxy.getProperty("max");
		if (value == null) {
			return 0;
		}

		return TiConvert.toDouble(value);
	}

	private double getValue()
	{
		Object value = proxy.getProperty(TiC.PROPERTY_VALUE);
		if (value == null) {
			return 0;
		}

		return TiConvert.toDouble(value);
	}

	private int convertRange(double min, double max, double value, int base)
	{
		return (int) Math.floor((value / (max - min)) * base);
	}

	public void updateProgress()
	{
		boolean isAnimated = TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_ANIMATED), true);
		progress.setProgressCompat(convertRange(getMin(), getMax(), getValue(), 1000), isAnimated);
	}

	public void handleSetMessage(String message)
	{
		label.setText(message);
		label.requestLayout();
	}

	protected void handleSetMessageColor(int color)
	{
		label.setTextColor(color);
	}

	private void handleSetStyle(int style)
	{
		boolean isAnimated = TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_ANIMATED), true);

		if (style == ProgressBarStyleModule.WAVY) {
			DisplayMetrics dm = proxy.getActivity().getResources().getDisplayMetrics();
			int amplitudeDp = 3;
			int wavelengthDp = 16;
			int speedDp = isAnimated ? 1 : 0;
			progress.setWaveAmplitude((int) (amplitudeDp * dm.density + 0.5f));
			progress.setWavelength((int) (wavelengthDp * dm.density + 0.5f));
			progress.setWaveSpeed((int) (speedDp * dm.density + 0.5f));
		} else {
			progress.setWaveAmplitude(0);
			progress.setWavelength(0);
			progress.setWaveSpeed(0);
		}
	}
}
