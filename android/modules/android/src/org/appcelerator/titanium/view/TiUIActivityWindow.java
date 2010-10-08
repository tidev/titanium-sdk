/**
 * 
 */
package org.appcelerator.titanium.view;

import org.appcelerator.titanium.proxy.TiActivityWindowProxy;

import ti.modules.titanium.android.TiBaseActivity;

/**
 * @author dthorp
 *
 */
public class TiUIActivityWindow extends TiUIView 
{

	protected TiBaseActivity activity;
	
	public TiUIActivityWindow(TiActivityWindowProxy proxy, TiBaseActivity activity, TiCompositeLayout layout) 
	{
		super(proxy);
		this.activity = activity;
		
		proxy.setView(this);
		
		setNativeView(layout);
		proxy.setModelListener(this);
		
		layout.setClickable(true);
		registerForTouch(layout);

	}
	
	public void open() {
		getProxy().realizeViews(activity, this);
	}
}
