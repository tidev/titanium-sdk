/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import java.util.HashMap;

import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
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

@Kroll.proxy
public class NodeProxy extends KrollProxy {

	private static HashMap<Node, NodeProxy> proxyCache = new HashMap<Node, NodeProxy>();
	
	@Kroll.constant public static final int ATTRIBUTE_NODE = Node.ATTRIBUTE_NODE;
	@Kroll.constant public static final int CDATA_SECTION_NODE = Node.CDATA_SECTION_NODE;
	@Kroll.constant public static final int COMMENT_NODE = Node.COMMENT_NODE;
	@Kroll.constant public static final int DOCUMENT_FRAGMENT_NODE = Node.DOCUMENT_FRAGMENT_NODE;
	@Kroll.constant public static final int DOCUMENT_NODE = Node.DOCUMENT_NODE;
	@Kroll.constant public static final int DOCUMENT_TYPE_NODE = Node.DOCUMENT_TYPE_NODE;
	@Kroll.constant public static final int ELEMENT_NODE = Node.ELEMENT_NODE;
	@Kroll.constant public static final int ENTITY_NODE = Node.ENTITY_NODE;
	@Kroll.constant public static final int ENTITY_REFERENCE_NODE = Node.ENTITY_REFERENCE_NODE;
	@Kroll.constant public static final int NOTATION_NODE = Node.NOTATION_NODE;
	@Kroll.constant public static final int PROCESSING_INSTRUCTION_NODE = Node.PROCESSING_INSTRUCTION_NODE;
	@Kroll.constant public static final int TEXT_NODE = Node.TEXT_NODE;
	
	private Node node;
	
	public NodeProxy(TiContext context, Node node)
	{
		super(context);
		this.node = node;
	}
	
	public Node getNode() {
		return node;
	}
	
	// We cache node proxies so we're not constructing new ones on every single call
	// on node finalize we have to go back through and remove each proxy
	public static NodeProxy getNodeProxy(TiContext context, Node node) {
		NodeProxy proxy = proxyCache.get(node);
		if (proxy == null) {
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
			proxyCache.put(node, proxy);
		}
		return proxy;
	}
	
	public static NodeProxy removeProxyForNode(TiContext context, Node node) {
		if (proxyCache.containsKey(node)) {
			return proxyCache.remove(node);
		}
		// if we're here then a proxy was never generated for this node
		// just return a temporary wrapper in this case
		return new NodeProxy(context, node);
	}
	
	@SuppressWarnings("unchecked")
	protected <T extends NodeProxy> T getProxy(Node node) {
		return (T) getNodeProxy(getTiContext(), node);
	}
	
	@Kroll.method
	public NodeProxy appendChild(NodeProxy newChild) throws DOMException {
		return getProxy(node.appendChild(newChild.node));
	}

	@Kroll.method
	public NodeProxy cloneNode(boolean deep) {
		return getProxy(node.cloneNode(deep));
	}

	@Kroll.getProperty @Kroll.method
	public NamedNodeMapProxy getAttributes() {
		return new NamedNodeMapProxy(getTiContext(), node.getAttributes());
	}

	@Kroll.getProperty @Kroll.method
	public NodeListProxy getChildNodes() {
		return new NodeListProxy(getTiContext(), node.getChildNodes());
	}

	@Kroll.getProperty @Kroll.method
	public NodeProxy getFirstChild() {
		return getProxy(node.getFirstChild());
	}

	@Kroll.getProperty @Kroll.method
	public NodeProxy getLastChild() {
		return getProxy(node.getLastChild());
	}

	@Kroll.getProperty @Kroll.method
	public String getLocalName() {
		return node.getLocalName();
	}

	@Kroll.getProperty @Kroll.method
	public String getNamespaceURI() {
		return node.getNamespaceURI();
	}

	@Kroll.getProperty @Kroll.method
	public NodeProxy getNextSibling() {
		return getProxy(node.getNextSibling());
	}

	@Kroll.getProperty @Kroll.method
	public String getNodeName() {
		return node.getNodeName();
	}

	@Kroll.getProperty @Kroll.method
	public short getNodeType() {
		return node.getNodeType();
	}

	@Kroll.getProperty @Kroll.method
	public String getNodeValue() throws DOMException {
		return node.getNodeValue();
	}

	@Kroll.getProperty @Kroll.method
	public DocumentProxy getOwnerDocument() {
		return new DocumentProxy(getTiContext(), node.getOwnerDocument());
	}

	@Kroll.getProperty @Kroll.method
	public NodeProxy getParentNode() {
		return getProxy(node.getParentNode());
	}

	@Kroll.getProperty @Kroll.method
	public String getPrefix() {
		return node.getPrefix();
	}

	@Kroll.getProperty @Kroll.method
	public NodeProxy getPreviousSibling() {
		return getProxy(node.getPreviousSibling());
	}

	@Kroll.method
	public boolean hasAttributes() {
		return node.hasAttributes();
	}

	@Kroll.method
	public boolean hasChildNodes() {
		return node.hasChildNodes();
	}

	@Kroll.method
	public NodeProxy insertBefore(NodeProxy newChild, NodeProxy refChild) throws DOMException {
		return getProxy(node.insertBefore(newChild.node, refChild.node));
	}

	@Kroll.method
	public boolean isSupported(String feature, String version) {
		return node.isSupported(feature, version);
	}

	@Kroll.method
	public void normalize() {
		node.normalize();
	}

	@Kroll.method
	public NodeProxy removeChild(NodeProxy oldChild) throws DOMException {
		Node oldNode = node.removeChild(oldChild.node);
		return removeProxyForNode(getTiContext(), oldNode);
	}
	
	@Kroll.method
	public NodeProxy replaceChild(NodeProxy newChild, NodeProxy oldChild) throws DOMException {
		Node oldNode = node.replaceChild(newChild.node, oldChild.node);
		return removeProxyForNode(getTiContext(), oldNode);
	}

	@Kroll.setProperty @Kroll.method
	public void setNodeValue(String nodeValue) throws DOMException {
		node.setNodeValue(nodeValue);
	}

	@Kroll.setProperty @Kroll.method
	public void setPrefix(String prefix) throws DOMException {
		node.setPrefix(prefix);
	}
	
	@Kroll.method
	public XPathUtil.XPathNodeListProxy evaluate(String xpath) {
		return XPathUtil.evaluate(this, xpath);
	}
}
