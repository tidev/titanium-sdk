/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.view;

import java.lang.reflect.Field;

import org.appcelerator.kroll.common.Log;

import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.LayerDrawable;
import android.graphics.drawable.ShapeDrawable;
import android.view.View;
import android.view.ViewParent;

/**
 * Enables getting the background color of a view. (There is no
 * View.getBackgroundColor in Android.) By providing a getter and setter for
 * backgroundColor, instances of this class can be used with ObjectAnimator to
 * animation "backgroundColor" from its current value.
 */
public class TiBackgroundColorWrapper
{
	private static final String TAG = TiBackgroundColorWrapper.class.getSimpleName();

	private static final String COLOR_DRAWABLE_STATE_VAR = "mState";
	private static final String COLOR_DRAWABLE_USE_COLOR_VAR = "mUseColor";
	private static final String ERR_BACKGROUND_COLOR = "Unable to determine the current background color."
													   + " Transparent will be returned as the color value.";

	// ColorDrawable reflection
	private static Field cdBackgroundStateField = null;
	private static Field cdBackgroundStateColorField = null;
	private static boolean cdBackgroundReflectionReady = false;

	private final View view;

	public TiBackgroundColorWrapper(View view)
	{
		this.view = view;
	}

	public static TiBackgroundColorWrapper wrap(View v)
	{
		return new TiBackgroundColorWrapper(v);
	}

	/**
	 * Return the view's background drawable or, if it doesn't have one, the
	 * first background drawable found while checking its parent and ancestors.
	 *
	 * @param view
	 *            View whose background or whose ancestor's backgrounds to
	 *            check.
	 * @return View's background drawable, or that of one of its ancestors.
	 */
	private Drawable findNearestBackgroundDrawable(View view)
	{
		Drawable backgroundDrawable = null;
		View checkView = view;
		while (backgroundDrawable == null && checkView != null) {

			backgroundDrawable = checkView.getBackground();
			if (backgroundDrawable != null) {

				// Retrieves the real drawable currently used, for things
				// like StateListDrawable or ScaleDrawable.
				backgroundDrawable = backgroundDrawable.getCurrent();
				if (backgroundDrawable instanceof LayerDrawable) {
					LayerDrawable layerDrawable = (LayerDrawable) backgroundDrawable;

					int layerCount = layerDrawable.getNumberOfLayers();
					if (layerCount > 0) {
						backgroundDrawable = layerDrawable.getDrawable(layerCount - 1);
						if (backgroundDrawable != null) {
							backgroundDrawable = backgroundDrawable.getCurrent();
						}
					}
				}
			}

			if (backgroundDrawable == null) {
				ViewParent parent = checkView.getParent();
				checkView = null;
				if (parent instanceof View) {
					checkView = (View) parent;
				}
			}
		}

		return backgroundDrawable;
	}

	public int getBackgroundColor()
	{
		if (view == null) {
			Log.w(TAG,
				  "View was not set. Unable to determine the current background color. Returning Color.TRANSPARENT.");
			return Color.TRANSPARENT;
		}

		Drawable backgroundDrawable = findNearestBackgroundDrawable(view);

		if (backgroundDrawable == null) {
			Log.w(TAG, ERR_BACKGROUND_COLOR);
			return Color.TRANSPARENT;
		}

		if (backgroundDrawable instanceof ColorDrawable) {
			return ((ColorDrawable) backgroundDrawable).getColor();
		}

		if (backgroundDrawable instanceof TiGradientDrawable) {
			int[] gradientColors = ((TiGradientDrawable) backgroundDrawable).getColors();

			if (gradientColors.length > 0) {
				// Just choose the last color. Better way?
				return gradientColors[gradientColors.length - 1];
			} else {
				Log.w(TAG, ERR_BACKGROUND_COLOR);
				return Color.TRANSPARENT;
			}
		}

		if (backgroundDrawable instanceof ShapeDrawable) {
			Paint paint = ((ShapeDrawable) backgroundDrawable).getPaint();
			if (paint != null) {
				return paint.getColor();
			}
		}

		Log.w(TAG, ERR_BACKGROUND_COLOR);
		return Color.TRANSPARENT;
	}

	private void initColorDrawableReflection(ColorDrawable colorDrawable)
	{
		cdBackgroundReflectionReady = true;

		Class<ColorDrawable> cdClass = ColorDrawable.class;

		try {
			cdBackgroundStateField = cdClass.getDeclaredField(COLOR_DRAWABLE_STATE_VAR);
			cdBackgroundStateField.setAccessible(true);
		} catch (Exception e) {
			Log.e(TAG, "Reflection failed while trying to determine background color of view.", e);
			cdBackgroundStateField = null;
			return;
		}

		try {
			cdBackgroundStateColorField =
				cdBackgroundStateField.getType().getDeclaredField(COLOR_DRAWABLE_USE_COLOR_VAR);
			cdBackgroundStateColorField.setAccessible(true);
		} catch (Exception e) {
			Log.e(TAG, "Reflection failed while trying to determine background color of view.", e);
			cdBackgroundStateColorField = null;
		}
	}

	public void setBackgroundColor(int value)
	{
		if (view == null) {
			Log.w(TAG, "Wrapped view is null. Cannot set background color.");
			return;
		}
		view.setBackgroundColor(value);
	}
}
