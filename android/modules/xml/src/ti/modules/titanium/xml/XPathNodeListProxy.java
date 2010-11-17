/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import java.util.ArrayList;
import java.util.List;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.w3c.dom.Node;

@Kroll.proxy
public class XPathNodeListProxy extends KrollProxy
{
	private List nodeList;
	public XPathNodeListProxy(TiContext context, List nodeList)
	{
		super(context);
		this.nodeList = nodeList;
	}
	
	@Kroll.getProperty @Kroll.method
	public int getLength() {
		return nodeList.size();
	}

	@Kroll.method
	public NodeProxy item(int index) {
		Node node = (Node)nodeList.get(index);
		return NodeProxy.getNodeProxy(getTiContext(), node);
	}
}
