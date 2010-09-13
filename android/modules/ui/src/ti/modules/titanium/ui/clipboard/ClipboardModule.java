/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.ui.clipboard;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiModule;

import android.content.Context;
import android.text.ClipboardManager;

public class ClipboardModule extends TiModule {

	public ClipboardModule(TiContext tiContext) {
		super(tiContext);
	}

	/**
	 * Get the native clipboard instance.
	 */
	private ClipboardManager board()
	{
		return (ClipboardManager)getTiContext().getTiApp().getSystemService(Context.CLIPBOARD_SERVICE);
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

	public void clearData(String type)
	{
		clearText();
	}

	public void clearText()
	{
		board().setText(""); // can we use null?
	}

	public Object getData(String type)
	{
		if (isTextType(type))
		{
			return getText();
		}
		else
		{
			// Android clipboard is text-only... :(
			return null;
		}
	}

	public String getText()
	{
		return board().getText().toString();
	}

	public boolean hasData(String type)
	{
		if (type == null || isTextType(type))
		{
			return hasText();
		}
		else
		{
			return false;
		}
	}

	public boolean hasText()
	{
		return board().hasText();
	}

	public void setData(String type, Object data)
	{
		if (isTextType(type))
		{
			data.toString();
		}
		else
		{
			// Android clipboard is text-only... :(
		}
	}

	public void setText(String text)
	{
		board().setText(text);
	}

}
