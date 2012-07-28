/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.searchbar.TiUISearchBar;
import android.app.Activity;

@Kroll.proxy(creatableInModule=UIModule.class, propertyAccessors = {
	"prompt", "promptid",
	"hintText", "hinttextid",
	"showCancel", "barColor",
	TiC.PROPERTY_VALUE
})
public class SearchBarProxy extends TiViewProxy
{
	public SearchBarProxy()
	{
		super();
	}

	public SearchBarProxy(TiContext tiContext)
	{
		this();
	}

	@Override
	public void handleCreationArgs(KrollModule createdInModule, Object[] args) {
		super.handleCreationArgs(createdInModule, args);
		setProperty(TiC.PROPERTY_VALUE, "");
	}

	@Override
	protected KrollDict getLangConversionTable() {
		KrollDict table = new KrollDict();
		table.put("prompt", "promptid");
		table.put("hintText", "hinttextid");
		return table;
	}

	@Override
	public TiUIView createView(Activity activity) {
		return new TiUISearchBar(this);
	}
}
