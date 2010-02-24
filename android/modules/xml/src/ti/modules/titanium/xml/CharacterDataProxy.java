/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import org.appcelerator.titanium.TiContext;
import org.w3c.dom.CharacterData;
import org.w3c.dom.DOMException;

public class CharacterDataProxy extends NodeProxy {

	private CharacterData data;
	public CharacterDataProxy(TiContext context, CharacterData data)
	{
		super(context, data);
		this.data = data;
	}
	
	public void appendData(String arg) throws DOMException {
		data.appendData(arg);
	}
	
	public void deleteData(int offset, int count) throws DOMException {
		data.deleteData(offset, count);
	}
	
	public String getData() throws DOMException {
		return data.getData();
	}
	
	public void setData(String data) throws DOMException {
		this.data.setData(data);
	}

	public int getLength() {
		return data.getLength();
	}

	public void insertData(int offset, String arg) throws DOMException {
		data.insertData(offset, arg);
	}
	
	public void replaceData(int offset, int count, String arg)
			throws DOMException {
		data.replaceData(offset, count, arg);
	}
	
	public String substringData(int offset, int count) throws DOMException {
		return data.substringData(offset, count);
	}
}
