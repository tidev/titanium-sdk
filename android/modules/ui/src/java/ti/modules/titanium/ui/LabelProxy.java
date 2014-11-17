/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.AsyncResult;
import org.appcelerator.kroll.common.TiMessenger;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUILabel;
import android.app.Activity;
import android.os.Message;

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
	TiC.PROPERTY_WORD_WRAP,
	TiC.PROPERTY_VERTICAL_ALIGN,
	TiC.PROPERTY_SHADOW_OFFSET,
	TiC.PROPERTY_SHADOW_COLOR,
	TiC.PROPERTY_SHADOW_RADIUS,
	TiC.PROPERTY_INCLUDE_FONT_PADDING
})
public class LabelProxy extends TiViewProxy
{
	private static final int MSG_FIRST_ID = KrollProxy.MSG_LAST_ID + 1;
	private static final int MSG_SET_ATTRIBUTED_STRING = MSG_FIRST_ID + 100;
	protected static final int MSG_LAST_ID = MSG_FIRST_ID + 999;
	
	private AttributedStringProxy attributedString = null;
	
	public LabelProxy()
	{
		defaultValues.put(TiC.PROPERTY_TEXT, "");
	}

	public LabelProxy(TiContext tiContext)
	{
		this();
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
	
	@Kroll.getProperty
	@Kroll.method
	public AttributedStringProxy getAttributedString()
	{
		return attributedString;
	}

	@Kroll.setProperty
	@Kroll.method
	public void setAttributedString(AttributedStringProxy attrString)
	{
		attributedString = attrString;
		if (TiApplication.isUIThread()) {
			handleSetAttributedString(attributedString);
		} else {
			TiMessenger.sendBlockingMainMessage(getMainHandler().obtainMessage(MSG_SET_ATTRIBUTED_STRING), attributedString);
		}
	}

	private void handleSetAttributedString(AttributedStringProxy attrString)
	{
		((TiUILabel) getOrCreateView()).setAttributedString(attrString);
	}

	// This handler callback is tied to the UI thread.
	@SuppressWarnings({ "unchecked", "rawtypes" })
	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_SET_ATTRIBUTED_STRING: {
				AsyncResult result = (AsyncResult) msg.obj;
				handleSetAttributedString((AttributedStringProxy) result.getArg());
				result.setResult(null);
				return true;
			}
		}
		return super.handleMessage(msg);
	}
	
	@Override
	public String getApiName()
	{
		return "Ti.UI.Label";
	}
}
