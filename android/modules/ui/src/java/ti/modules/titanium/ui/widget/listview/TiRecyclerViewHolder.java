/**
 * TiDev Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.listview;

import android.app.Activity;
import android.content.Context;
import android.content.res.ColorStateList;
import android.content.res.Resources;
import android.content.res.TypedArray;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.RippleDrawable;
import android.graphics.drawable.ShapeDrawable;
import android.graphics.drawable.StateListDrawable;
import android.graphics.drawable.shapes.Shape;
import android.os.Build;
import android.util.TypedValue;
import android.view.ViewGroup;

import androidx.core.graphics.ColorUtils;
import androidx.recyclerview.widget.RecyclerView;

import com.google.android.material.color.MaterialColors;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.R;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.util.TiUIHelper;

import java.lang.ref.WeakReference;

public abstract class TiRecyclerViewHolder<V extends TiViewProxy> extends RecyclerView.ViewHolder
{
	private static final String TAG = "TiRecyclerViewHolder";

	protected static final int COLOR_GRAY = Color.rgb(169, 169, 169);
	protected static int COLOR_NORMAL;
	protected static int COLOR_PRIMARY;
	protected static int COLOR_SELECTED;

	protected static Drawable checkDrawable;
	protected static Drawable disclosureDrawable;
	protected static Drawable dragDrawable;
	protected static Drawable moreDrawable;
	protected static Drawable checkcircleDrawable;
	protected static Drawable circleDrawable;

	protected static Resources resources;

	protected WeakReference<V> proxy;

	public TiRecyclerViewHolder(final Context context, final ViewGroup viewGroup)
	{
		super(viewGroup);

		COLOR_NORMAL = MaterialColors.getColor(context, R.attr.colorButtonNormal, Color.DKGRAY);
		COLOR_PRIMARY = MaterialColors.getColor(context, R.attr.colorPrimary, Color.DKGRAY);
		COLOR_SELECTED = ColorUtils.setAlphaComponent(COLOR_PRIMARY, 20);

		if (resources == null) {

			// Obtain resources instance.
			resources = context.getResources();
		}
		if (resources != null) {

			// Attempt to load `titanium_icon_more` drawable.
			if (moreDrawable == null) {
				try {
					final int icon_more_id = R.drawable.titanium_icon_more;
					moreDrawable = resources.getDrawable(icon_more_id);
				} catch (Exception e) {
					Log.w(TAG, "Drawable 'drawable.titanium_icon_more' not found.");
				}
			}

			// Attempt to load `titanium_icon_checkmark` drawable.
			if (checkDrawable == null) {
				try {
					final int icon_checkmark_id = R.drawable.titanium_icon_checkmark;
					checkDrawable = resources.getDrawable(icon_checkmark_id);
				} catch (Exception e) {
					Log.w(TAG, "Drawable 'drawable.titanium_icon_checkmark' not found.");
				}
			}

			// Attempt to load `titanium_icon_disclosure` drawable.
			if (disclosureDrawable == null) {
				try {
					final int icon_disclosure_id = R.drawable.titanium_icon_disclosure;
					disclosureDrawable = resources.getDrawable(icon_disclosure_id);
				} catch (Exception e) {
					Log.w(TAG, "Drawable 'drawable.titanium_icon_disclosure' not found.");
				}
			}

			// Attempt to load `titanium_icon_drag` drawable.
			if (dragDrawable == null) {
				try {
					final int icon_drag_id = R.drawable.titanium_icon_drag;
					dragDrawable = resources.getDrawable(icon_drag_id);
				} catch (Exception e) {
					Log.w(TAG, "Drawable 'drawable.titanium_icon_drag' not found.");
				}
			}

			// Attempt to load `titanium_icon_checkcircle` drawable.
			if (checkcircleDrawable == null) {
				try {
					final int icon_checkcircle_id = R.drawable.titanium_icon_checkcircle;
					checkcircleDrawable = resources.getDrawable(icon_checkcircle_id);
				} catch (Exception e) {
					Log.w(TAG, "Drawable 'drawable.titanium_icon_checkcircle' not found.");
				}
			}
			if (checkcircleDrawable != null) {

				// Always set tint color in case of dynamic theme change.
				checkcircleDrawable.setTint(COLOR_PRIMARY);
			}

			// Attempt to load `titanium_icon_circle` drawable.
			if (circleDrawable == null) {
				try {
					final int icon_circle_id = R.drawable.titanium_icon_circle;
					circleDrawable = resources.getDrawable(icon_circle_id);
				} catch (Exception e) {
					Log.w(TAG, "Drawable 'drawable.titanium_icon_circle' not found.");
				}
			}
			if (circleDrawable != null) {

				// Always set tint color in case of dynamic theme change.
				circleDrawable.setTint(COLOR_NORMAL);
			}
		} else {
			Log.w(TAG, "Could not obtain context resources instance.");
		}
	}

	/**
	 * Generate ripple effect drawable from specified drawable.
	 *
	 * @param drawable Drawable to apply ripple effect.
	 * @return Drawable
	 */
	protected Drawable generateRippleDrawable(Drawable drawable, String color)
	{
		final Activity activity = TiApplication.getAppCurrentActivity();

		if (drawable instanceof RippleDrawable) {
			drawable = ((RippleDrawable) drawable).getDrawable(0);
		}
		if (activity != null) {
			final int[][] rippleStates = new int[][] { new int[] {} };
			final TypedValue typedValue = new TypedValue();

			final TypedArray colorControlHighlight = activity.obtainStyledAttributes(
				typedValue.data, new int[] { android.R.attr.colorControlHighlight });
			final int colorControlHighlightInt = color != null && !color.isEmpty()
				? TiConvert.toColor(color, getProxy().getActivity()) : colorControlHighlight.getColor(0, 0);
			final int[] rippleColors = new int[] { colorControlHighlightInt };
			final ColorStateList colorStateList = new ColorStateList(rippleStates, rippleColors);
			final ShapeDrawable maskDrawable = drawable == null ? new ShapeDrawable() : null;

			// Create the RippleDrawable.
			drawable = new RippleDrawable(colorStateList, drawable, maskDrawable);
			colorControlHighlight.recycle();
		}

		return drawable;
	}

	/**
	 * Generate selected background from proxy properties.
	 *
	 * @param properties Dictionary containing selected background properties.
	 * @return Drawable
	 */
	protected Drawable generateSelectedDrawable(KrollDict properties, Drawable drawable)
	{
		final StateListDrawable stateDrawable = new StateListDrawable();

		if (properties.containsKeyAndNotNull(TiC.PROPERTY_BACKGROUND_SELECTED_COLOR)
			|| properties.containsKeyAndNotNull(TiC.PROPERTY_BACKGROUND_SELECTED_IMAGE)) {

			V proxy = getProxy();
			Activity activity = proxy != null ? proxy.getActivity() : null;
			final Drawable selectedBackgroundDrawable = TiUIHelper.buildBackgroundDrawable(
				properties.getString(TiC.PROPERTY_BACKGROUND_SELECTED_COLOR),
				properties.getString(TiC.PROPERTY_BACKGROUND_SELECTED_IMAGE),
				TiConvert.toBoolean(properties.get(TiC.PROPERTY_BACKGROUND_REPEAT), false),
				null, activity
			);

			stateDrawable.addState(new int[] { android.R.attr.state_activated }, selectedBackgroundDrawable);
		} else {
			stateDrawable.addState(new int[] { android.R.attr.state_activated }, new ColorDrawable(COLOR_SELECTED));
		}

		// NOTE: Android 7.1 and below require ShapeDrawable to have non-null Shape.
		// This bug is fixed on Android 8.0 and above.
		if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
			Drawable currentDrawable = drawable;

			if (currentDrawable instanceof RippleDrawable) {
				currentDrawable = ((RippleDrawable) currentDrawable).getDrawable(0);
			}
			if (currentDrawable instanceof ShapeDrawable) {
				final ShapeDrawable shapeDrawable = (ShapeDrawable) currentDrawable;

				if (shapeDrawable.getShape() == null) {
					shapeDrawable.setShape(new Shape()
					{
						@Override
						public void draw(Canvas canvas, Paint paint)
						{
							canvas.drawPaint(paint);
						}
					});
				}
			}
		}
		if (drawable != null) {
			stateDrawable.addState(new int[] {}, drawable);
		}

		return stateDrawable;
	}

	/**
	 * Get current proxy assigned to holder.
	 *
	 * @return TiViewProxy
	 */
	public V getProxy()
	{
		if (this.proxy != null) {
			return this.proxy.get();
		}
		return null;
	}

	public abstract void bind(V proxy, boolean selected);
}
