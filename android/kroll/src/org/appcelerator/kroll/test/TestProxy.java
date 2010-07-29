package org.appcelerator.kroll.test;

import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;

@Kroll.proxy
public class TestProxy extends KrollProxy {

	@Kroll.method
	public String testMethod(KrollInvocation invocation) {
		return "This is a test";
	}
}
