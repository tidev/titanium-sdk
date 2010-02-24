/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import org.appcelerator.titanium.TiContext;
import org.w3c.dom.DOMException;
import org.w3c.dom.Document;

public class DocumentProxy extends NodeProxy {

	private Document doc;
	public DocumentProxy(TiContext context, Document doc)
	{
		super(context, doc);
		this.doc = doc;
	}

	public AttrProxy createAttribute(String name) throws DOMException {
		return getProxy(doc.createAttribute(name));
	}

	public AttrProxy createAttributeNS(String namespaceURI, String qualifiedName)
			throws DOMException {
		return getProxy(doc.createAttributeNS(namespaceURI, qualifiedName));
	}

	public CDATASectionProxy createCDATASection(String data) throws DOMException {
		return getProxy(doc.createCDATASection(data));
	}

	public CommentProxy createComment(String data) {
		return getProxy(doc.createComment(data));
	}

	public DocumentFragmentProxy createDocumentFragment() {
		return getProxy(doc.createDocumentFragment());
	}

	public ElementProxy createElement(String tagName) throws DOMException {
		return getProxy(doc.createElement(tagName));
	}

	public ElementProxy createElementNS(String namespaceURI, String qualifiedName)
			throws DOMException {
		return getProxy(doc.createElementNS(namespaceURI, qualifiedName));
	}

	public EntityReferenceProxy createEntityReference(String name)
			throws DOMException {
		return getProxy(doc.createEntityReference(name));
	}

	public ProcessingInstructionProxy createProcessingInstruction(String target,
			String data) throws DOMException {
		return getProxy(doc.createProcessingInstruction(target, data));
	}

	public TextProxy createTextNode(String data) {
		return getProxy(doc.createTextNode(data));
	}
	
	public DocumentTypeProxy getDoctype() {
		return getProxy(doc.getDoctype());
	}

	public ElementProxy getDocumentElement() {
		return getProxy(doc.getDocumentElement());
	}

	public ElementProxy getElementById(String elementId) {
		return getProxy(doc.getElementById(elementId));
	}

	public NodeListProxy getElementsByTagName(String tagname) {
		return new NodeListProxy(getTiContext(), doc.getElementsByTagName(tagname));
	}

	public NodeListProxy getElementsByTagNameNS(String namespaceURI, String localName) {
		return new NodeListProxy(getTiContext(), doc.getElementsByTagNameNS(namespaceURI, localName));
	}

	public DOMImplementationProxy getImplementation() {
		return new DOMImplementationProxy(getTiContext(), doc.getImplementation());
	}

	public NodeProxy importNode(NodeProxy importedNode, boolean deep) throws DOMException {
		return getProxy(doc.importNode(importedNode.getNode(), deep));
	}
	
	@Override
	public DocumentProxy getOwnerDocument() {
		return this;
	}
}
