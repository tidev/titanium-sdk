/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium;

import java.util.concurrent.atomic.AtomicInteger;

import org.appcelerator.titanium.util.TiActivitySupportHelper;

import android.util.SparseArray;

/**
 * A registry for TiBaseActivity<->TiActivitySupportHelper creation logic.
 */
public class TiActivitySupportHelpers
{
	protected static AtomicInteger supportHelperIdGenerator = new AtomicInteger();
	protected static SparseArray<TiActivitySupportHelper> supportHelpers = new SparseArray<TiActivitySupportHelper>();

	public static int addSupportHelper(TiActivitySupportHelper supportHelper)
	{
		int supportHelperId = supportHelperIdGenerator.incrementAndGet();
		supportHelpers.put(supportHelperId, supportHelper);
		return supportHelperId;
	}

	public static TiActivitySupportHelper retrieveSupportHelper(TiBaseActivity activity, int supportHelperId)
	{
		TiActivitySupportHelper supportHelper = supportHelpers.get(supportHelperId);
		if (supportHelper != null) {
			supportHelper.setActivity(activity);
		}
		return supportHelper;
	}

	public static void removeSupportHelper(int supportHelperId)
	{
		supportHelpers.remove(supportHelperId);
	}

	public static void dispose()
	{
		supportHelpers.clear();
	}
}
