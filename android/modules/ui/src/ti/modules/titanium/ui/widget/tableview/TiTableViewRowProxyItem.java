/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import java.util.ArrayList;
import java.util.HashMap;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiCompositeLayout;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.TableViewRowProxy;
import ti.modules.titanium.ui.widget.TiUILabel;
import ti.modules.titanium.ui.widget.tableview.TableViewModel.Item;
import android.graphics.Color;
import android.os.Handler;
import android.view.View;
import android.widget.TextView;

public class TiTableViewRowProxyItem extends TiBaseTableViewItem
{
	private static final String LCAT = "TitaniamTableViewItem";
	private static final boolean DBG = TiConfig.LOGD;

	private Item item;
	private TiCompositeLayout layout;
	private ArrayList<TiUIView> views;

	public TiTableViewRowProxyItem(TiContext tiContext)
	{
		super(tiContext);

		this.handler = new Handler(this);
		this.layout = new TiCompositeLayout(tiContext.getActivity());
		layout.setMinimumHeight(48);
		this.addView(layout, new LayoutParams(LayoutParams.FILL_PARENT,LayoutParams.WRAP_CONTENT));
		this.views = new ArrayList<TiUIView>();
	}

	public void setRowData(TiTableViewItemOptions defaults, Item item)
	{
		TableViewRowProxy rp = (TableViewRowProxy) item.proxy;
		layout.removeAllViews();

		if (rp.hasControls()) {
			//TODO deal with controls
		} else {
			String title = "Missing title";
			if (rp.getDynamicValue("title") != null) {
				title = TiConvert.toString(rp.getDynamicValue("title"));
			}

			if (views.size() == 0) {
				views.add(new TiUILabel(rp));
			}
			TiUILabel t = (TiUILabel) views.get(0);
			t.setProxy(rp);
			t.processProperties(rp.getDynamicProperties());
			View v = t.getNativeView();
			TextView tv = (TextView) v;
			tv.setTextColor(Color.WHITE);
			TiCompositeLayout.LayoutParams params = (TiCompositeLayout.LayoutParams) t.getLayoutParams();
			layout.addView(v, params);
		}
	}
}
