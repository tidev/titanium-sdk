/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.w3c.dom.DOMException;
import org.w3c.dom.NamedNodeMap;

@Kroll.proxy(parentModule=XMLModule.class)
public class NamedNodeMapProxy extends KrollProxy
{
	private NamedNodeMap map;
	public NamedNodeMapProxy(NamedNodeMap map)
	{
		super();
		this.map = map;
	}

	public NamedNodeMapProxy(TiContext context, NamedNodeMap map)
	{
		this(map);
	}

	@Kroll.getProperty @Kroll.method
	public int getLength()
	{
		return map.getLength();
	}

	@Kroll.method
	public NodeProxy getNamedItem(String name)
	{
		return NodeProxy.getNodeProxy(map.getNamedItem(name));
	}

	@Kroll.method
	public NodeProxy getNamedItemNS(String namespaceURI, String localName)
			throws DOMException
	{
		return NodeProxy.getNodeProxy(map.getNamedItemNS(namespaceURI, localName));
	}

	@Kroll.method
	public NodeProxy item(int index)
	{
		if (index >= getLength()) {
			// DOM specifies that item() must return null
			// if the index is >= length, but the harmony
			// impl. will throw an exception, so we short
			// circuit that here.
			return null;
		}
		return NodeProxy.getNodeProxy(map.item(index));
	}

	@Kroll.method
	public NodeProxy removeNamedItem(String name)
		throws DOMException
	{
		return NodeProxy.getNodeProxy(map.removeNamedItem(name));
	}

	@Kroll.method
	public NodeProxy removeNamedItemNS(String namespaceURI, String localName)
		throws DOMException
	{
		return NodeProxy.getNodeProxy(map.removeNamedItemNS(namespaceURI, localName));
	}

	@Kroll.method
	public NodeProxy setNamedItem(NodeProxy arg)
		throws DOMException
	{
		return NodeProxy.getNodeProxy(map.setNamedItem(arg.getNode()));
	}

	@Kroll.method
	public NodeProxy setNamedItemNS(NodeProxy arg)
		throws DOMException
	{
		return NodeProxy.getNodeProxy(map.setNamedItemNS(arg.getNode()));
	}
}
