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
public class NodeListProxy extends KrollProxy {

	private NodeList list;
	public NodeListProxy(TiContext context, NodeList list)
	{
		super(context);
		this.list = list;
	}

	@Kroll.getProperty @Kroll.method
	public int getLength() {
		return list.getLength();
	}

	@Kroll.method
	public NodeProxy item(int index) {
		return NodeProxy.getNodeProxy(getTiContext(), list.item(index));
	}
}
