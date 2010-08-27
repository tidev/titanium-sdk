/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.titanium.TiContext;
import org.w3c.dom.DOMException;
import org.w3c.dom.NamedNodeMap;

public class NamedNodeMapProxy extends KrollProxy {

	private NamedNodeMap map;
	public NamedNodeMapProxy(TiContext context, NamedNodeMap map) {
		super(context);
		this.map = map;
	}
	
	public int getLength() {
		return map.getLength();
	}
	
	public NodeProxy getNamedItem(String name) {
		return NodeProxy.getNodeProxy(getTiContext(), map.getNamedItem(name));
	}
	
	public NodeProxy getNamedItemNS(String namespaceURI, String localName)
			throws DOMException {
		return NodeProxy.getNodeProxy(getTiContext(), map.getNamedItemNS(namespaceURI, localName));
	}
	
	public NodeProxy item(int index) {
		return NodeProxy.getNodeProxy(getTiContext(), map.item(index));
	}
	
	public NodeProxy removeNamedItem(String name) throws DOMException {
		return NodeProxy.getNodeProxy(getTiContext(), map.removeNamedItem(name));
	}
	
	public NodeProxy removeNamedItemNS(String namespaceURI, String localName)
			throws DOMException {
		return NodeProxy.getNodeProxy(getTiContext(), map.removeNamedItemNS(namespaceURI, localName));
	}
	
	public NodeProxy setNamedItem(NodeProxy arg) throws DOMException {
		return NodeProxy.getNodeProxy(getTiContext(), map.setNamedItem(arg.getNode()));
	}
	
	public NodeProxy setNamedItemNS(NodeProxy arg) throws DOMException {
		return NodeProxy.getNodeProxy(getTiContext(), map.setNamedItemNS(arg.getNode()));
	}
}
