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

	/*@Override
	public TiUIView peekView()
	{
		if (view != null) {
			return view;
		}

		if (hasProperty(TiC.PROPERTY_VIEW)) {
			TiViewProxy nativeViewProxy = (TiViewProxy) getProperty(TiC.PROPERTY_VIEW);
			view = nativeViewProxy.peekView();
			setModelListener(view);
			return view;
		} else {
			Log.w(TAG, "No nativeView set!");
			return null;
		}
	}*/

	@Kroll.method
	public void setWindowView(TiViewProxy viewProxy) {
		TiUIView view = viewProxy.peekView();
		setView(view);
		setModelListener(view);
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
