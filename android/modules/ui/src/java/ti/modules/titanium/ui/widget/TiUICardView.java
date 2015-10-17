/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import android.support.v7.widget.CardView;

public class TiUICardView extends TiUIView
{
	private static final String TAG = "TiUICardView";
	private int contentPaddingBottom = 0;
	private int contentPaddingLeft = 0;
	private int contentPaddingRight = 0;
	private int contentPaddingTop = 0;

	public TiUICardView(final TiViewProxy proxy)
	{
		super(proxy);
		Log.d(TAG, "Creating a cardview", Log.DEBUG_MODE);

		CardView cardview = new CardView(getProxy().getActivity())
		{
			@Override
			protected void onLayout(boolean changed, int left, int top, int right, int bottom)
			{
				super.onLayout(changed, left, top, right, bottom);

				if (proxy != null && proxy.hasListeners(TiC.EVENT_POST_LAYOUT)) {
					proxy.fireEvent(TiC.EVENT_POST_LAYOUT, null, false);
				}
			}
		};
		cardview.setPadding(0, 0, 0, 0);
		cardview.setFocusable(false);
		setNativeView(cardview);

	}

	@Override
	public void processProperties(KrollDict d)
	{
		super.processProperties(d);

		CardView cardview = (CardView) getNativeView();

		if (d.containsKey(TiC.PROPERTY_CARD_BACKGROUND_COLOR)) {
			cardview.setCardBackgroundColor(TiConvert.toColor(d, TiC.PROPERTY_CARD_BACKGROUND_COLOR));
		}

		if (d.containsKey(TiC.PROPERTY_CARD_CORNER_RADIUS)) {
			cardview.setRadius(TiConvert.toFloat(d.get(TiC.PROPERTY_CARD_CORNER_RADIUS)));
		}

		if (d.containsKey(TiC.PROPERTY_CARD_USE_COMPAT_PADDING)) {
			cardview.setUseCompatPadding(TiConvert.toBoolean(d, TiC.PROPERTY_CARD_USE_COMPAT_PADDING, false));
		}

		if (d.containsKey(TiC.PROPERTY_CARD_ELEVATION)) {
			cardview.setCardElevation(TiConvert.toFloat(d.get(TiC.PROPERTY_CARD_ELEVATION)));
		}

		if (d.containsKey(TiC.PROPERTY_CARD_MAX_ELEVATION)) {
			cardview.setMaxCardElevation(TiConvert.toFloat(d.get(TiC.PROPERTY_CARD_MAX_ELEVATION)));
		}

		if (d.containsKey(TiC.PROPERTY_CARD_PREVENT_CORNER_OVERLAP)) {
			cardview.setPreventCornerOverlap(TiConvert.toBoolean(d, TiC.PROPERTY_CARD_PREVENT_CORNER_OVERLAP, false));
		}

		if (d.containsKey(TiC.PROPERTY_CONTENT_PADDING)) {
			contentPaddingBottom = TiConvert.toInt(d, TiC.PROPERTY_CONTENT_PADDING);
			contentPaddingLeft = contentPaddingBottom;
			contentPaddingRight = contentPaddingBottom;
			contentPaddingTop = contentPaddingBottom;
		}

		if (d.containsKey(TiC.PROPERTY_CONTENT_PADDING_BOTTOM)) {
			contentPaddingBottom = TiConvert.toInt(d, TiC.PROPERTY_CONTENT_PADDING_BOTTOM);
		}

		if (d.containsKey(TiC.PROPERTY_CONTENT_PADDING_LEFT)) {
			contentPaddingLeft = TiConvert.toInt(d, TiC.PROPERTY_CONTENT_PADDING_LEFT);
		}

		if (d.containsKey(TiC.PROPERTY_CONTENT_PADDING_RIGHT)) {
			contentPaddingRight = TiConvert.toInt(d, TiC.PROPERTY_CONTENT_PADDING_RIGHT);
		}

		if (d.containsKey(TiC.PROPERTY_CONTENT_PADDING_TOP)) {
			contentPaddingTop = TiConvert.toInt(d, TiC.PROPERTY_CONTENT_PADDING_TOP);
		}

		cardview.setContentPadding(contentPaddingLeft, contentPaddingTop, contentPaddingRight, contentPaddingBottom);

		cardview.invalidate();
	}
	
	@Override
	public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
	{
		CardView cardview = (CardView) getNativeView();
		if (key.equals(TiC.PROPERTY_CARD_BACKGROUND_COLOR)) {
			cardview.setCardBackgroundColor(TiConvert.toColor(TiConvert.toString(newValue)));
			cardview.requestLayout();
		} else if (key.equals(TiC.PROPERTY_CARD_CORNER_RADIUS)) {
			cardview.setRadius(TiConvert.toFloat(newValue));
			cardview.requestLayout();
		} else if (key.equals(TiC.PROPERTY_CARD_ELEVATION)) {
			cardview.setCardElevation(TiConvert.toFloat(newValue));
			cardview.requestLayout();
		} else if (key.equals(TiC.PROPERTY_CARD_MAX_ELEVATION)) {
			cardview.setMaxCardElevation(TiConvert.toFloat(newValue));
			cardview.requestLayout();
		} else if (key.equals(TiC.PROPERTY_CARD_PREVENT_CORNER_OVERLAP)) {
			cardview.setPreventCornerOverlap(TiConvert.toBoolean(newValue, false));
			cardview.requestLayout();
		} else if (key.equals(TiC.PROPERTY_CARD_USE_COMPAT_PADDING)) {
			cardview.setUseCompatPadding(TiConvert.toBoolean(newValue, false));
			cardview.requestLayout();
		} else if (key.equals(TiC.PROPERTY_CONTENT_PADDING)) {
			contentPaddingBottom = TiConvert.toInt(newValue);
			contentPaddingLeft = contentPaddingBottom;
			contentPaddingRight = contentPaddingBottom;
			contentPaddingTop = contentPaddingBottom;
			cardview.setContentPadding(contentPaddingLeft, contentPaddingTop, contentPaddingRight, contentPaddingBottom);
			cardview.requestLayout();
		} else if (key.equals(TiC.PROPERTY_CONTENT_PADDING_BOTTOM)) {
			contentPaddingBottom = TiConvert.toInt(newValue);
			cardview.setContentPadding(contentPaddingLeft, contentPaddingTop, contentPaddingRight, contentPaddingBottom);
			cardview.requestLayout();
		} else if (key.equals(TiC.PROPERTY_CONTENT_PADDING_LEFT)) {
			contentPaddingLeft = TiConvert.toInt(newValue);
			cardview.setContentPadding(contentPaddingLeft, contentPaddingTop, contentPaddingRight, contentPaddingBottom);
			cardview.requestLayout();
		} else if (key.equals(TiC.PROPERTY_CONTENT_PADDING_RIGHT)) {
			contentPaddingRight = TiConvert.toInt(newValue);
			cardview.setContentPadding(contentPaddingLeft, contentPaddingTop, contentPaddingRight, contentPaddingBottom);
			cardview.requestLayout();
		} else if (key.equals(TiC.PROPERTY_CONTENT_PADDING_TOP)) {
			contentPaddingTop = TiConvert.toInt(newValue);
			cardview.setContentPadding(contentPaddingLeft, contentPaddingTop, contentPaddingRight, contentPaddingBottom);
			cardview.requestLayout();
		} else {
			super.propertyChanged(key, oldValue, newValue, proxy);
		}
		

	}

}
