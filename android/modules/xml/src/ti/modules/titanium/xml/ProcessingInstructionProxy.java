/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import org.appcelerator.titanium.TiContext;
import org.w3c.dom.DOMException;
import org.w3c.dom.ProcessingInstruction;

public class ProcessingInstructionProxy extends NodeProxy {

	private ProcessingInstruction pi;
	public ProcessingInstructionProxy(TiContext context, ProcessingInstruction pi)
	{
		super(context, pi);
		this.pi = pi;
	}
	
	public String getData() {
		return pi.getData();
	}
	
	public String getTarget() {
		return pi.getTarget();
	}
	
	public void setData(String data) throws DOMException {
		pi.setData(data);
	}
}
