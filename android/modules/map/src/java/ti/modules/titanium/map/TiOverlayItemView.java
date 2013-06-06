/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.map;

import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiCompositeLayout;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.RelativeLayout;
import android.widget.TextView;

public class TiOverlayItemView extends FrameLayout
{
	private static final String TAG = "TitaniumOverlayItemView";

	private RelativeLayout layout;
	private TiCompositeLayout leftPane;
	private TiCompositeLayout rightPane;
	private TextView title;
	private TextView snippet;
	private int lastIndex;
	private View[] hitTestList;
	private OnOverlayClicked overlayClickedListener;

	public interface OnOverlayClicked
	{
		public void onClick(int lastIndex, String clickedItem);
	}

	public TiOverlayItemView(Context context)
	{
		super(context);

		lastIndex = -1;

		setPadding(0, 0, 0, 10);

		layout = new RelativeLayout(context);

		layout.setBackgroundColor(Color.argb(200, 0, 0, 0));
		layout.setGravity(Gravity.NO_GRAVITY);
		layout.setPadding(4, 2, 4, 2);

		RelativeLayout.LayoutParams params = null;

		leftPane = new TiCompositeLayout(context);
		leftPane.setId(100);
		leftPane.setTag("leftPane");
		params = createBaseParams();
		params.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
		if (Integer.parseInt(Build.VERSION.SDK) > 3) {
			params.addRule(RelativeLayout.CENTER_VERTICAL);
		}
		params.setMargins(0, 0, 5, 0);
		layout.addView(leftPane, params);

		RelativeLayout textLayout = new RelativeLayout(getContext());
		textLayout.setGravity(Gravity.NO_GRAVITY);
		textLayout.setId(101);

		title = new TextView(context) {

			@Override
			protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
			{
				super.onMeasure(widthMeasureSpec, heightMeasureSpec);

				if (getMeasuredWidth() > 230) {
					setMeasuredDimension(200, getMeasuredHeight());
				}
			}

		};
		title.setId(200);
		title.setTextColor(Color.argb(255, 216,216,216));
		title.setTag(TiC.PROPERTY_TITLE);
		TiUIHelper.styleText(title, "sans-serif", "15sip", "bold");
		params = createBaseParams();
		params.addRule(RelativeLayout.ALIGN_TOP);
		textLayout.addView(title, params);

		snippet = new TextView(context);
		snippet.setId(201);
		snippet.setTextColor(Color.argb(255, 192,192,192));
		snippet.setTag(TiC.PROPERTY_SUBTITLE);
		TiUIHelper.styleText(snippet, "sans-serif", "10sip", "bold");
		params = createBaseParams();
		params.addRule(RelativeLayout.BELOW, 200);
		textLayout.addView(snippet, params);

		params = createBaseParams();
		params.addRule(RelativeLayout.RIGHT_OF, 100);
		params.addRule(RelativeLayout.ALIGN_TOP);
		layout.addView(textLayout, params);

		rightPane = new TiCompositeLayout(context);
		rightPane.setId(103);
		rightPane.setTag("rightPane");
		params = createBaseParams();
		if (Integer.parseInt(Build.VERSION.SDK) > 3) {
			params.addRule(RelativeLayout.CENTER_VERTICAL);
		}
		params.addRule(RelativeLayout.RIGHT_OF, 101);
		params.setMargins(5, 0, 0, 0);
		layout.addView(rightPane, params);

		FrameLayout.LayoutParams fparams = new FrameLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
		fparams.gravity = Gravity.NO_GRAVITY;
		addView(layout, fparams);

		hitTestList = new View[] { leftPane, title, snippet, rightPane };
	}

	public TiOverlayItemView(Context context, TiContext tiContext)
	{
		this(context);
	}

	private RelativeLayout.LayoutParams createBaseParams()
	{
		return new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
	}

	public void setItem(int index, TiOverlayItem item)
	{
		TiFileHelper tfh = new TiFileHelper(getContext());
		Drawable d = null;

		lastIndex = index;

		leftPane.removeAllViews();
		rightPane.removeAllViews();

		String leftButton = item.getLeftButton();
		TiViewProxy leftView = item.getLeftView();
		if((leftButton != null) || (leftView != null)) {
			if (leftButton != null) {
				try {
					ImageView leftImage = new ImageView(getContext());
					d = tfh.loadDrawable(leftButton, false);
					leftImage.setImageDrawable(d);
					leftPane.addView(leftImage);

				} catch (Exception e) {
					Log.e(TAG, "Error loading left button - " + leftButton + ": " + e.getMessage());

				}

			} else if (leftView != null) {
				leftPane.addView((leftView.getOrCreateView()).getNativeView());
			}
			leftPane.setVisibility(VISIBLE);

		} else {
			leftPane.setVisibility(GONE);
		}

		String rightButton = item.getRightButton();
		TiViewProxy rightView = item.getRightView();
		if((rightButton != null) || (rightView != null)) {
			if (rightButton != null) {
				try {
					ImageView rightImage = new ImageView(getContext());
					d = tfh.loadDrawable(rightButton, false);
					rightImage.setImageDrawable(d);
					rightPane.addView(rightImage);

				} catch (Exception e) {
					Log.e(TAG, "Error loading right button - " + rightButton + ": " + e.getMessage());

				}

			} else if (rightView != null) {
				rightPane.addView(rightView.getOrCreateView().getNativeView());
			}

			rightPane.setVisibility(VISIBLE);

		} else {
			rightPane.setVisibility(GONE);
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
	public boolean dispatchTouchEvent(MotionEvent ev)
	{
		if (ev.getAction() == MotionEvent.ACTION_DOWN) {
			int x = (int) ev.getX();
			int y = (int) ev.getY();

			Rect hitRect = new Rect();

			int count = hitTestList.length;
			for (int i = 0; i < count; i++) {
				View v = hitTestList[i];
				String tag = (String) v.getTag();
				if (v.getVisibility() == View.VISIBLE && tag != null) {
					v.getHitRect(hitRect);

					// The title and subtitle are the children of a relative layout which is the child of this.
					if (tag == TiC.PROPERTY_TITLE || tag == TiC.PROPERTY_SUBTITLE) {
						Rect textLayoutRect = new Rect();
						((ViewGroup) (v.getParent())).getHitRect(textLayoutRect);
						hitRect.offset(textLayoutRect.left, textLayoutRect.top);
					}

					if (hitRect.contains(x, y)) {
						if (overlayClickedListener != null) {
							overlayClickedListener.onClick(lastIndex, tag);
						}
						break;
					}
				}
			}
		}

		return super.dispatchTouchEvent(ev);
	}

	public void fireClickEvent(int index, String clickedItem)
	{
		if (overlayClickedListener == null) {
			Log.w(TAG, "Unable to fire click listener for map overlay, no listener found");

			return;
		}

		overlayClickedListener.onClick(index, clickedItem);
	}

	public void setOnOverlayClickedListener(OnOverlayClicked listener)
	{
		overlayClickedListener = listener;
	}

	public int getLastIndex()
	{
		return lastIndex;
	}

	public void clearLastIndex()
	{
		lastIndex = -1;
	}
}
