/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.tableviewseparatorstyle;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;

import ti.modules.titanium.ui.UIModule;
import ti.modules.titanium.ui.widget.tableview.TiTableView;

@Kroll.module(parentModule=UIModule.class)
public class TableViewSeparatorStyleModule extends KrollModule
{
	@Kroll.constant public static final int NONE = TiTableView.SEPARATOR_STYLE_NONE;
	@Kroll.constant public static final int SINGLE_LINE = TiTableView.SEPARATOR_STYLE_SINGLE_LINE;

	public TableViewSeparatorStyleModule()
	{
		super();
	}

	public TableViewSeparatorStyleModule(TiContext tiContext)
	{
		this();
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.TableViewSeparatorStyle";
	}
}
