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

	private TiViewProxy wrappedViewProxy;


	/**
	 * Called to associate a view with a JS window wrapper 
	 * 
	 * @param viewProxy			real view that the JS wrapper represents
	 */
	@Kroll.method
	public void setWindowView(TiViewProxy viewProxy) {
		/* we need to associate the wrapped view with the JS window wrapper 
		 * so we can correctly reference the "real" view later from the JS
		 * window wrapper.  One example use is firing events to a window associated
		 * with a tab (the tab only has a reference to the wrapper)
		 */
		wrappedViewProxy = viewProxy;

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
		return wrappedViewProxy;
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
