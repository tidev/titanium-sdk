/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.xml;

import org.appcelerator.kroll.annotations.Kroll;
import org.w3c.dom.DOMException;
import org.w3c.dom.ProcessingInstruction;

@Kroll.proxy(parentModule=XMLModule.class)
public class ProcessingInstructionProxy extends NodeProxy {

	private ProcessingInstruction pi;
	public ProcessingInstructionProxy(ProcessingInstruction pi)
	{
		super(pi);
		this.pi = pi;
	}
	
	@Kroll.getProperty @Kroll.method
	public String getData() {
		return pi.getData();
	}
	
	@Kroll.getProperty @Kroll.method
	public String getTarget() {
		return pi.getTarget();
	}
	
	@Kroll.setProperty @Kroll.method
	public void setData(String data) throws DOMException {
		pi.setData(data);
	}
}
