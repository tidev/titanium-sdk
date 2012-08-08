/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.kroll.common.Log;
import org.appcelerator.titanium.TiContext;
import org.w3c.dom.DOMException;
import org.w3c.dom.Node;
import org.w3c.dom.Text;

@Kroll.proxy(parentModule=XMLModule.class)
public class TextProxy extends CharacterDataProxy
{
	private final static String TAG = "Text"; 

	private Text text;
	public TextProxy(Text text)
	{
		super(text);
		this.text = text;
	}

	public TextProxy(TiContext tiContext, Text text)
	{
		this(text);
	}

	@Kroll.method
	public TextProxy splitText(int offset) throws DOMException
	{
		// Harmony implementation is horribly broken. It results in
		// the same value (the "right side" value, so to speak)
		// being put into both text nodes. And it returns the wrong node.
		String originalValue = text.getNodeValue();
		Text splitResultNode = text.splitText(offset);
		// If we get here, we know offset is a valid number because
		// exception is thrown if offset is negative or greater than
		// length. That's in line with the spec.
		String leftValueShouldBe;
		if (offset == 0) {
			leftValueShouldBe = "";
		} else {
			leftValueShouldBe = originalValue.substring(0, offset);
		}
		// The "left side" is this text node.
		String newValue = text.getNodeValue();
		if (newValue == null || !newValue.equals(leftValueShouldBe)) {
			text.setData(leftValueShouldBe);
		}
		// Harmony also makes the mistake of returning the original text
		// node as the result of splitText, whereas the spec makes it
		// clear that the return value is the newly-created text node.
		// So we check for that here and correct it if needed.
		Text returnNode = splitResultNode;
		if (splitResultNode == this.text) {
			// Wrong, fix it. But we can only fix it
			// if the original node was actually inside a
			// document tree and therefore has a new sibling
			// which is the node we really want.
			Node sibling = this.text.getNextSibling();
			if (sibling != null && sibling instanceof Text) {
				returnNode = (Text) sibling;
			}
		}
		return getProxy(returnNode);
	}
	
	@Kroll.getProperty @Kroll.method @Deprecated
	public String getText()
	{
		Log.w(TAG, "The text property of Text is deprecated, use textContent instead.");
		return getTextContent();
	}
	
	@Kroll.getProperty @Kroll.method
	public String getTextContent()
	{
		return this.text.getNodeValue();
	}
}
