/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiUIHelper;

import ti.modules.titanium.ui.widget.tableview.TableViewModel.Item;
import android.content.Context;
import android.graphics.Color;
import android.os.Handler;
import android.view.Gravity;
import android.widget.RelativeLayout;
import android.widget.TextView;

public class TiTableViewHeaderItem extends TiBaseTableViewItem
{
	private static final String LCAT = "TitaniamTableViewItem";
	private static final boolean DBG = TiConfig.LOGD;

	private RowView rowView;

	class RowView extends RelativeLayout
	{
		private TextView textView;
		private Item item;

		public RowView(Context context) {
			super(context);

			setGravity(Gravity.CENTER_VERTICAL);

			textView = new TextView(context);
			textView.setId(101);
			textView.setFocusable(false);
			textView.setFocusableInTouchMode(false);
			RelativeLayout.LayoutParams params = new RelativeLayout.LayoutParams(LayoutParams.FILL_PARENT, LayoutParams.FILL_PARENT);
			params.addRule(CENTER_VERTICAL);
			params.alignWithParent = true;
			addView(textView, params);

			setPadding(0, 0, 0, 0);
			setMinimumHeight(18);
			setVerticalFadingEdgeEnabled(false);
			TiUIHelper.styleText(textView, "", "10dp", "normal"); //TODO font
			textView.setBackgroundColor(Color.DKGRAY);
			textView.setTextColor(Color.LTGRAY);
			textView.setPadding(4, 2, 4, 2);
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
		
		public Item getRowData() {
			return item;
		}
	}


	public TiTableViewHeaderItem(TiContext tiContext)
	{
		super(tiContext);

		this.handler = new Handler(this);
		rowView = new RowView(tiContext.getActivity());
		this.addView(rowView, new LayoutParams(LayoutParams.FILL_PARENT,LayoutParams.FILL_PARENT));
		setMinimumHeight(18);
	}

	public void setRowData(Item item) {
		rowView.setRowData(item);
	}

	public Item getRowData() {
		return rowView.getRowData();
	}
	
	@Override
	protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
		measureChildren(widthMeasureSpec, heightMeasureSpec);
		int w = MeasureSpec.getSize(widthMeasureSpec);
		int h = Math.max(MeasureSpec.getSize(heightMeasureSpec), getSuggestedMinimumHeight());
		setMeasuredDimension(resolveSize(w, widthMeasureSpec), resolveSize(h, heightMeasureSpec));
	}

	@Override
	protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
		rowView.layout(left, 0, right, bottom - top);
	}
}
