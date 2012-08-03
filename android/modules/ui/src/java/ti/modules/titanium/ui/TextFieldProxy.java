/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.ui.widget.TiUIText;
import android.app.Activity;
import android.os.Message;

@Kroll.proxy(creatableInModule=UIModule.class, propertyAccessors = {
	TiC.PROPERTY_AUTOCAPITALIZATION,
	TiC.PROPERTY_AUTOCORRECT,
	TiC.PROPERTY_AUTO_LINK,
	TiC.PROPERTY_CLEAR_ON_EDIT,
	TiC.PROPERTY_COLOR,
	TiC.PROPERTY_EDITABLE,
	TiC.PROPERTY_ELLIPSIZE,
	TiC.PROPERTY_ENABLE_RETURN_KEY,
	TiC.PROPERTY_FONT,
	TiC.PROPERTY_HINT_TEXT,
	TiC.PROPERTY_KEYBOARD_TYPE,
	TiC.PROPERTY_MAX_LENGTH,
	TiC.PROPERTY_PASSWORD_MASK,
	TiC.PROPERTY_TEXT_ALIGN,
	TiC.PROPERTY_VALUE,
	TiC.PROPERTY_VERTICAL_ALIGN,
	TiC.PROPERTY_RETURN_KEY_TYPE
})
public class TextFieldProxy extends TiViewProxy
{
	private static final int MSG_FIRST_ID = TiViewProxy.MSG_LAST_ID + 1;
	private static final int MSG_SET_SELECTION = MSG_FIRST_ID + 201;

	public TextFieldProxy()
	{
		super();
		defaultValues.put(TiC.PROPERTY_VALUE, "");
		defaultValues.put(TiC.PROPERTY_MAX_LENGTH, -1);

	}

	public TextFieldProxy(TiContext tiContext)
	{
		this();
	}

	@Override
	public void handleCreationArgs(KrollModule createdInModule, Object[] args) {
		super.handleCreationArgs(createdInModule, args);

	}

	@Override
	public TiUIView createView(Activity activity)
	{
		return new TiUIText(this, true);
	}
	
	@Kroll.method
	public Boolean hasText()
	{
		Object text = getProperty(TiC.PROPERTY_VALUE);
		if (text != null && text instanceof String) {
			return (((String)text).length() > 0);
		}
		return false;
	}
	
	@Kroll.method
	public void setSelection(int start, int stop)
	{
		TiUIView v = getOrCreateView();
		if (v != null) {
			if (TiApplication.isUIThread()) {
				((TiUIText)v).setSelection(start, stop);
				return;
			}
			KrollDict args = new KrollDict();
			args.put(TiC.PROPERTY_START, start);
			args.put(TiC.PROPERTY_STOP, stop);
			getMainHandler().obtainMessage(MSG_SET_SELECTION, args).sendToTarget();
		}
	}
	
	public boolean handleMessage(Message msg)
	{
		switch (msg.what) {
			case MSG_SET_SELECTION: {
				TiUIView v = getOrCreateView();
				if (v != null) {
					Object argsObj = msg.obj;
					if (argsObj instanceof KrollDict) {
						KrollDict args = (KrollDict) argsObj;
						((TiUIText)v).setSelection(args.getInt(TiC.PROPERTY_START), args.getInt(TiC.PROPERTY_STOP));
					}
				}
				return true;
			}
			
			default: {
				return super.handleMessage(msg);
			}
		}
	}
	
}
