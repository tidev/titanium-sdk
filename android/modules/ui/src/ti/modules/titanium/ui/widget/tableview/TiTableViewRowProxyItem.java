/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.widget.tableview;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.util.TiConfig;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiCompositeLayout;

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
	TiCompositeLayout layout;

	public TiTableViewRowProxyItem(TiContext tiContext)
	{
		super(tiContext);

		this.handler = new Handler(this);
		this.layout = new TiCompositeLayout(tiContext.getActivity());
		this.addView(layout, new LayoutParams(LayoutParams.FILL_PARENT,50));
	}

	public void setRowData(TiTableViewItemOptions defaults, Item item)
	{
		TableViewRowProxy rp = (TableViewRowProxy) item.proxy;
		if (rp.hasControls()) {
			//TODO deal with controls
		} else {
			String title = "Missing title";
			if (rp.getDynamicValue("title") != null) {
				title = TiConvert.toString(rp.getDynamicValue("title"));
			}

			TiUILabel t = new TiUILabel(rp);
			t.processProperties(rp.getDynamicProperties());
			View v = t.getNativeView();
			TextView tv = (TextView) v;
			tv.setTextColor(Color.WHITE);
			tv.setBackgroundColor(Color.RED);
			TiCompositeLayout.LayoutParams params = (TiCompositeLayout.LayoutParams) t.getLayoutParams();
			params.autoFillsWidth = true;
			params.autoHeight = false;
			params.optionHeight = 50;
			layout.addView(v, params);
		}
	}
}
