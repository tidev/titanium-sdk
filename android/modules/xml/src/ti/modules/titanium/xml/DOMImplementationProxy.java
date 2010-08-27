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
import org.w3c.dom.DOMImplementation;

public class DOMImplementationProxy extends KrollProxy {

	private DOMImplementation impl;
	public DOMImplementationProxy(TiContext context, DOMImplementation impl)
	{
		super(context);
		this.impl = impl;
	}
	
	public DocumentProxy createDocument(String namespaceURI, String qualifiedName,
			DocumentTypeProxy doctype) throws DOMException {
		return (DocumentProxy)NodeProxy.getNodeProxy(getTiContext(),
				impl.createDocument(namespaceURI, qualifiedName, doctype.getDocumentType()));
	}
	
	public DocumentTypeProxy createDocumentType(String qualifiedName,
			String publicId, String systemId) throws DOMException {
		return (DocumentTypeProxy)NodeProxy.getNodeProxy(getTiContext(),
				impl.createDocumentType(qualifiedName, publicId, systemId));
	}
	
	public boolean hasFeature(String feature, String version) {
		return impl.hasFeature(feature, version);
	}	
}
