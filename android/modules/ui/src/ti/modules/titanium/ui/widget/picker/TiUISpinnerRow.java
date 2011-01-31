/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

/**
 * This class does not do anything, because for our spinner-style picker
 * we support only text (the "title" property of the PickerRowProxy), not complex
 * views.  But to keep the spinner in our view meme, a class was required.
 */
package ti.modules.titanium.ui.widget.picker;

import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

public class TiUISpinnerRow extends TiUIView
{
	public TiUISpinnerRow(TiViewProxy proxy)
	{
		super(proxy);
	}
}
