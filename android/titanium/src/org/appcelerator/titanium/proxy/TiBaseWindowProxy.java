package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.annotations.Kroll;

import android.app.Activity;

/**
 * This class exists to allow JS wrapping of the abstract methods
 */
@Kroll.proxy
public class TiBaseWindowProxy extends TiWindowProxy
{

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
