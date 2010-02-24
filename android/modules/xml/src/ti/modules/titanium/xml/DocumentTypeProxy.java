/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import org.appcelerator.titanium.TiContext;
import org.w3c.dom.DocumentType;

public class DocumentTypeProxy extends NodeProxy {

	private DocumentType type;
	public DocumentTypeProxy(TiContext context, DocumentType type)
	{
		super(context, type);
		this.type = type;
	}
	
	public DocumentType getDocumentType() {
		return type;
	}
	
	public NamedNodeMapProxy getEntities() {
		return new NamedNodeMapProxy(getTiContext(), type.getEntities());
	}
	
	public String getInternalSubset() {
		return type.getInternalSubset();
	}
	
	public String getName() {
		return type.getName();
	}
	
	public NamedNodeMapProxy getNotations() {
		return new NamedNodeMapProxy(getTiContext(), type.getNotations());
	}
	
	public String getPublicId() {
		return type.getPublicId();
	}
	
	public String getSystemId() {
		return type.getSystemId();
	}
}
