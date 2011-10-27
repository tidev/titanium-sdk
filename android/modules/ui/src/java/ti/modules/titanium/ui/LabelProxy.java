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

import ti.modules.titanium.ui.widget.TiUILabel;
import android.app.Activity;

@Kroll.proxy(creatableInModule=UIModule.class, propertyAccessors = {
	TiC.PROPERTY_AUTO_LINK,
	TiC.PROPERTY_COLOR,
	TiC.PROPERTY_ELLIPSIZE,
	TiC.PROPERTY_FONT,
	TiC.PROPERTY_HIGHLIGHTED_COLOR,
	TiC.PROPERTY_HTML,
	TiC.PROPERTY_TEXT,
	TiC.PROPERTY_TEXT_ALIGN,
	TiC.PROPERTY_TEXTID,
	TiC.PROPERTY_WORD_WRAP
})
public class LabelProxy extends TiViewProxy
{
	public LabelProxy()
	{
	}

	public LabelProxy(TiContext tiContext)
	{
	}

	@Override
	public void handleCreationArgs(KrollModule createdInModule, Object[] args)
	{
		setProperty(TiC.PROPERTY_TEXT, "");
		super.handleCreationArgs(createdInModule, args);
	}

	@Override
	protected KrollDict getLangConversionTable()
	{
		KrollDict table = new KrollDict();
		table.put(TiC.PROPERTY_TEXT, TiC.PROPERTY_TEXTID);
		return table;
	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUILabel(this);
	}
}
