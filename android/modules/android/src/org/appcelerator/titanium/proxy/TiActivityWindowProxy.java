/**
 * 
 */
package org.appcelerator.titanium.proxy;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
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
	protected void handleClose(TiDict options) 
	{
	}

	@Override
	protected void handleOpen(TiDict options) 
	{
	}
}
