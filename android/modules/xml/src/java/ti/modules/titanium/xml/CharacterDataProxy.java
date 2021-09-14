/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import org.appcelerator.kroll.annotations.Kroll;
import org.w3c.dom.CharacterData;
import org.w3c.dom.DOMException;

@Kroll.proxy(parentModule = XMLModule.class)
public class CharacterDataProxy extends NodeProxy
{

	private CharacterData data;
	public CharacterDataProxy(CharacterData data)
	{
		super(data);
		this.data = data;
	}

	@Kroll.method
	public void appendData(String arg) throws DOMException
	{
		data.appendData(arg);
	}

	@Kroll.method
	public void deleteData(int offset, int count) throws DOMException
	{
		data.deleteData(offset, count);
	}

	@Kroll.getProperty
	public String getData() throws DOMException
	{
		return data.getData();
	}

	@Kroll.setProperty
	public void setData(String data) throws DOMException
	{
		this.data.setData(data);
	}

	@Kroll.getProperty
	public int getLength()
	{
		return data.getLength();
	}

	@Kroll.method
	public void insertData(int offset, String arg) throws DOMException
	{
		data.insertData(offset, arg);
	}

	@Kroll.method
	public void replaceData(int offset, int count, String arg) throws DOMException
	{
		data.replaceData(offset, count, arg);
	}

	@Kroll.method
	public String substringData(int offset, int count) throws DOMException
	{
		// Android (Harmony) appears to be non-compliant in that if you try
		// to ask for more than there is, an exception occurs. Spec says to just
		// return data up to the end. So we adjust count here if needed so as to
		// avoid an exception that shouldn't be happening.
		if ((offset + count) > data.getLength()) {
			count = data.getLength() - offset;
		}
		return data.substringData(offset, count);
	}

	@Override
	public String getApiName()
	{
		return "Ti.XML.CharacterData";
	}
}
