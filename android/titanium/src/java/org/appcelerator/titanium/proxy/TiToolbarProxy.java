package org.appcelerator.titanium.proxy;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.view.TiUIView;

import android.view.View;

/**
 * Abstract class used to pass TiToolbar's native Toolbar view backwards through modules' dependency.
 */
@Kroll.proxy
public abstract class TiToolbarProxy extends TiViewProxy
{

	public abstract View getToolbarInstance();
}
