/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import android.content.res.TypedArray;
import android.graphics.Color;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffColorFilter;
import android.view.Gravity;
import android.view.View;
import android.widget.LinearLayout;
import androidx.appcompat.view.ContextThemeWrapper;
import com.google.android.material.progressindicator.CircularProgressIndicator;
import com.google.android.material.textview.MaterialTextView;
import java.util.HashMap;
import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.R;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiUIView;

public class TiUIActivityIndicator extends TiUIView
{
	private static final String TAG = "TiUIActivityIndicator";

	public static final int PLAIN = 0;
	public static final int BIG = 1;
	public static final int DARK = 2;
	public static final int BIG_DARK = 3;

	private boolean visible;
	private MaterialTextView label;
	private CircularProgressIndicator progress;
	private final int defaultTextColor;

	public TiUIActivityIndicator(TiViewProxy proxy)
	{
		super(proxy);
		Log.d(TAG, "Creating an activity indicator", Log.DEBUG_MODE);

		LinearLayout view = new LinearLayout(proxy.getActivity());
		view.setOrientation(LinearLayout.HORIZONTAL);
		view.setGravity(Gravity.CENTER);
		view.setVisibility(View.INVISIBLE);
		this.visible = false;

		this.progress = new CircularProgressIndicator(proxy.getActivity());
		this.progress.setIndeterminate(true);
		view.addView(this.progress);

		this.label = new MaterialTextView(proxy.getActivity());
		this.label.setGravity(Gravity.CENTER_VERTICAL | Gravity.START);
		this.label.setPadding(0, 0, 0, 0);
		this.label.setSingleLine(false);
		view.addView(this.label);

		setNativeView(view);
		this.defaultTextColor = this.label.getCurrentTextColor();
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		LinearLayout view = (LinearLayout) getNativeView();
		if (view == null) {
			return;
		}

		if (d.containsKey(TiC.PROPERTY_FONT)) {
			TiUIHelper.styleText(label, d.getKrollDict(TiC.PROPERTY_FONT));
		}
		if (d.containsKey(TiC.PROPERTY_MESSAGE)) {
			label.setText(TiConvert.toString(d, TiC.PROPERTY_MESSAGE));
		}
		if (d.containsKey(TiC.PROPERTY_COLOR)) {
			label.setTextColor(TiConvert.toColor(d, TiC.PROPERTY_COLOR, proxy.getActivity()));
		}
		updateIndicator();

		view.invalidate();
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		Log.d(TAG, "Property: " + key + " old: " + oldValue + " new: " + newValue, Log.DEBUG_MODE);

		if (key.equals(TiC.PROPERTY_STYLE)) {
			updateIndicator();
		} else if (key.equals(TiC.PROPERTY_FONT) && newValue instanceof HashMap) {
			TiUIHelper.styleText(label, (HashMap) newValue);
			label.requestLayout();
		} else if (key.equals(TiC.PROPERTY_MESSAGE)) {
			label.setText(TiConvert.toString(newValue));
			label.requestLayout();
		} else if (key.equals(TiC.PROPERTY_COLOR)) {
			if (newValue == null) {
				label.setTextColor(defaultTextColor);
			} else {
				label.setTextColor(TiConvert.toColor(newValue, proxy.getActivity()));
			}
		} else if (key.equals(TiC.PROPERTY_INDICATOR_COLOR)) {
			updateIndicator();
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	@Override
	public void show()
	{
		if (visible) {
			return;
		}
		super.show();
		visible = true;
	}

	@Override
	public void hide()
	{
		if (!visible) {
			return;
		}
		super.hide();
		visible = false;
	}

	private void updateIndicator()
	{
		// Do not continue if proxy has been released.
		if (this.proxy == null) {
			return;
		}

		// Fetch assigned style ID.
		int styleId = TiConvert.toInt(this.proxy.getProperty(TiC.PROPERTY_STYLE), PLAIN);
		if ((styleId != PLAIN) && (styleId != BIG) && (styleId != DARK) && (styleId != BIG_DARK)) {
			Log.w(TAG, "Invalid value \"" + styleId + "\" for style.");
			styleId = PLAIN;
		}

		// Update indicator to use a big or small style.
		int[] idArray = new int[] {
			R.attr.trackThickness,
			R.attr.indicatorSize,
			R.attr.indicatorInset
		};
		int themeId = R.style.Widget_MaterialComponents_CircularProgressIndicator_ExtraSmall;
		if ((styleId == BIG) || (styleId == BIG_DARK)) {
			themeId = R.style.Widget_MaterialComponents_CircularProgressIndicator_Medium;
		}
		ContextThemeWrapper context = new ContextThemeWrapper(this.progress.getContext(), themeId);
		TypedArray typedArray = context.obtainStyledAttributes(null, idArray, 0, 0);
		int value = typedArray.getDimensionPixelSize(0, this.progress.getTrackThickness());
		this.progress.setTrackThickness(typedArray.getDimensionPixelSize(0, this.progress.getTrackThickness()));
		this.progress.setIndicatorSize(typedArray.getDimensionPixelSize(1, this.progress.getIndicatorSize()));
		this.progress.setIndicatorInset(typedArray.getDimensionPixelSize(2, this.progress.getIndicatorInset()));
		typedArray.recycle();

		// Update indicator's color.
		if (this.proxy.hasPropertyAndNotNull(TiC.PROPERTY_INDICATOR_COLOR)) {
			int color = TiConvert.toColor(proxy.getProperty(TiC.PROPERTY_INDICATOR_COLOR), proxy.getActivity());
			this.progress.getIndeterminateDrawable().setColorFilter(
				new PorterDuffColorFilter(color, PorterDuff.Mode.SRC_IN));
		} else if ((styleId == DARK) || (styleId == BIG_DARK)) {
			this.progress.getIndeterminateDrawable().setColorFilter(
				new PorterDuffColorFilter(Color.DKGRAY, PorterDuff.Mode.SRC_IN));
		} else {
			this.progress.getIndeterminateDrawable().clearColorFilter();
		}
	}
}
