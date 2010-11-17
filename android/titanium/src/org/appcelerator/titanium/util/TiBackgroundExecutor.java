package org.appcelerator.titanium.util;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

/**
 * This class is used to provide a global threadpool for background
 * execution throughout Titanium.
 */
public class TiBackgroundExecutor {
	private static final int MAX_THREADS = 10;
	private static Executor executor = null;

	public static void execute(Runnable command) {
		if (executor == null) {
			executor = Executors.newFixedThreadPool(MAX_THREADS);
		}
		executor.execute(command);
	}
}
