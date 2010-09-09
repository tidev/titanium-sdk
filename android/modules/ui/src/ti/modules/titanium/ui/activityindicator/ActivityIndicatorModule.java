/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.activityindicator;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;

import ti.modules.titanium.ui.UIModule;
import ti.modules.titanium.ui.widget.TiUIActivityIndicator;

@Kroll.module(parentModule=UIModule.class)
public class ActivityIndicatorModule extends KrollProxy
{
	@Kroll.constant public static final int STATUS_BAR = TiUIActivityIndicator.STATUS_BAR;
	@Kroll.constant public static final int DIALOG = TiUIActivityIndicator.DIALOG;

	@Kroll.constant public static final int INDETERMINANT = TiUIActivityIndicator.INDETERMINANT;
	@Kroll.constant public static final int DETERMINANT = TiUIActivityIndicator.DETERMINANT;
	
	public ActivityIndicatorModule(TiContext tiContext) {
		super(tiContext);
	}
}
