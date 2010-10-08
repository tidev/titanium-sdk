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
import org.w3c.dom.DOMException;
import org.w3c.dom.NamedNodeMap;

@Kroll.proxy
public class NamedNodeMapProxy extends KrollProxy {

	private NamedNodeMap map;
	public NamedNodeMapProxy(TiContext context, NamedNodeMap map) {
		super(context);
		this.map = map;
	}
	
	@Kroll.getProperty @Kroll.method
	public int getLength() {
		return map.getLength();
	}
	
	@Kroll.method
	public NodeProxy getNamedItem(String name) {
		return NodeProxy.getNodeProxy(getTiContext(), map.getNamedItem(name));
	}
	
	@Kroll.method
	public NodeProxy getNamedItemNS(String namespaceURI, String localName)
			throws DOMException {
		return NodeProxy.getNodeProxy(getTiContext(), map.getNamedItemNS(namespaceURI, localName));
	}
	
	@Kroll.method
	public NodeProxy item(int index) {
		return NodeProxy.getNodeProxy(getTiContext(), map.item(index));
	}
	
	@Kroll.method
	public NodeProxy removeNamedItem(String name) throws DOMException {
		return NodeProxy.getNodeProxy(getTiContext(), map.removeNamedItem(name));
	}
	
	@Kroll.method
	public NodeProxy removeNamedItemNS(String namespaceURI, String localName)
			throws DOMException {
		return NodeProxy.getNodeProxy(getTiContext(), map.removeNamedItemNS(namespaceURI, localName));
	}
	
	@Kroll.method
	public NodeProxy setNamedItem(NodeProxy arg) throws DOMException {
		return NodeProxy.getNodeProxy(getTiContext(), map.setNamedItem(arg.getNode()));
	}
	
	@Kroll.method
	public NodeProxy setNamedItemNS(NodeProxy arg) throws DOMException {
		return NodeProxy.getNodeProxy(getTiContext(), map.setNamedItemNS(arg.getNode()));
	}
}
