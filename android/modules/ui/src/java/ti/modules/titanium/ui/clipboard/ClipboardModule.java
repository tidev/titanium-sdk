/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.clipboard;

import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiApplication;

import android.content.Context;
import android.text.ClipboardManager;

import ti.modules.titanium.ui.UIModule;

@SuppressWarnings("deprecation")
@Kroll.module(parentModule = UIModule.class)
public class ClipboardModule extends KrollModule
{
	private String TAG = "Clipboard";

	public ClipboardModule()
	{
		super();
	}

	/**
	 * Get the native clipboard instance.
	 */
	private ClipboardManager board()
	{
		return (ClipboardManager) TiApplication.getInstance().getSystemService(Context.CLIPBOARD_SERVICE);
	}

	/**
	 * Android's clipboard currently only handles text; when working with
	 * arbitrary data check if it looks like text that we're being handed.
	 */
	private boolean isTextType(String type)
	{
		String mimeType = type.toLowerCase();
		return mimeType.equals("text/plain") || mimeType.startsWith("text");
	}

	@Kroll.method
	public void clearData(@Kroll.argument(optional = true) String type)
	{
		clearText();
	}

	@Kroll.method
	public void clearText()
	{
		board().setText(""); // can we use null?
	}

	@Kroll.method
	public Object getData(String type)
	{
		if (isTextType(type)) {
			return getText();
		} else {
			// Android clipboard is text-only... :(
			return null;
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.getProperty
	public String getText()
	// clang-format on
	{
		return board().getText().toString();
	}

	@Kroll.method
	public boolean hasData(String type)
	{
		if (type == null || isTextType(type)) {
			return hasText();
		} else {
			return false;
		}
	}

	@Kroll.method
	public boolean hasText()
	{
		return board().hasText();
	}

	@Kroll.method
	public void setData(String type, Object data)
	{
		if (isTextType(type) && data != null) {
			board().setText(data.toString());
		} else {
			Log.w(TAG, "Android clipboard only supports text data");
		}
	}

	// clang-format off
	@Kroll.method
	@Kroll.setProperty
	public void setText(String text)
	// clang-format on
	{
		board().setText(text);
	}

	@Override
	public String getApiName()
	{
		return "Ti.UI.Clipboard";
	}
}
