package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiC;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.util.Log;

/**
 * This class exists to allow JS wrapping of the abstract methods
 */
@Kroll.proxy(propertyAccessors={
	TiC.PROPERTY_NATIVE_VIEW
})
public class TiBaseWindowProxy extends TiWindowProxy
{
	private static final String TAG = "TiBaseWindow";

	@Override
	public TiUIView peekView()
	{
		if (view != null) {
			return view;
		}

		if (hasProperty(TiC.PROPERTY_NATIVE_VIEW)) {
			TiViewProxy nativeViewProxy = (TiViewProxy) getProperty(TiC.PROPERTY_NATIVE_VIEW);
			view = nativeViewProxy.peekView();
			setModelListener(view);
			return view;
		} else {
			Log.w(TAG, "No nativeView set!");
			return null;
		}
	}

	@Override
	public TiUIView getOrCreateView() {
		return peekView();
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
