/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import java.util.HashMap;

import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.TiDict;
import org.appcelerator.titanium.TiProxy;
import org.w3c.dom.Attr;
import org.w3c.dom.CDATASection;
import org.w3c.dom.Comment;
import org.w3c.dom.DOMException;
import org.w3c.dom.Document;
import org.w3c.dom.DocumentFragment;
import org.w3c.dom.DocumentType;
import org.w3c.dom.Element;
import org.w3c.dom.Entity;
import org.w3c.dom.EntityReference;
import org.w3c.dom.Node;
import org.w3c.dom.Notation;
import org.w3c.dom.ProcessingInstruction;
import org.w3c.dom.Text;

public class NodeProxy extends TiProxy {

	private Node node;
	private TiDict constants;
	
	public NodeProxy(TiContext context, Node node)
	{
		super(context);
		this.node = node;
	}

	@Override
	public TiDict getConstants() {
		if (constants == null) {
			constants = new TiDict();
			constants.put("ATTRIBUTE_NODE", Node.ATTRIBUTE_NODE);
			constants.put("CDATA_SECTION_NODE", Node.CDATA_SECTION_NODE);
			constants.put("COMMENT_NODE", Node.COMMENT_NODE);
			constants.put("DOCUMENT_FRAGMENT_NODE", Node.DOCUMENT_FRAGMENT_NODE);
			constants.put("DOCUMENT_NODE", Node.DOCUMENT_NODE);
			constants.put("DOCUMENT_TYPE_NODE", Node.DOCUMENT_TYPE_NODE);
			constants.put("ELEMENT_NODE", Node.ELEMENT_NODE);
			constants.put("ENTITY_NODE", Node.ENTITY_NODE);
			constants.put("ENTITY_REFERENCE_NODE", Node.ENTITY_REFERENCE_NODE);
			constants.put("NOTATION_NODE", Node.NOTATION_NODE);
			constants.put("PROCESSING_INSTRUCTION_NODE", Node.PROCESSING_INSTRUCTION_NODE);
			constants.put("TEXT_NODE", Node.TEXT_NODE);
		}
		return constants;
	}
	
	public Node getNode() {
		return node;
	}
	
	// We cache node proxies so we're not constructing new ones on every single call
	// on node finalize we have to go back through and remove each proxy
	public static NodeProxy getNodeProxy(TiContext context, Node node) {
		NodeProxy proxy;
		switch (node.getNodeType()) {
			case Node.ATTRIBUTE_NODE:
				proxy = new AttrProxy(context, (Attr)node);
				break;
			case Node.CDATA_SECTION_NODE:
				proxy = new CDATASectionProxy(context, (CDATASection)node);
				break;
			case Node.COMMENT_NODE:
				proxy = new CommentProxy(context, (Comment)node);
				break;
			case Node.DOCUMENT_FRAGMENT_NODE:
				proxy = new DocumentFragmentProxy(context, (DocumentFragment)node);
				break;
			case Node.DOCUMENT_NODE:
				proxy = new DocumentProxy(context, (Document)node);
				break;
			case Node.DOCUMENT_TYPE_NODE:
				proxy = new DocumentTypeProxy(context, (DocumentType)node);
				break;
			case Node.ELEMENT_NODE:
				proxy = new ElementProxy(context, (Element)node);
				break;
			case Node.ENTITY_NODE:
				proxy = new EntityProxy(context, (Entity)node);
				break;
			case Node.ENTITY_REFERENCE_NODE:
				proxy = new EntityReferenceProxy(context, (EntityReference)node);
				break;
			case Node.NOTATION_NODE:
				proxy = new NotationProxy(context, (Notation)node);
				break;
			case Node.PROCESSING_INSTRUCTION_NODE:
				proxy = new ProcessingInstructionProxy(context, (ProcessingInstruction)node);
				break;
			case Node.TEXT_NODE:
				proxy = new TextProxy(context, (Text)node);
				break;
			default:
				proxy = new NodeProxy(context, node);
				break;
		}

		return proxy;
	}
	
	public static NodeProxy removeProxyForNode(TiContext context, Node node) {
		// if we're here then a proxy was never generated for this node
		// just return a temporary wrapper in this case
		return new NodeProxy(context, node);
	}
	
	@SuppressWarnings("unchecked")
	protected <T extends NodeProxy> T getProxy(Node node) {
		return (T) getNodeProxy(getTiContext(), node);
	}
	
	public NodeProxy appendChild(NodeProxy newChild) throws DOMException {
		return getProxy(node.appendChild(newChild.node));
	}

	public NodeProxy cloneNode(boolean deep) {
		return getProxy(node.cloneNode(deep));
	}

	public NamedNodeMapProxy getAttributes() {
		return new NamedNodeMapProxy(getTiContext(), node.getAttributes());
	}

	public NodeListProxy getChildNodes() {
		return new NodeListProxy(getTiContext(), node.getChildNodes());
	}

	public NodeProxy getFirstChild() {
		return getProxy(node.getFirstChild());
	}

	public NodeProxy getLastChild() {
		return getProxy(node.getLastChild());
	}

	public String getLocalName() {
		return node.getLocalName();
	}

	public String getNamespaceURI() {
		return node.getNamespaceURI();
	}

	public NodeProxy getNextSibling() {
		return getProxy(node.getNextSibling());
	}

	public String getNodeName() {
		return node.getNodeName();
	}

	public short getNodeType() {
		return node.getNodeType();
	}

	public String getNodeValue() throws DOMException {
		return node.getNodeValue();
	}

	public DocumentProxy getOwnerDocument() {
		return new DocumentProxy(getTiContext(), node.getOwnerDocument());
	}

	public NodeProxy getParentNode() {
		return getProxy(node.getParentNode());
	}

	public String getPrefix() {
		return node.getPrefix();
	}

	public NodeProxy getPreviousSibling() {
		return getProxy(node.getPreviousSibling());
	}

	public boolean hasAttributes() {
		return node.hasAttributes();
	}

	public boolean hasChildNodes() {
		return node.hasChildNodes();
	}

	public NodeProxy insertBefore(NodeProxy newChild, NodeProxy refChild) throws DOMException {
		return getProxy(node.insertBefore(newChild.node, refChild.node));
	}

	public boolean isSupported(String feature, String version) {
		return node.isSupported(feature, version);
	}

	public void normalize() {
		node.normalize();
	}

	public NodeProxy removeChild(NodeProxy oldChild) throws DOMException {
		Node oldNode = node.removeChild(oldChild.node);
		return removeProxyForNode(getTiContext(), oldNode);
	}

	public NodeProxy replaceChild(NodeProxy newChild, NodeProxy oldChild) throws DOMException {
		Node oldNode = node.replaceChild(newChild.node, oldChild.node);
		return removeProxyForNode(getTiContext(), oldNode);
	}

	public void setNodeValue(String nodeValue) throws DOMException {
		node.setNodeValue(nodeValue);
	}

	public void setPrefix(String prefix) throws DOMException {
		node.setPrefix(prefix);
	}
	
	public XPathUtil.XPathNodeListProxy evaluate(String xpath) {
		return XPathUtil.evaluate(this, xpath);
	}
}
