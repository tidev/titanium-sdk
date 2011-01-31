/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

/**
 * This class does not do anything, because it's used as the "view" for the
 * columns in the android native picker (our view for which is the TiUINativePicker
 * class), and we don't really put custom views into that.  But to keep the 
 * picker completely in our view meme, a class was required.
 */

package ti.modules.titanium.ui.widget.picker;

import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.view.TiUIView;

public class TiUIPickerColumn extends TiUIView
{
	public TiUIPickerColumn(TiViewProxy proxy)
	{
		super(proxy);
	}
}
