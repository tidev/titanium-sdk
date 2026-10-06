/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.app.Activity;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import com.google.android.material.progressindicator.BaseProgressIndicator;
import com.google.android.material.progressindicator.CircularProgressIndicator;
import com.google.android.material.progressindicator.LinearProgressIndicator;
import com.google.android.material.textview.MaterialTextView;
import java.util.HashMap;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

public class TiUIProgressBar extends TiUIView
{
	private static final String TYPE_LINEAR = "linear";
	private static final String TYPE_CIRCLE = "circle";

	private MaterialTextView label;
	private BaseProgressIndicator<?> progress;
	private LinearLayout view;
	private int defaultStopIndicatorSize;
	private int defaultIndicatorSize;

	public TiUIProgressBar(final TiViewProxy proxy)
	{
		super(proxy);

		view = new LinearLayout(proxy.getActivity()) {
			@Override
			protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
			{
				if (progress instanceof CircularProgressIndicator) {
					// Let the circle fill the fixed width/height of the view. Keep the default size otherwise.
					int size = defaultIndicatorSize;
					boolean hasWidth = MeasureSpec.getMode(widthMeasureSpec) == MeasureSpec.EXACTLY;
					boolean hasHeight = MeasureSpec.getMode(heightMeasureSpec) == MeasureSpec.EXACTLY;
					if (hasWidth) {
						size = MeasureSpec.getSize(widthMeasureSpec) - getPaddingLeft() - getPaddingRight();
					}
					if (hasHeight) {
						int height = MeasureSpec.getSize(heightMeasureSpec) - getPaddingTop() - getPaddingBottom();
						if (label.getVisibility() != View.GONE) {
							measureChild(label, widthMeasureSpec,
								MeasureSpec.makeMeasureSpec(0, MeasureSpec.UNSPECIFIED));
							height -= label.getMeasuredHeight();
						}
						size = hasWidth ? Math.min(size, height) : height;
					}
					((CircularProgressIndicator) progress).setIndicatorSize(Math.max(size, 0));
				}
				super.onMeasure(widthMeasureSpec, heightMeasureSpec);
			}

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

		String type = TiConvert.toString(proxy.getProperty(TiC.PROPERTY_TYPE), TYPE_LINEAR);
		if (TYPE_CIRCLE.equals(type)) {
			CircularProgressIndicator circularProgress = new CircularProgressIndicator(proxy.getActivity());
			circularProgress.setIndicatorInset(0);
			defaultIndicatorSize = circularProgress.getIndicatorSize();
			progress = circularProgress;
			view.setGravity(Gravity.CENTER);
			// An empty message must not take space above the circle.
			label.setVisibility(View.GONE);
		} else {
			LinearProgressIndicator linearProgress = new LinearProgressIndicator(proxy.getActivity());
			defaultStopIndicatorSize = linearProgress.getTrackStopIndicatorSize();
			progress = linearProgress;
		}
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
		// Apply the track thickness before the stop indicator since Material clamps
		// the stop indicator size to the track thickness when it is set.
		if (d.containsKey(TiC.PROPERTY_TRACK_THICKNESS)) {
			handleSetTrackThickness(d.get(TiC.PROPERTY_TRACK_THICKNESS));
		}
		if (d.containsKey(TiC.PROPERTY_TRACK_RADIUS)) {
			handleSetTrackRadius(d.get(TiC.PROPERTY_TRACK_RADIUS));
		}
		if (d.containsKey(TiC.PROPERTY_STOP_INDICATOR)) {
			handleSetStopIndicator(d.get(TiC.PROPERTY_STOP_INDICATOR));
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
		} else if (key.equals(TiC.PROPERTY_TRACK_THICKNESS)) {
			handleSetTrackThickness(newValue);
			// Re-apply the corner radius and the stop indicator so both are re-clamped to the new thickness.
			if (proxy.hasPropertyAndNotNull(TiC.PROPERTY_TRACK_RADIUS)) {
				handleSetTrackRadius(proxy.getProperty(TiC.PROPERTY_TRACK_RADIUS));
			}
			handleSetStopIndicator(proxy.getProperty(TiC.PROPERTY_STOP_INDICATOR));
		} else if (key.equals(TiC.PROPERTY_TRACK_RADIUS)) {
			handleSetTrackRadius(newValue);
		} else if (key.equals(TiC.PROPERTY_STOP_INDICATOR)) {
			handleSetStopIndicator(newValue);
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
		if (max <= min) {
			return 0;
		}
		double fraction = (value - min) / (max - min);
		return (int) Math.floor(Math.max(0.0, Math.min(1.0, fraction)) * base);
	}

	public void updateProgress()
	{
		boolean isAnimated = TiConvert.toBoolean(proxy.getProperty(TiC.PROPERTY_ANIMATED), true);
		progress.setProgressCompat(convertRange(getMin(), getMax(), getValue(), 1000), isAnimated);
	}

	public void handleSetMessage(String message)
	{
		label.setText(message);
		if (progress instanceof CircularProgressIndicator) {
			label.setVisibility(message == null || message.isEmpty() ? View.GONE : View.VISIBLE);
		}
		label.requestLayout();
	}

	protected void handleSetMessageColor(int color)
	{
		label.setTextColor(color);
	}

	private void handleSetStopIndicator(Object value)
	{
		// Only the linear indicator has a stop indicator.
		if (!(progress instanceof LinearProgressIndicator)) {
			return;
		}

		boolean enabled;
		int size = defaultStopIndicatorSize;
		if (value instanceof HashMap) {
			KrollDict options = new KrollDict((HashMap<String, Object>) value);
			enabled = TiConvert.toBoolean(options, TiC.PROPERTY_ENABLED, true);
			if (options.containsKeyAndNotNull(TiC.PROPERTY_SIZE)) {
				TiDimension dimension =
					TiConvert.toTiDimension(options.get(TiC.PROPERTY_SIZE), TiDimension.TYPE_WIDTH);
				if (dimension != null) {
					size = dimension.getAsPixels(progress);
				}
			}
		} else {
			enabled = TiConvert.toBoolean(value, true);
		}
		((LinearProgressIndicator) progress).setTrackStopIndicatorSize(enabled ? size : 0);
	}

	private void handleSetTrackThickness(Object value)
	{
		TiDimension dimension = TiConvert.toTiDimension(value, TiDimension.TYPE_HEIGHT);
		if (dimension != null) {
			progress.setTrackThickness(dimension.getAsPixels(progress));
		}
	}

	private void handleSetTrackRadius(Object value)
	{
		TiDimension dimension = TiConvert.toTiDimension(value, TiDimension.TYPE_HEIGHT);
		if (dimension != null) {
			progress.setTrackCornerRadius(dimension.getAsPixels(progress));
		}
	}
}
