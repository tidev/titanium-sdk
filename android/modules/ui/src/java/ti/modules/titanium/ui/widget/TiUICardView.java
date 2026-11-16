/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiDimension;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutArrangement;

import android.content.Context;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import androidx.annotation.NonNull;
import com.google.android.material.card.MaterialCardView;
import com.google.android.material.shape.CornerFamily;

public class TiUICardView extends TiUIView
{
	private ColorStateList defaultRippleColorSateList;
	private int paddingLeft, paddingTop, paddingRight, paddingBottom;

	private static final String TAG = "TiUICardView";

	public class TiUICardViewLayout extends TiCompositeLayout
	{
		public TiUICardViewLayout(Context context, LayoutArrangement arrangement)
		{
			super(context, arrangement, proxy);
		}
	}

	public class TiCardView extends MaterialCardView
	{
		private TiUICardViewLayout layout;

		public TiCardView(Context context, LayoutArrangement arrangement)
		{
			super(context);

			layout = new TiUICardViewLayout(context, arrangement);
			FrameLayout.LayoutParams params =
				new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
			layout.setLayoutParams(params);
			super.addView(layout, params);
		}

		public TiUICardViewLayout getLayout()
		{
			return layout;
		}

		@Override
		public void addView(View child, android.view.ViewGroup.LayoutParams params)
		{
			layout.addView(child, params);
		}

		@Override
		public void setBackgroundColor(int color)
		{
			setCardBackgroundColor(color);
		}

		@Override
		protected void onLayout(boolean changed, int left, int top, int right, int bottom)
		{
			super.onLayout(changed, left, top, right, bottom);
			if (proxy != null && proxy.hasListeners(TiC.EVENT_POST_LAYOUT)) {
				proxy.fireEvent(TiC.EVENT_POST_LAYOUT, null, false);
			}
		}
	}

	public TiUICardView(final TiViewProxy proxy)
	{
		super(proxy);

		LayoutArrangement arrangement = LayoutArrangement.DEFAULT;
		Object layoutValue = proxy.getProperty(TiC.PROPERTY_LAYOUT);
		if (TiC.LAYOUT_VERTICAL.equals(layoutValue)) {
			arrangement = LayoutArrangement.VERTICAL;
		} else if (TiC.LAYOUT_HORIZONTAL.equals(layoutValue)) {
			arrangement = LayoutArrangement.HORIZONTAL;
		}

		TiCardView cardView = new TiCardView(proxy.getActivity(), arrangement);
		cardView.setPadding(0, 0, 0, 0);
		cardView.setFocusable(false);
		this.defaultRippleColorSateList = cardView.getRippleColor();

		setNativeView(cardView);
	}

	public TiUICardViewLayout getLayout()
	{
		View nativeView = getNativeView();
		if (nativeView != null) {
			return ((TiCardView) nativeView).layout;
		}
		return null;
	}

	@Override
	public void add(TiUIView child)
	{
		super.add(child);

		if (getNativeView() != null) {
			getLayout().requestLayout();
			if (child.getNativeView() != null) {
				child.getNativeView().requestLayout();
			}
		}
	}

	@Override
	public void remove(TiUIView child)
	{
		if (child != null) {
			View cv = child.getOuterView();
			if (cv != null) {
				View nv = getLayout();
				if (nv instanceof ViewGroup) {
					((ViewGroup) nv).removeView(cv);
					children.remove(child);
					child.setParent(null);
				}
			}
		}
	}

	@Override
	public void resort()
	{
		View v = getLayout();
		if (v instanceof TiCompositeLayout) {
			((TiCompositeLayout) v).resort();
		}
	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		TiCardView cardview = (TiCardView) getNativeView();
		if (cardview == null) {
			return;
		}

		if (d.containsKey(TiC.PROPERTY_BORDER_COLOR)) {
			cardview.setStrokeColor(TiConvert.toColor(d, TiC.PROPERTY_BORDER_COLOR, proxy.getActivity()));
		}

		if (d.containsKey(TiC.PROPERTY_BORDER_RADIUS)) {
			setRadius(d.get(TiC.PROPERTY_BORDER_RADIUS));
		}

		if (d.containsKey(TiC.PROPERTY_BORDER_WIDTH)) {
			TiDimension tiDimension =
				TiConvert.toTiDimension(TiConvert.toString(d.get(TiC.PROPERTY_BORDER_WIDTH)), TiDimension.TYPE_WIDTH);
			cardview.setStrokeWidth(tiDimension.getAsPixels(cardview));
		}

		if (d.containsKey(TiC.PROPERTY_USE_COMPAT_PADDING)) {
			cardview.setUseCompatPadding(TiConvert.toBoolean(d, TiC.PROPERTY_USE_COMPAT_PADDING, false));
		}

		if (d.containsKey(TiC.PROPERTY_ELEVATION)) {
			cardview.setCardElevation(TiConvert.toFloat(d.get(TiC.PROPERTY_ELEVATION)));
		}

		if (d.containsKey(TiC.PROPERTY_MAX_ELEVATION)) {
			cardview.setMaxCardElevation(TiConvert.toFloat(d.get(TiC.PROPERTY_MAX_ELEVATION)));
		}

		if (d.containsKey(TiC.PROPERTY_PREVENT_CORNER_OVERLAP)) {
			cardview.setPreventCornerOverlap(TiConvert.toBoolean(d, TiC.PROPERTY_PREVENT_CORNER_OVERLAP, false));
		}

		if (!d.optBoolean(TiC.PROPERTY_TOUCH_FEEDBACK, true)) {
			cardview.setRippleColor(ColorStateList.valueOf(Color.TRANSPARENT));
		} else if (d.containsKey(TiC.PROPERTY_TOUCH_FEEDBACK_COLOR)) {
			// TODO: reset to default value when property is null
			String colorString = TiConvert.toString(d.get(TiC.PROPERTY_TOUCH_FEEDBACK_COLOR));
			cardview.setRippleColor(ColorStateList.valueOf(TiConvert.toColor(colorString, proxy.getActivity())));
		} else if (this.defaultRippleColorSateList != null) {
			cardview.setRippleColor(this.defaultRippleColorSateList);
		}

		if (d.containsKey(TiC.PROPERTY_PADDING)) {
			float radiusRight = 0;
			TiDimension radiusDimRight =
				TiConvert.toTiDimension(TiConvert.toString(d.get(TiC.PROPERTY_PADDING)), TiDimension.TYPE_RIGHT);
			if (radiusDimRight != null) {
				radiusRight = (float) radiusDimRight.getPixels(cardview);
			}
			paddingRight = (int) radiusRight;

			float radiusBottom = 0;
			TiDimension radiusDimBottom =
				TiConvert.toTiDimension(TiConvert.toString(d.get(TiC.PROPERTY_PADDING)), TiDimension.TYPE_BOTTOM);
			if (radiusDimBottom != null) {
				radiusBottom = (float) radiusDimBottom.getPixels(cardview);
			}
			paddingBottom = (int) radiusBottom;

			float radiusLeft = 0;
			TiDimension radiusDimLeft =
				TiConvert.toTiDimension(TiConvert.toString(d.get(TiC.PROPERTY_PADDING)), TiDimension.TYPE_LEFT);
			if (radiusDimLeft != null) {
				radiusLeft = (float) radiusDimLeft.getPixels(cardview);
			}
			paddingLeft = (int) radiusLeft;

			float radiusTop = 0;
			TiDimension radiusDimTop =
				TiConvert.toTiDimension(TiConvert.toString(d.get(TiC.PROPERTY_PADDING)), TiDimension.TYPE_TOP);
			if (radiusDimTop != null) {
				radiusTop = (float) radiusDimTop.getPixels(cardview);
			}
			paddingTop = (int) radiusTop;
		}

		if (d.containsKey(TiC.PROPERTY_PADDING_BOTTOM)) {
			float radiusBottom = 0;
			TiDimension radiusDimBottom = TiConvert.toTiDimension(
				TiConvert.toString(d.get(TiC.PROPERTY_PADDING_BOTTOM)), TiDimension.TYPE_BOTTOM);
			if (radiusDimBottom != null) {
				radiusBottom = (float) radiusDimBottom.getPixels(cardview);
			}
			paddingBottom = (int) radiusBottom;
		}

		if (d.containsKey(TiC.PROPERTY_PADDING_LEFT)) {
			float radiusLeft = 0;
			TiDimension radiusDimLeft =
				TiConvert.toTiDimension(TiConvert.toString(d.get(TiC.PROPERTY_PADDING_LEFT)), TiDimension.TYPE_LEFT);
			if (radiusDimLeft != null) {
				radiusLeft = (float) radiusDimLeft.getPixels(cardview);
			}
			paddingLeft = (int) radiusLeft;
		}

		if (d.containsKey(TiC.PROPERTY_PADDING_RIGHT)) {
			float radiusRight = 0;
			TiDimension radiusDimRight =
				TiConvert.toTiDimension(TiConvert.toString(d.get(TiC.PROPERTY_PADDING_RIGHT)), TiDimension.TYPE_RIGHT);
			if (radiusDimRight != null) {
				radiusRight = (float) radiusDimRight.getPixels(cardview);
			}
			paddingRight = (int) radiusRight;
		}

		if (d.containsKey(TiC.PROPERTY_PADDING_TOP)) {
			float radiusTop = 0;
			TiDimension radiusDimTop =
				TiConvert.toTiDimension(TiConvert.toString(d.get(TiC.PROPERTY_PADDING_TOP)), TiDimension.TYPE_TOP);
			if (radiusDimTop != null) {
				radiusTop = (float) radiusDimTop.getPixels(cardview);
			}
			paddingTop = (int) radiusTop;
		}

		cardview.setContentPadding(paddingLeft, paddingTop, paddingRight, paddingBottom);
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (Log.isDebugModeEnabled()) {
			Log.d(TAG, "Property: " + key + " old: " + oldValue + " new: " + newValue, Log.DEBUG_MODE);
		}

		TiCardView cardview = ((TiCardView) getNativeView());

		if (key.equals(TiC.PROPERTY_BACKGROUND_COLOR)) {
			cardview.setCardBackgroundColor(TiConvert.toColor(newValue, proxy.getActivity()));
			cardview.requestLayout();
		} else if (key.equals(TiC.PROPERTY_BORDER_COLOR)) {
			cardview.setStrokeColor(TiConvert.toColor(newValue, proxy.getActivity()));
		} else if (key.equals(TiC.PROPERTY_BORDER_RADIUS)) {
			setRadius(newValue);
			cardview.requestLayout();
		} else if (key.equals(TiC.PROPERTY_BORDER_WIDTH)) {
			TiDimension tiDimension = TiConvert.toTiDimension(TiConvert.toString(newValue), TiDimension.TYPE_WIDTH);
			cardview.setStrokeWidth(tiDimension.getAsPixels(cardview));
		} else if (key.equals(TiC.PROPERTY_ELEVATION)) {
			cardview.setCardElevation(TiConvert.toFloat(newValue));
			cardview.requestLayout();
		} else if (key.equals(TiC.PROPERTY_PREVENT_CORNER_OVERLAP)) {
			cardview.setPreventCornerOverlap(TiConvert.toBoolean(newValue, false));
			cardview.requestLayout();
		} else if (key.equals(TiC.PROPERTY_USE_COMPAT_PADDING)) {
			cardview.setUseCompatPadding(TiConvert.toBoolean(newValue, false));
			cardview.requestLayout();
		} else if (key.equals(TiC.PROPERTY_PADDING)) {
			float radiusRight = 0;
			TiDimension radiusDimRight = TiConvert.toTiDimension(TiConvert.toString(newValue), TiDimension.TYPE_RIGHT);
			if (radiusDimRight != null) {
				radiusRight = (float) radiusDimRight.getPixels(cardview);
			}
			paddingRight = (int) radiusRight;

			float radiusBottom = 0;
			TiDimension radiusDimBottom =
				TiConvert.toTiDimension(TiConvert.toString(newValue), TiDimension.TYPE_BOTTOM);
			if (radiusDimBottom != null) {
				radiusBottom = (float) radiusDimBottom.getPixels(cardview);
			}
			paddingBottom = (int) radiusBottom;

			float radiusLeft = 0;
			TiDimension radiusDimLeft = TiConvert.toTiDimension(TiConvert.toString(newValue), TiDimension.TYPE_LEFT);
			if (radiusDimLeft != null) {
				radiusLeft = (float) radiusDimLeft.getPixels(cardview);
			}
			paddingLeft = (int) radiusLeft;

			float radiusTop = 0;
			TiDimension radiusDimTop = TiConvert.toTiDimension(TiConvert.toString(newValue), TiDimension.TYPE_TOP);
			if (radiusDimTop != null) {
				radiusTop = (float) radiusDimTop.getPixels(cardview);
			}
			paddingTop = (int) radiusTop;

			cardview.setContentPadding(paddingLeft, paddingTop, paddingRight, paddingBottom);
			cardview.requestLayout();
		} else if (key.equals(TiC.PROPERTY_PADDING_BOTTOM)) {
			float radiusBottom = 0;
			TiDimension radiusDimBottom =
				TiConvert.toTiDimension(TiConvert.toString(newValue), TiDimension.TYPE_BOTTOM);
			if (radiusDimBottom != null) {
				radiusBottom = (float) radiusDimBottom.getPixels(cardview);
			}
			paddingBottom = (int) radiusBottom;
			cardview.setContentPadding(paddingLeft, paddingTop, paddingRight, paddingBottom);
			cardview.requestLayout();
		} else if (key.equals(TiC.PROPERTY_PADDING_LEFT)) {
			float radiusLeft = 0;
			TiDimension radiusDimLeft = TiConvert.toTiDimension(TiConvert.toString(newValue), TiDimension.TYPE_LEFT);
			if (radiusDimLeft != null) {
				radiusLeft = (float) radiusDimLeft.getPixels(cardview);
			}
			paddingLeft = (int) radiusLeft;
			cardview.setContentPadding(paddingLeft, paddingTop, paddingRight, paddingBottom);
			cardview.requestLayout();
		} else if (key.equals(TiC.PROPERTY_PADDING_RIGHT)) {
			float radiusRight = 0;
			TiDimension radiusDimRight = TiConvert.toTiDimension(TiConvert.toString(newValue), TiDimension.TYPE_RIGHT);
			if (radiusDimRight != null) {
				radiusRight = (float) radiusDimRight.getPixels(cardview);
			}
			paddingRight = (int) radiusRight;
			cardview.setContentPadding(paddingLeft, paddingTop, paddingRight, paddingBottom);
			cardview.requestLayout();
		} else if (key.equals(TiC.PROPERTY_PADDING_TOP)) {
			float radiusTop = 0;
			TiDimension radiusDimTop = TiConvert.toTiDimension(TiConvert.toString(newValue), TiDimension.TYPE_TOP);
			if (radiusDimTop != null) {
				radiusTop = (float) radiusDimTop.getPixels(cardview);
			}
			paddingTop = (int) radiusTop;
			cardview.setContentPadding(paddingLeft, paddingTop, paddingRight, paddingBottom);
			cardview.requestLayout();
		} else if (key.equals(TiC.PROPERTY_TOUCH_FEEDBACK) || key.equals(TiC.PROPERTY_TOUCH_FEEDBACK_COLOR)) {
			boolean isEnabled = TiConvert.toBoolean(this.proxy.getProperty(TiC.PROPERTY_TOUCH_FEEDBACK), true);
			if (!isEnabled) {
				cardview.setRippleColor(ColorStateList.valueOf(Color.TRANSPARENT));
			} else if (this.proxy.hasProperty(TiC.PROPERTY_TOUCH_FEEDBACK_COLOR)) {
				String colorString = TiConvert.toString(this.proxy.getProperty(TiC.PROPERTY_TOUCH_FEEDBACK_COLOR));
				cardview.setRippleColor(ColorStateList.valueOf(TiConvert.toColor(colorString, proxy.getActivity())));
			} else if (this.defaultRippleColorSateList != null) {
				cardview.setRippleColor(this.defaultRippleColorSateList);
			}
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	@Override
	protected boolean canApplyTouchFeedback(@NonNull KrollDict props)
	{
		// Don't let base class apply touch feedback and use MaterialCardView.setRippleColor() instead.
		return false;
	}

	@Override
	protected boolean hasBorder(KrollDict d)
	{
		// This prevents "TiUIView" class from handling the border.
		// We apply border properties to CardView ourselves via its stroke methods.
		return false;
	}

	private void setRadius(Object borderRadius)
	{
		float radius = 0;
		TiCardView cardView = (TiCardView) getNativeView();

		// Case 1: A string of border radii (e.g. '0 0 20 20') or a single string radius (e.g. '20')
		if (borderRadius instanceof String) {
			final String[] corners = ((String) borderRadius).split("\\s");
			if (corners != null && corners.length > 1) {
				setRadius(corners);
			} else {
				setRadius(new String[]{ corners[0], corners[0], corners[0], corners[0] });
			}

		// Case 2: An array of border radii (e.g. ['0 0 20 20'])
		} else if (borderRadius instanceof Object[]) {
			final Object[] cornerObjects = (Object[]) borderRadius;
			final float[] cornerPixels = new float[cornerObjects.length];

			for (int i = 0; i < cornerObjects.length; i++) {
				final Object corner = cornerObjects[i];
				final TiDimension radiusDimension = TiConvert.toTiDimension(corner, TiDimension.TYPE_WIDTH);
				if (radiusDimension != null) {
					cornerPixels[i] = (float) radiusDimension.getPixels(this.nativeView);
				} else {
					Log.w(TAG, "Invalid value specified for borderRadius[" + i + "].");
					cornerPixels[i] = 0;
				}
			}

			if (cornerPixels.length >= 4) {
				cardView.setShapeAppearanceModel(
					cardView.getShapeAppearanceModel()
						.toBuilder()
						.setTopLeftCorner(CornerFamily.ROUNDED, cornerPixels[0])
						.setTopRightCorner(CornerFamily.ROUNDED, cornerPixels[1])
						.setBottomRightCorner(CornerFamily.ROUNDED, cornerPixels[2])
						.setBottomLeftCorner(CornerFamily.ROUNDED, cornerPixels[3])
						.build());
			} else {
				Log.w(TAG, "Could not set borderRadius, empty array.");
			}
		// Case 3: A single radius (e.g. 20)
		} else {
			final TiDimension radiusDimension = TiConvert.toTiDimension(borderRadius, TiDimension.TYPE_WIDTH);
			float pixels = 0;

			if (radiusDimension != null) {
				pixels = (float) radiusDimension.getPixels(this.nativeView);
			} else {
				Log.w(TAG, "Invalid value specified for borderRadius.");
			}

			TiDimension radiusDim = TiConvert.toTiDimension(borderRadius, TiDimension.TYPE_WIDTH);
			if (radiusDim != null) {
				radius = (float) radiusDim.getPixels(cardView);
			}
			cardView.setRadius(radius);
		}
	}
}
