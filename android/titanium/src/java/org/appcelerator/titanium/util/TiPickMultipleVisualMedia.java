/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.ext.SdkExtensions;
import android.provider.MediaStore;

import androidx.activity.result.PickVisualMediaRequest;
import androidx.activity.result.contract.ActivityResultContracts;

public class TiPickMultipleVisualMedia extends ActivityResultContracts.PickMultipleVisualMedia
{
	private int maxItems;

	public TiPickMultipleVisualMedia(int maxItems)
	{
		super(maxItems);
		this.maxItems = maxItems;
	}

	public void updateMaxItems(int newMaxItems)
	{
		if (maxItems > 1) {
			this.maxItems = newMaxItems;
		}
	}

	@Override
	public Intent createIntent(Context context, PickVisualMediaRequest input)
	{
		Intent intent = super.createIntent(context, input);
		if (maxItems > 1 && Build.VERSION.SDK_INT >= Build.VERSION_CODES.R
			&& SdkExtensions.getExtensionVersion(Build.VERSION_CODES.R) >= 2) {
			intent.putExtra(MediaStore.EXTRA_PICK_IMAGES_MAX, maxItems);
		}
		return intent;
	}
}
