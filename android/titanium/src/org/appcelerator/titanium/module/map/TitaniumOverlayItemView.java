/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.module.map;

import java.lang.ref.WeakReference;

import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TitaniumFileHelper;
import org.appcelerator.titanium.util.TitaniumUIHelper;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.RelativeLayout;
import android.widget.TextView;

public class TitaniumOverlayItemView extends FrameLayout
{
	private static final String LCAT = "TitaniumOverlayItemView";

	public interface OnOverlayClicked {
		public void onClick(int lastIndex, String clickedItem);
	}

	private RelativeLayout layout;
	private ImageView leftImage;
	private ImageView rightImage;
	private TextView title;
	private TextView snippet;
	private int lastIndex;

	private OnOverlayClicked overlayClickedListener;

	public TitaniumOverlayItemView(Context context)
	{
		super(context);

		lastIndex = -1;

		setPadding(0, 0, 0, 10);

		layout = new RelativeLayout(context);

		layout.setBackgroundColor(Color.argb(200, 0, 0, 0));
		layout.setGravity(Gravity.NO_GRAVITY);
		layout.setPadding(4, 2, 4, 2);

		RelativeLayout.LayoutParams params = null;

		leftImage = new ImageView(context);
		leftImage.setId(100);
		leftImage.setTag("leftButton");
		params = createBaseParams();
		params.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
		params.addRule(RelativeLayout.CENTER_VERTICAL);
		params.setMargins(0, 0, 5, 0);
		layout.addView(leftImage, params);

		title = new TextView(context);
		title.setId(101);
		title.setTextColor(Color.argb(255, 216,216,216));
		title.setTag("title");
		TitaniumUIHelper.styleText(title, "15sip", "bold");
		params = createBaseParams();
		params.addRule(RelativeLayout.RIGHT_OF, 100);
		params.addRule(RelativeLayout.ALIGN_TOP);
		layout.addView(title, params);

		snippet = new TextView(context);
		snippet.setId(102);
		snippet.setTextColor(Color.argb(255, 192,192,192));
		snippet.setTag("subtitle");
		TitaniumUIHelper.styleText(snippet, "10sip", "bold");
		params = createBaseParams();
		params.addRule(RelativeLayout.RIGHT_OF, 100);
		params.addRule(RelativeLayout.BELOW, 101);
		layout.addView(snippet, params);

		rightImage = new ImageView(context);
		rightImage.setId(103);
		rightImage.setTag("rightImage");
		params = createBaseParams();
		params.addRule(RelativeLayout.CENTER_VERTICAL);
		params.addRule(RelativeLayout.RIGHT_OF, 101);
		params.setMargins(5, 0, 0, 0);
		layout.addView(rightImage, params);

		FrameLayout.LayoutParams fparams = new FrameLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
		fparams.gravity = Gravity.NO_GRAVITY;
		addView(layout, fparams);
	}

	private RelativeLayout.LayoutParams createBaseParams() {
		return new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
	}

	public void setItem(int index, TitaniumOverlayItem item)
	{
		TitaniumFileHelper tfh = new TitaniumFileHelper(getContext());
		Drawable d = null;

		lastIndex = index;

		if(item.getLeftButton() != null) {
			try {
				d = tfh.loadDrawable(item.getLeftButton(), false);
				leftImage.setImageDrawable(d);
				leftImage.setVisibility(VISIBLE);
			} catch (Exception e) {
				leftImage.setVisibility(GONE);
				Log.e(LCAT, "Error loading left button - " + item.getLeftButton() + ": " + e.getMessage());
			}
		} else {
			leftImage.setVisibility(GONE);
		}
		if(item.getRightButton() != null) {
			try {
				d = tfh.loadDrawable(item.getRightButton(), false);
				rightImage.setImageDrawable(d);
				rightImage.setVisibility(VISIBLE);
			} catch (Exception e) {
				rightImage.setVisibility(GONE);
				Log.e(LCAT, "Error loading right button - " + item.getRightButton() + ": " + e.getMessage());
			}
		} else {
			rightImage.setVisibility(GONE);
		}
		if(item.getTitle() != null) {
			title.setVisibility(VISIBLE);
			title.setText(item.getTitle());
		} else {
			title.setVisibility(GONE);
		}
		if(item.getSnippet() != null) {
			snippet.setVisibility(VISIBLE);
			snippet.setText(item.getSnippet());
		} else {
			snippet.setVisibility(GONE);
		}
	}

	@Override
	public boolean dispatchTouchEvent(MotionEvent ev) {
		if (ev.getAction() == MotionEvent.ACTION_DOWN) {
			int x = (int) ev.getX();
			int y = (int) ev.getY();

			String lastTouchedViewName = null;
			Rect hitRect = new Rect();

			int count = layout.getChildCount();
			for(int i = 0; i < count; i++) {
				View v = layout.getChildAt(i);
				if (v.getVisibility() == View.VISIBLE) {
					v.getHitRect(hitRect);
					if (hitRect.contains(x, y)) {
						lastTouchedViewName = (String) v.getTag();
						if (overlayClickedListener != null) {
							overlayClickedListener.onClick(lastIndex, lastTouchedViewName);
						}
						break;
					}
				}
			}
		}

		return super.dispatchTouchEvent(ev);
	}

	public void setOnOverlayClickedListener(OnOverlayClicked listener) {
		overlayClickedListener = listener;
	}

	public void clearLastIndex() {
		lastIndex = -1;
	}
	public int getLastIndex() {
		return lastIndex;
	}
}
