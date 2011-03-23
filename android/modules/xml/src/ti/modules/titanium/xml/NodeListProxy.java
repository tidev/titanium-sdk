/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.w3c.dom.NodeList;

@Kroll.proxy
public class NodeListProxy extends KrollProxy
{
	// Support an offset so we can ignore the first "this"
	// node which is returned by Android for getElementsByTagName
	private int offset;
	private NodeList list;

	public NodeListProxy(TiContext context, NodeList list)
	{
		this(context, list, 0);
	}

	public NodeListProxy(TiContext context, NodeList list, int offset)
	{
		super(context);
		this.list = list;
		this.offset = offset;
	}

	@Kroll.getProperty @Kroll.method
	public int getLength()
	{
		return list.getLength() - offset;
	}

	@Kroll.method
	public NodeProxy item(int index)
	{
		return NodeProxy.getNodeProxy(getTiContext(), list.item(index + offset));
	}
}
