/**
 * 
 */
package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.view.TiUIView;

import ti.modules.titanium.android.AndroidModule;

@Kroll.proxy(creatableInModule=AndroidModule.class)
public class TiActivityWindowProxy extends TiWindowProxy 
{
	public TiActivityWindowProxy(TiContext tiContext) 
	{
		super(tiContext);
	}

	public void setView(TiUIView view) {
		this.view = view;
	}
	
	@Override
	protected void handleClose(KrollDict options) 
	{
	}

	@Override
	protected void handleOpen(KrollDict options) 
	{
	}
}
