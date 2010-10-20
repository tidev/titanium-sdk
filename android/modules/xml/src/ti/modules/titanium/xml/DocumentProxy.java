/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.w3c.dom.DOMException;
import org.w3c.dom.Document;

@Kroll.proxy
public class DocumentProxy extends NodeProxy {

	private Document doc;
	public DocumentProxy(TiContext context, Document doc)
	{
		super(context, doc);
		this.doc = doc;
	}

	@Kroll.method
	public AttrProxy createAttribute(String name) throws DOMException {
		return getProxy(doc.createAttribute(name));
	}

	@Kroll.method
	public AttrProxy createAttributeNS(String namespaceURI, String qualifiedName)
			throws DOMException {
		return getProxy(doc.createAttributeNS(namespaceURI, qualifiedName));
	}

	@Kroll.method
	public CDATASectionProxy createCDATASection(String data) throws DOMException {
		return getProxy(doc.createCDATASection(data));
	}

	@Kroll.method
	public CommentProxy createComment(String data) {
		return getProxy(doc.createComment(data));
	}

	@Kroll.method
	public DocumentFragmentProxy createDocumentFragment() {
		return getProxy(doc.createDocumentFragment());
	}

	@Kroll.method
	public ElementProxy createElement(String tagName) throws DOMException {
		return getProxy(doc.createElement(tagName));
	}

	@Kroll.method
	public ElementProxy createElementNS(String namespaceURI, String qualifiedName)
			throws DOMException {
		return getProxy(doc.createElementNS(namespaceURI, qualifiedName));
	}

	@Kroll.method
	public EntityReferenceProxy createEntityReference(String name)
			throws DOMException {
		return getProxy(doc.createEntityReference(name));
	}

	@Kroll.method
	public ProcessingInstructionProxy createProcessingInstruction(String target,
			String data) throws DOMException {
		return getProxy(doc.createProcessingInstruction(target, data));
	}

	@Kroll.method
	public TextProxy createTextNode(String data) {
		return getProxy(doc.createTextNode(data));
	}
	
	
	@Kroll.getProperty @Kroll.method
	public DocumentTypeProxy getDoctype() {
		return getProxy(doc.getDoctype());
	}
	
	@Kroll.getProperty @Kroll.method
	public ElementProxy getDocumentElement() {
		return getProxy(doc.getDocumentElement());
	}

	@Kroll.method
	public ElementProxy getElementById(String elementId) {
		return getProxy(doc.getElementById(elementId));
	}

	@Kroll.method
	public NodeListProxy getElementsByTagName(String tagname) {
		return new NodeListProxy(getTiContext(), doc.getElementsByTagName(tagname));
	}

	@Kroll.method
	public NodeListProxy getElementsByTagNameNS(String namespaceURI, String localName) {
		return new NodeListProxy(getTiContext(), doc.getElementsByTagNameNS(namespaceURI, localName));
	}

	@Kroll.getProperty @Kroll.method
	public DOMImplementationProxy getImplementation() {
		return new DOMImplementationProxy(getTiContext(), doc.getImplementation());
	}

	@Kroll.method
	public NodeProxy importNode(NodeProxy importedNode, boolean deep) throws DOMException {
		return getProxy(doc.importNode(importedNode.getNode(), deep));
	}
	
	@Override
	public DocumentProxy getOwnerDocument() {
		return this;
	}
}
