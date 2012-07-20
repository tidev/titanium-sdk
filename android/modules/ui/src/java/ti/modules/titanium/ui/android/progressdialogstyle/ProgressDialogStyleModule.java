/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.android.progressdialogstyle;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;

import ti.modules.titanium.ui.android.AndroidModule;
import ti.modules.titanium.ui.widget.TiUIProgressDialog;

@Kroll.module(parentModule=AndroidModule.class)
public class ProgressDialogStyleModule extends KrollModule
{
	@Kroll.constant public static final int STATUS_BAR = TiUIProgressDialog.STATUS_BAR;
	@Kroll.constant public static final int DIALOG = TiUIProgressDialog.DIALOG;

	@Kroll.constant public static final int INDETERMINANT = TiUIProgressDialog.INDETERMINANT;
	@Kroll.constant public static final int DETERMINANT = TiUIProgressDialog.DETERMINANT;

	public ProgressDialogStyleModule()
	{
		super();
	}

	public ProgressDialogStyleModule(TiContext tiContext)
	{
		this();
	}
}