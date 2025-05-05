/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.android.notificationmanager;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;

import androidx.core.app.NotificationCompat.Style;

@Kroll.proxy
abstract class StyleProxy extends KrollProxy
{

	protected Style style;

	public Style getStyle()
	{
		return style;
	}
}
