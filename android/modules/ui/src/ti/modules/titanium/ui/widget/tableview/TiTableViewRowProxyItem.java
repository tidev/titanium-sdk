/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import java.util.ArrayList;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;
import org.appcelerator.titanium.util.Log;

import ti.modules.titanium.ui.TableViewRowProxy;
import ti.modules.titanium.ui.widget.TiUILabel;
import ti.modules.titanium.ui.widget.tableview.TableViewModel.Item;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Handler;
import android.view.View;
import android.widget.ImageView;
import android.widget.TextView;

public class TiTableViewRowProxyItem extends TiBaseTableViewItem
{
	private static final String LCAT = "TitaniamTableViewItem";
	private static final boolean DBG = TiConfig.LOGD;

	private static final int LEFT_MARGIN = 5;
	private static final int RIGHT_MARGIN = 7;

	private BitmapDrawable hasChildDrawable, hasCheckDrawable;
	private ImageView leftImage;
	private ImageView rightImage;
	private TiCompositeLayout content;
	private TiUIView[] views;
	private boolean hasControls;
	private int height = -1;
	private Item item;

	public TiTableViewRowProxyItem(TiContext tiContext)
	{
		super(tiContext);

		this.handler = new Handler(this);
		this.leftImage = new ImageView(tiContext.getActivity());
		leftImage.setVisibility(GONE);
		addView(leftImage,new LayoutParams(LayoutParams.WRAP_CONTENT,LayoutParams.WRAP_CONTENT));

		this.content = new TiCompositeLayout(tiContext.getActivity(), false);
		content.setMinimumHeight(48);
		addView(content, new LayoutParams(LayoutParams.WRAP_CONTENT,LayoutParams.WRAP_CONTENT));

		this.rightImage = new ImageView(tiContext.getActivity());
		rightImage.setVisibility(GONE);
		addView(rightImage,new LayoutParams(LayoutParams.WRAP_CONTENT,LayoutParams.WRAP_CONTENT));
	}

	public void setRowData(Item item)
	{
		this.item = item;
		TableViewRowProxy rp = (TableViewRowProxy) item.proxy;
		rp.setTableViewItem(this);
		setRowData(rp);
	}

	public Item getRowData() {
		return this.item;
	}

	public void setRowData(TableViewRowProxy rp)
	{
		TiDict props = rp.getDynamicProperties();
		hasControls = rp.hasControls();

		setBackgroundFromProperties(props);

		// Handle right image
		boolean clearRightImage = true;
		if (props.containsKey("hasChild")) {
			if (TiConvert.toBoolean(props, "hasChild")) {
				if (hasChildDrawable == null) {
					hasChildDrawable = createHasChildDrawable();
				}
				rightImage.setImageDrawable(hasChildDrawable);
				rightImage.setVisibility(VISIBLE);
				clearRightImage = false;
			}
		}
		else if (props.containsKey("hasCheck")) {
			if (TiConvert.toBoolean(props, "hasCheck")) {
				if (hasCheckDrawable == null) {
					hasCheckDrawable = createHasCheckDrawable();
				}
				rightImage.setImageDrawable(hasCheckDrawable);
				rightImage.setVisibility(VISIBLE);
				clearRightImage = false;
			}
		}

		if (props.containsKey("rightImage")) {
			String path = TiConvert.toString(props, "rightImage");
			String url = tiContext.resolveUrl(null, path);

			Drawable d = loadDrawable(url);
			if (d != null) {
				rightImage.setImageDrawable(d);
				rightImage.setVisibility(VISIBLE);
				clearRightImage = false;
			}
		}

		if (clearRightImage) {
			rightImage.setImageDrawable(null);
			rightImage.setVisibility(GONE);
		}

		// Handle left image
		if (props.containsKey("leftImage")) {
			String path = TiConvert.toString(props, "leftImage");
			String url = tiContext.resolveUrl(null, path);

			Drawable d = loadDrawable(url);
			if (d != null) {
				leftImage.setImageDrawable(d);
				leftImage.setVisibility(VISIBLE);
			}
		} else {
			leftImage.setImageDrawable(null);
			leftImage.setVisibility(GONE);
		}

		if (props.containsKey("height")) {
			if (!props.get("height").equals("auto")) {
				height = TiConvert.toInt(props, "height");
			}
		}
		
		TiDict dp = rp.getParent().getDynamicProperties();
		if (dp.containsKey("minRowHeight"))
		{
			int minRowHeight = TiConvert.toInt(dp, "minRowHeight");
			if (height < 0)
			{
				height = minRowHeight;
			}
			else
			{
				height = Math.max(minRowHeight,height);
			}
		}
		

		if (rp.hasControls()) {
			ArrayList<TiViewProxy> proxies = rp.getControls();
			int len = proxies.size();
			if (views == null) {
				views = new TiUIView[len];
			}
			for (int i = 0; i < len; i++) {
				TiUIView view = views[i];
				TiViewProxy proxy = proxies.get(i);
				if (view == null) {
					if (proxy.peekView() != null) {
						proxy.releaseViews();
					}
					view = proxy.getView(tiContext.getActivity());
					views[i] = view;
				}
				view.setProxy(proxy);
				view.processProperties(proxy.getDynamicProperties());
				View v = view.getNativeView();
				if (v.getParent() == null) {
					content.addView(v, view.getLayoutParams());
				}
			}
		} else {
			String title = "Missing title";
			if (rp.getDynamicValue("title") != null) {
				title = TiConvert.toString(rp.getDynamicValue("title"));
			}

			if (views == null) {
				views = new TiUIView[1];
				views[0] = new TiUILabel(rp);
			}
			TiUILabel t = (TiUILabel) views[0];
			t.setProxy(rp);
			t.processProperties(filterProperties(rp.getDynamicProperties()));
			View v = t.getNativeView();
			if (v.getParent() == null) {
				TextView tv = (TextView) v;
				//tv.setTextColor(Color.WHITE);
				TiCompositeLayout.LayoutParams params = (TiCompositeLayout.LayoutParams) t.getLayoutParams();
				params.optionLeft = 5;
				params.optionRight = 5;
				content.addView(v, params);
			}
		}
	}


	@Override
	protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
	{
		int w = MeasureSpec.getSize(widthMeasureSpec);
		int wMode = MeasureSpec.getMode(widthMeasureSpec);
		int h = MeasureSpec.getSize(heightMeasureSpec);
		int hMode = MeasureSpec.getMode(heightMeasureSpec);

		int imageHMargin = 0;

		int leftImageWidth = 0;
		int leftImageHeight = 0;

		if (leftImage != null && leftImage.getVisibility() != View.GONE) {
			measureChild(leftImage, widthMeasureSpec, heightMeasureSpec);
			leftImageWidth = leftImage.getMeasuredWidth();
			leftImageHeight = leftImage.getMeasuredHeight();
			imageHMargin += LEFT_MARGIN;
		}

		int rightImageWidth = 0;
		int rightImageHeight = 0;

		if (rightImage != null && rightImage.getVisibility() != View.GONE) {
			measureChild(rightImage, widthMeasureSpec, heightMeasureSpec);
			rightImageWidth = rightImage.getMeasuredWidth();
			rightImageHeight = rightImage.getMeasuredHeight();
			imageHMargin += RIGHT_MARGIN;
		}

		int adjustedWidth = w - leftImageWidth - rightImageWidth - imageHMargin;
		//int adjustedWidth = w;

		measureChild(content, MeasureSpec.makeMeasureSpec(adjustedWidth, wMode), heightMeasureSpec);

		if(hMode == MeasureSpec.UNSPECIFIED) {
			if (height == -1) {
				h = Math.max(h, Math.max(content.getMeasuredHeight(), Math.max(leftImageHeight, rightImageHeight)));
			} else {
				h = height;
			}
			measureChild(content, MeasureSpec.makeMeasureSpec(adjustedWidth, wMode), MeasureSpec.makeMeasureSpec(h, MeasureSpec.EXACTLY));
		}
		
		setMeasuredDimension(w, Math.max(h, Math.max(leftImageHeight, rightImageHeight)));
	}

	@Override
	protected void onLayout(boolean changed, int left, int top, int right, int bottom)
	{
		int contentLeft = left;
		int contentRight = right;
		bottom = bottom - top;
		top = 0;

		int height = bottom - top;

		if (leftImage != null && leftImage.getVisibility() != GONE) {
			int w = leftImage.getMeasuredWidth();
			int h = leftImage.getMeasuredHeight();
			int leftMargin = LEFT_MARGIN;

			contentLeft += w + leftMargin;
			int offset = (height - h) / 2;
			leftImage.layout(left+leftMargin, top+offset, left+leftMargin+w, top+offset+h);
		}

		if (rightImage != null && rightImage.getVisibility() != GONE) {
			int w = rightImage.getMeasuredWidth();
			int h = rightImage.getMeasuredHeight();
			int rightMargin = RIGHT_MARGIN;

			contentRight -= w + rightMargin;
			int offset = (height - h) / 2;
			rightImage.layout(right-w-rightMargin, top+offset, right-rightMargin, top+offset+h);
		}

		if (hasControls) {
			contentLeft = left + LEFT_MARGIN;
			contentRight = right - RIGHT_MARGIN;
		}

		content.layout(contentLeft, top, contentRight, bottom);
	}

	private static String[] filteredProperties = new String[]{
		"backgroundImage", "backgroundColor"
	};
	private TiDict filterProperties(TiDict d)
	{
		TiDict filtered = new TiDict(d);
		for (int i = 0;i < filteredProperties.length; i++) {
			if (filtered.containsKey(filteredProperties[i])) {
				filtered.remove(filteredProperties[i]);
			}
		}
		return filtered;
	}

	@Override
	public boolean providesOwnSelector() {
		return true;
	}
}
