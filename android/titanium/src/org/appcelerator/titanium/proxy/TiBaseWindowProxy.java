package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.view.TiUIView;

import android.app.Activity;
import android.util.Log;

/**
 * This class exists to allow JS wrapping of the abstract methods
 */
@Kroll.proxy
public class TiBaseWindowProxy extends TiWindowProxy
{
	private static final String TAG = "TiBaseWindow";
	public static final String PROPERTY_NATIVE_VIEW = "nativeView";

	@Override
	public TiUIView getOrCreateView()
	{
		if (view != null) {
			return view;
		}

		if (hasProperty(PROPERTY_NATIVE_VIEW)) {
			TiViewProxy nativeViewProxy = (TiViewProxy) getProperty(PROPERTY_NATIVE_VIEW);
			view = nativeViewProxy.peekView();
			return view;
		} else {
			Log.w(TAG, "getOrCreateView called without nativeView set");
			return null;
		}
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
