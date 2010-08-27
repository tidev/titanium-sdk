/**
 * 
 */
package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.view.TiUIView;

public class TiActivityWindowProxy extends TiWindowProxy 
{

	public TiActivityWindowProxy(TiContext tiContext, Object[] args) 
	{
		super(tiContext, args);
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
