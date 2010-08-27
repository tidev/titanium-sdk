/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import org.appcelerator.titanium.TiContext;
import org.w3c.dom.CDATASection;
import org.w3c.dom.DOMException;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.w3c.dom.Text;

public class ElementProxy extends NodeProxy {

	private Element element;
	public ElementProxy(TiContext context, Element element)
	{
		super(context, element);
		this.element = element;
	}
	
	public String getText() {
		StringBuilder sb = new StringBuilder();
		getTextImpl(element, sb);
		return sb.toString();
	}
	
	private void getTextImpl(Node node, StringBuilder builder)
	{
		NodeList children = node.getChildNodes();
		for (int i = 0; i < children.getLength(); i++)
		{
			Node child = children.item(i);
			switch (child.getNodeType()) {
				case Node.TEXT_NODE:
					builder.append(((Text)child).getNodeValue()); break;
				case Node.CDATA_SECTION_NODE:
					builder.append(((CDATASection)child).getData()); break;
				case Node.ENTITY_NODE:
				case Node.ELEMENT_NODE:
					getTextImpl(child, builder); break;
				default: break;
			}
		}
	}
	
	public String getAttribute(String name) {
		return element.getAttribute(name);
	}
	
	public AttrProxy getAttributeNode(String name) {
		return getProxy(element.getAttributeNode(name));
	}
	
	public AttrProxy getAttributeNodeNS(String namespaceURI, String localName)
			throws DOMException {
		return getProxy(element.getAttributeNodeNS(namespaceURI, localName));
	}
	
	public String getAttributeNS(String namespaceURI, String localName)
			throws DOMException {
		return element.getAttributeNS(namespaceURI, localName);
	}
	
	public NodeListProxy getElementsByTagName(String name) {
		return new NodeListProxy(getTiContext(), element.getElementsByTagName(name));
	}
	
	public NodeListProxy getElementsByTagNameNS(String namespaceURI, String localName)
			throws DOMException {
		return new NodeListProxy(getTiContext(), element.getElementsByTagNameNS(namespaceURI, localName));
	}
	
	public String getTagName() {
		return element.getTagName();
	}
	
	public boolean hasAttribute(String name) {
		return element.hasAttribute(name);
	}
	
	public boolean hasAttributeNS(String namespaceURI, String localName)
			throws DOMException {
		return element.hasAttributeNS(namespaceURI, localName);
	}
	
	public void removeAttribute(String name) throws DOMException {
		element.removeAttribute(name);
	}
	
	public AttrProxy removeAttributeNode(AttrProxy oldAttr) throws DOMException {
		return getProxy(element.removeAttributeNode(oldAttr.getAttr()));
	}
	
	public void removeAttributeNS(String namespaceURI, String localName)
			throws DOMException {
		element.removeAttributeNS(namespaceURI, localName);
	}
	
	public void setAttribute(String name, String value) throws DOMException {
		element.setAttribute(name, value);
	}
	
	public AttrProxy setAttributeNode(AttrProxy newAttr) throws DOMException {
		return getProxy(element.setAttributeNode(newAttr.getAttr()));
	}
	
	public AttrProxy setAttributeNodeNS(AttrProxy newAttr) throws DOMException {
		return getProxy(element.setAttributeNodeNS(newAttr.getAttr()));
	}
	
	public void setAttributeNS(String namespaceURI, String qualifiedName,
			String value) throws DOMException {
		element.setAttributeNS(namespaceURI, qualifiedName, value);
	}
}
