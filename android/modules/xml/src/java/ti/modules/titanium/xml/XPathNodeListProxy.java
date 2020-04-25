/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2012-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import java.util.List;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.w3c.dom.Node;

@Kroll.proxy(parentModule = XMLModule.class)
public class XPathNodeListProxy extends KrollProxy
{
	private List nodeList;

	public XPathNodeListProxy(List nodeList)
	{
		super();
		this.nodeList = nodeList;
	}

	@Kroll.method
	@Kroll.getProperty
	public int getLength()
	{
		return nodeList.size();
	}

	@Kroll.method
	public NodeProxy item(int index)
	{
		Node node = (Node) nodeList.get(index);
		return NodeProxy.getNodeProxy(node);
	}
}
