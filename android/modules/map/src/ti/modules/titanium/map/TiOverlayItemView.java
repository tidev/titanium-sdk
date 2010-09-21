/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.map;

import java.lang.ref.WeakReference;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.util.TiFileHelper;
import org.appcelerator.titanium.util.TiUIHelper;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Rect;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.RelativeLayout;
import android.widget.TextView;

public class TiOverlayItemView extends FrameLayout
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
	private View[] hitTestList;
	private WeakReference<TiContext> weakTiContext;

	private OnOverlayClicked overlayClickedListener;

	public TiOverlayItemView(Context context, TiContext tiContext)
	{
		super(context);
		weakTiContext = new WeakReference<TiContext>(tiContext);

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
		if (Integer.parseInt(Build.VERSION.SDK) > 3) {
			params.addRule(RelativeLayout.CENTER_VERTICAL);
		}
		params.setMargins(0, 0, 5, 0);
		layout.addView(leftImage, params);

		RelativeLayout textLayout = new RelativeLayout(getContext());
		textLayout.setGravity(Gravity.NO_GRAVITY);
		textLayout.setId(101);

		title = new TextView(context) {

			@Override
			protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
				super.onMeasure(widthMeasureSpec, heightMeasureSpec);

				if (getMeasuredWidth() > 230) {
					setMeasuredDimension(200, getMeasuredHeight());
				}
			}

		};
		title.setId(200);
		title.setTextColor(Color.argb(255, 216,216,216));
		title.setTag("title");
		TiUIHelper.styleText(title, "sans-serif", "15sip", "bold");
		params = createBaseParams();
		params.addRule(RelativeLayout.ALIGN_TOP);
		textLayout.addView(title, params);

		snippet = new TextView(context);
		snippet.setId(201);
		snippet.setTextColor(Color.argb(255, 192,192,192));
		snippet.setTag("subtitle");
		TiUIHelper.styleText(snippet, "sans-serif", "10sip", "bold");
		params = createBaseParams();
		params.addRule(RelativeLayout.BELOW, 200);
		textLayout.addView(snippet, params);

		params = createBaseParams();
		params.addRule(RelativeLayout.RIGHT_OF, 100);
		params.addRule(RelativeLayout.ALIGN_TOP);
		layout.addView(textLayout, params);

		rightImage = new ImageView(context);
		rightImage.setId(103);
		rightImage.setTag("rightButton");
		params = createBaseParams();
		if (Integer.parseInt(Build.VERSION.SDK) > 3) {
			params.addRule(RelativeLayout.CENTER_VERTICAL);
		}
		params.addRule(RelativeLayout.RIGHT_OF, 101);
		params.setMargins(5, 0, 0, 0);
		layout.addView(rightImage, params);

		FrameLayout.LayoutParams fparams = new FrameLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
		fparams.gravity = Gravity.NO_GRAVITY;
		addView(layout, fparams);

		hitTestList = new View[] { leftImage, title, snippet, rightImage };
	}

	private RelativeLayout.LayoutParams createBaseParams() {
		return new RelativeLayout.LayoutParams(LayoutParams.WRAP_CONTENT, LayoutParams.WRAP_CONTENT);
	}

	public void setItem(int index, TiOverlayItem item)
	{
		TiFileHelper tfh = new TiFileHelper(getContext());
		Drawable d = null;

		lastIndex = index;
		
		if(item.getLeftButton() != null) {
			try {
				d = tfh.loadDrawable(weakTiContext.get(), item.getLeftButton(), false);
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
				d = tfh.loadDrawable(weakTiContext.get(), item.getRightButton(), false);
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

			Rect hitRect = new Rect();

			int count = hitTestList.length;
			for(int i = 0; i < count; i++) {
				View v = hitTestList[i];
				String tag = (String) v.getTag();
				if (v.getVisibility() == View.VISIBLE && tag != null) {
					v.getHitRect(hitRect);
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
