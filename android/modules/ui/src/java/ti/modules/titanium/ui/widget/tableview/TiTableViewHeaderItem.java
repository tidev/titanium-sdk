/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import org.appcelerator.titanium.util.TiUIHelper;
import org.appcelerator.titanium.view.TiBorderWrapperView;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.tableview.TableViewModel.Item;
import android.app.Activity;
import android.content.Context;
import android.graphics.Color;
import android.os.Handler;
import android.view.Gravity;
import android.view.View;
import android.view.View.MeasureSpec;
import android.widget.RelativeLayout;
import android.widget.TextView;

public class TiTableViewHeaderItem extends TiBaseTableViewItem
{
	private RowView rowView;
	private TiUIView headerView;
	private boolean isHeaderView = false;

	class RowView extends RelativeLayout
	{
		private TextView textView;
		private Item item;

		public RowView(Context context)
		{
			super(context);
			setGravity(Gravity.CENTER_VERTICAL);

			textView = new TextView(context);
			textView.setFocusable(false);
			textView.setFocusableInTouchMode(false);
			RelativeLayout.LayoutParams params =
				new RelativeLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT);
			params.addRule(CENTER_VERTICAL);
			params.alignWithParent = true;
			addView(textView, params);

			setPadding(0, 0, 0, 0);
			setMinimumHeight((int) TiUIHelper.getRawDIPSize(18, context));
			setVerticalFadingEdgeEnabled(false);
			TiUIHelper.styleText(textView, "", "14sp", "normal"); // TODO font
			textView.setBackgroundColor(Color.rgb(169, 169, 169));
			textView.setTextColor(Color.WHITE);
			TiUIHelper.setTextViewDIPPadding(textView, 5, 0);
		}

		public void setRowData(Item item)
		{
			this.item = item;
			if (item.headerText != null) {
				textView.setText(item.headerText, TextView.BufferType.NORMAL);
			} else if (item.footerText != null) {
				textView.setText(item.footerText, TextView.BufferType.NORMAL);
			}
		}

		public Item getRowData()
		{
			return item;
		}
	}

	public TiTableViewHeaderItem(Activity activity)
	{
		super(activity);
		this.handler = new Handler(this);
		rowView = new RowView(activity);
		this.addView(rowView, new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));
		setMinimumHeight((int) TiUIHelper.getRawDIPSize(18, activity));
	}

	public TiTableViewHeaderItem(Activity activity, TiUIView headerView)
	{
		super(activity);

		this.handler = new Handler(this);
		this.addView(headerView.getOuterView(), headerView.getOuterView().getLayoutParams());
		this.setLayoutParams(headerView.getOuterView().getLayoutParams());
		setMinimumHeight((int) TiUIHelper.getRawDIPSize(18, activity));
		this.headerView = headerView;
		this.isHeaderView = true;
	}

	public void setRowData(Item item)
	{
		if (!isHeaderView) {
			rowView.setRowData(item);
		}
	}

	public Item getRowData()
	{
		if (rowView != null) {
			return rowView.getRowData();
		}
		return null;
	}

	@Override
	protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec)
	{
		measureChildren(widthMeasureSpec, heightMeasureSpec);
		int w = MeasureSpec.getSize(widthMeasureSpec);
		int h = 0;
		// If measure spec is not specified, height should behave as Ti.UI.SIZE
		if (MeasureSpec.getMode(heightMeasureSpec) == MeasureSpec.UNSPECIFIED) {
			h = getSuggestedMinimumHeight();
		} else {
			h = Math.max(MeasureSpec.getSize(heightMeasureSpec), getSuggestedMinimumHeight());
		}
		setMeasuredDimension(resolveSize(w, widthMeasureSpec), resolveSize(h, heightMeasureSpec));
	}

	@Override
	protected void onLayout(boolean changed, int left, int top, int right, int bottom)
	{
		if (!isHeaderView) {
			rowView.layout(left, 0, right, bottom - top);
		} else {
			View view = headerView.getOuterView();
			view.layout(left, 0, right, bottom - top);
			// Also layout the inner native view when we have borders
			if (view instanceof TiBorderWrapperView) {
				headerView.getNativeView().layout(left, 0, right, bottom - top);
			}
		}
	}
}
