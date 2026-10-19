/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Rect;
import android.os.Build;

import androidx.window.layout.DisplayFeature;
import androidx.window.layout.FoldingFeature;
import androidx.window.layout.WindowLayoutInfo;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.TiApplication;

/**
 * Detects foldable devices and turns window layout changes into "windowState" app events.
 */
public final class TiFoldableHelper
{
	public static final String EVENT_WINDOW_STATE = "windowState";

	private static final String STATE_CLOSED = "CLOSED";
	private static final String OCCLUSION_NONE = "NONE";

	/** Set to true once a folding feature was reported. Covers devices without the hinge sensor feature. */
	private static boolean foldingFeatureObserved = false;
	/** Signature of the last fired event. Used to drop duplicate events from overlapping activities. */
	private static String lastEventSignature = null;

	private TiFoldableHelper()
	{
	}

	/**
	 * Determines if the device has a fold or hinge.
	 * @param context Context used to access the package manager.
	 * @return Returns true if the device is foldable.
	 */
	public static boolean isFoldable(Context context)
	{
		if (foldingFeatureObserved) {
			return true;
		}
		if ((context != null) && (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R)) {
			return context.getPackageManager().hasSystemFeature(PackageManager.FEATURE_SENSOR_HINGE_ANGLE);
		}
		return false;
	}

	/**
	 * Fires a "windowState" app event if the folding state changed since the last event.
	 * Does nothing on devices that are not foldable.
	 * @param context Context used to detect the device and to convert pixels.
	 * @param layoutInfo Layout info received from the window library.
	 */
	public static void onWindowLayoutInfoChanged(Context context, WindowLayoutInfo layoutInfo)
	{
		if ((context == null) || (layoutInfo == null)) {
			return;
		}

		FoldingFeature foldingFeature = null;
		for (DisplayFeature feature : layoutInfo.getDisplayFeatures()) {
			if (feature instanceof FoldingFeature) {
				foldingFeature = (FoldingFeature) feature;
				foldingFeatureObserved = true;
				break;
			}
		}
		if (!isFoldable(context)) {
			return;
		}

		KrollDict event = new KrollDict();
		if (foldingFeature == null) {
			// No fold within the window. The device is closed or the fold is outside of the window.
			event.put("state", STATE_CLOSED);
			event.put("occlusionType", OCCLUSION_NONE);
			event.put("orientation", null);
			event.put("isSeparating", false);
			event.put("bounds", null);
		} else {
			event.put("state", foldingFeature.getState().toString());
			event.put("occlusionType", foldingFeature.getOcclusionType().toString());
			event.put("orientation", foldingFeature.getOrientation().toString());
			event.put("isSeparating", foldingFeature.isSeparating());
			event.put("bounds", toDipDict(context, foldingFeature.getBounds()));
		}

		String signature = event.toString();
		if (signature.equals(lastEventSignature)) {
			return;
		}
		lastEventSignature = signature;
		TiApplication.getInstance().fireAppEvent(EVENT_WINDOW_STATE, event);
	}

	private static KrollDict toDipDict(Context context, Rect bounds)
	{
		float density = context.getResources().getDisplayMetrics().density;
		KrollDict dict = new KrollDict();
		dict.put("x", Math.round(bounds.left / density));
		dict.put("y", Math.round(bounds.top / density));
		dict.put("width", Math.round(bounds.width() / density));
		dict.put("height", Math.round(bounds.height() / density));
		return dict;
	}
}
