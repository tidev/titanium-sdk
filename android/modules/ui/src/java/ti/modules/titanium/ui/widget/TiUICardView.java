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
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.view.TiCompositeLayout.LayoutArrangement;

import android.content.Context;
import android.support.v7.widget.CardView;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;

public class TiUICardView extends TiUIView
{
    public int contentPaddingLeft, contentPaddingTop, contentPaddingRight, contentPaddingBottom;

    private static final String TAG = "TiUICardView";

    public class TiUICardViewLayout extends TiCompositeLayout {

        public TiUICardViewLayout(Context context, LayoutArrangement arrangement)
        {
            super(context, arrangement, proxy);
        } 

    }

    public class TiCardView extends CardView {

        private TiUICardViewLayout layout;

        public TiCardView(Context context, LayoutArrangement arrangement)
        {
            super(context);

            layout = new TiUICardViewLayout(context, arrangement);
            FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 
                    ViewGroup.LayoutParams.MATCH_PARENT);
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
        protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
            super.onLayout(changed, left, top, right, bottom);
            if (proxy != null && proxy.hasListeners(TiC.EVENT_POST_LAYOUT)) {
                proxy.fireEvent(TiC.EVENT_POST_LAYOUT, null, false);
            }
        }


    }

    public TiUICardView(final TiViewProxy proxy)
    {
        // we create the view after the properties are processed
        super(proxy);
    }

    public TiUICardViewLayout getLayout()
    {
        View nativeView = getNativeView();
        return ((TiCardView) nativeView).layout;

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
        if ( v instanceof TiCompositeLayout) {
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
        } else if (d.containsKey(TiC.PROPERTY_LAYOUT) && d.getString(TiC.PROPERTY_LAYOUT).equals(TiC.LAYOUT_HORIZONTAL)) {
            arrangement = LayoutArrangement.HORIZONTAL;
        }

        view = new TiCardView(getProxy().getActivity(), arrangement);
        view.setPadding(0, 0, 0, 0);
        view.setFocusable(false);
        TiCardView cardview = (TiCardView) view;
        
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

        setNativeView(view);

    }

    @Override
    public void propertyChanged(String key, Object oldValue, Object newValue, KrollProxy proxy)
    {
        if (Log.isDebugModeEnabled()) {
            Log.d(TAG, "Property: " + key + " old: " + oldValue + " new: " + newValue, Log.DEBUG_MODE);
        }
        
        TiCardView cardview = ((TiCardView) getNativeView());
        
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
