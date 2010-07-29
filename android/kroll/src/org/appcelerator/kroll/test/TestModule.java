package org.appcelerator.kroll.test;

import org.appcelerator.kroll.KrollInvocation;
import org.appcelerator.kroll.KrollProxy;
import org.appcelerator.kroll.annotations.Kroll;

@Kroll.module
public class TestModule extends KrollProxy {

	@Kroll.createMethod
	public TestProxy createTest(KrollInvocation invocation) {
		return new TestProxy();
	}
}
