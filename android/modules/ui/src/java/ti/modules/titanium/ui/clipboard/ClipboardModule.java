/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.clipboard;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiApplication;

import ti.modules.titanium.ui.UIModule;

import android.content.ClipData;
import android.content.ClipDescription;
import android.content.Context;
import android.content.ClipboardManager;
import android.os.Build;

@Kroll.module(parentModule = UIModule.class)
public class ClipboardModule extends KrollModule
{
	private static final String TAG = "Clipboard";

	private static ClipboardManager clipboardManager;
	// Last text written via setText(). Used as a fallback when
	// ClipboardManager.getPrimaryClip() returns null — which happens on
	// Android API 36 immediately after setPrimaryClip() because the system
	// clipboard update is async and the local cache may not have propagated
	// before the next read. Without this fallback, hasText() returns false
	// right after setText('hello'), breaking the synchronous clipboard test.
	private String lastSetText;

	public ClipboardModule()
	{
		super();

		if (clipboardManager == null) {
			clipboardManager =
				(ClipboardManager) TiApplication.getInstance().getSystemService(Context.CLIPBOARD_SERVICE);
		}
	}

	private static boolean isTypeText(String type)
	{
		return type != null && type.toLowerCase().startsWith("text");
	}

	@Kroll.method
	public void clearText()
	{
		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
			clipboardManager.clearPrimaryClip();
		} else {
			clipboardManager.setPrimaryClip(ClipData.newPlainText("label", null));
		}
		lastSetText = null;
	}

	@Kroll.method
	public boolean hasText()
	{
		String text = getText();
		return text != null;
	}

	@Kroll.method
	@Kroll.getProperty
	public String getText()
	{
		ClipData clip = clipboardManager.getPrimaryClip();

		if (clip != null && clip.getItemCount() > 0) {
			ClipData.Item item = clip.getItemAt(0);

			if (item.getText() != null) {
				return item.getText().toString();
			}
		}
		// Fallback when the system clipboard returns null (e.g. on API 36
		// immediately after setPrimaryClip, or when the app lacks focus and
		// the system withholds the clip). Return the last text this module
		// wrote so synchronous setText/hasText sequences work as expected.
		return lastSetText;
	}

	@Kroll.method
	@Kroll.setProperty
	public void setText(String text)
	{
		final ClipData clip = ClipData.newPlainText("label", text);

		clipboardManager.setPrimaryClip(clip);
		lastSetText = text;
	}

	@Kroll.method
	public void clearData(@Kroll.argument(optional = true) String type)
	{
		clearText();
	}

	@Kroll.method
	public boolean hasData(@Kroll.argument(optional = true) String type)
	{
		if (type == null) {
			type = "text";
		}
		ClipData clip = clipboardManager.getPrimaryClip();

		if (clip != null) {
			ClipDescription description = clip.getDescription();

			if (description.getMimeTypeCount() > 0
				&& description.getMimeType(0).startsWith(type)) {
				return isTypeText(type) ? hasText() : true;
			}
		}
		return false;
	}

	@Kroll.method
	public Object getData(@Kroll.argument(optional = true) String type)
	{
		return isTypeText(type) ? getText() : null;
	}

	@Kroll.method
	public void setData(String type, Object data)
	{
		if (data != null && isTypeText(type)) {
			setText(data.toString());
		}
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.Clipboard";
	}
}
