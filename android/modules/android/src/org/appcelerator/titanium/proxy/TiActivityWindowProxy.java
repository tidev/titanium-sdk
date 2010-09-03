/**
 * 
 */
package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.view.TiUIView;

@Kroll.proxy(creatableInModule="Android")
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
