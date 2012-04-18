package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;

/**
 * This class exists to allow JS wrapping of the abstract methods
 */
@Kroll.proxy
public class TiBaseWindowProxy extends TiWindowProxy
{
	private static final String TAG = "TiBaseWindow";


	/**
	 * Called to associate a view with a JS window wrapper 
	 * 
	 * @param viewProxy			real view that the JS wrapper represents
	 */
	@Kroll.method
	public void setWindowView(TiViewProxy viewProxy) {
		TiUIView view = viewProxy.peekView();
		setView(view);
		setModelListener(view);
	}

	/**
	 * Returns the view that is wrapped by this object.  The caller is
	 * expected to check the return value for null
	 * 
	 * @return		view proxy that is wrapped by this object
	 * 
	 */
	public TiViewProxy getWrappedView() {
		return view.getProxy();
	}

	@Override
	public TiUIView getOrCreateView() {
		throw new IllegalStateException("Cannot create view on TiBaseWindowProxy");
	}

	@Override
	protected void handleOpen(KrollDict options)
	{
	}

	@Override
	protected void handleClose(KrollDict options)
	{
	}

	@Override
	protected Activity handleGetActivity()
	{
		return null;
	}

}
