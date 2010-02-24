/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import org.appcelerator.titanium.TiContext;
import org.w3c.dom.DOMException;
import org.w3c.dom.Text;

public class TextProxy extends CharacterDataProxy {
	
	private Text text;
	public TextProxy(TiContext context, Text text)
	{
		super(context, text);
		this.text = text;
	}
	
	public TextProxy splitText(int offset) throws DOMException {
		return getProxy(text.splitText(offset));
	}
}
