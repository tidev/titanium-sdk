/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package ti.modules.titanium.ui;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiProxy;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.Log;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

public class EmailDialogProxy extends TiViewProxy {
	
	public EmailDialogProxy(TiContext tiContext, Object[] args) {
		super(tiContext, args);
		// TODO Auto-generated constructor stub
	}

	public static int CANCELLED = 0;
	public static int SAVED = 1;
	public static int SENT = 2;
	public static int FAILED = 3;
	
	private String subject;

	
	public void open(){
		Log.d("EmailDialogProxy", "opening, with subject " + this.getDynamicValue("subject"));
	}
	

	@Override
	public TiUIView createView(Activity activity) {
		// TODO Auto-generated method stub
		return null;
	}
	
	

}
