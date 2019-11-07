/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-2016 by Appcelerator, Inc. All Rights Reserved.
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
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutArrangement;
import org.appcelerator.titanium.view.TiUIView;

import android.content.Context;
import android.support.v7.widget.CardView;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

public class TiUICardView extends TiUIView
{
	public int paddingLeft, paddingTop, paddingRight, paddingBottom;

	private static final String TAG = "TiUICardView";

	public class TiUICardViewLayout extends TiCompositeLayout
	{

		public TiUICardViewLayout(Context context, LayoutArrangement arrangement)
		{
			super(context, arrangement, proxy);
		}
	}

	public class TiCardView extends CardView
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

		// generate native view
		if (this.nativeView == null) {
			processProperties(getProxy().getProperties());
		}
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

		// we create the view here
		View view = null;
		LayoutArrangement arrangement = LayoutArrangement.DEFAULT;

		if (d.containsKey(TiC.PROPERTY_LAYOUT) && d.getString(TiC.PROPERTY_LAYOUT).equals(TiC.LAYOUT_VERTICAL)) {
			arrangement = LayoutArrangement.VERTICAL;
		} else if (d.containsKey(TiC.PROPERTY_LAYOUT)
				   && d.getString(TiC.PROPERTY_LAYOUT).equals(TiC.LAYOUT_HORIZONTAL)) {
			arrangement = LayoutArrangement.HORIZONTAL;
		}

		view = new TiCardView(getProxy().getActivity(), arrangement);
		view.setPadding(0, 0, 0, 0);
		view.setFocusable(false);
		TiCardView cardview = (TiCardView) view;

		if (d.containsKey(TiC.PROPERTY_BACKGROUND_COLOR)) {
			cardview.setCardBackgroundColor(TiConvert.toColor(d, TiC.PROPERTY_BACKGROUND_COLOR));
		}

		if (d.containsKey(TiC.PROPERTY_BORDER_RADIUS)) {
			float radius = 0;
			TiDimension radiusDim = TiConvert.toTiDimension(d.get(TiC.PROPERTY_BORDER_RADIUS), TiDimension.TYPE_WIDTH);
			if (radiusDim != null) {
				radius = (float) radiusDim.getPixels(cardview);
			}
			cardview.setRadius(radius);
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

		setNativeView(view);
	}

	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		if (Log.isDebugModeEnabled()) {
			Log.d(TAG, "Property: " + key + " old: " + oldValue + " new: " + newValue, Log.DEBUG_MODE);
		}

		TiCardView cardview = ((TiCardView) getNativeView());

		if (key.equals(TiC.PROPERTY_BACKGROUND_COLOR)) {
			cardview.setCardBackgroundColor(TiConvert.toColor(TiConvert.toString(newValue)));
			cardview.requestLayout();
		} else if (key.equals(TiC.PROPERTY_BORDER_RADIUS)) {
			float radius = 0;
			TiDimension radiusDim = TiConvert.toTiDimension(newValue, TiDimension.TYPE_WIDTH);
			if (radiusDim != null) {
				radius = (float) radiusDim.getPixels(cardview);
			}
			cardview.setRadius(radius);
			cardview.requestLayout();
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
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
	}

	@Override
	protected boolean hasBorder(KrollDict d)
	{
		return false;
	}
}
