/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.modules.titanium.stream;

import java.io.IOException;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollFunction;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.KrollObject;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiBlob;
import org.appcelerator.titanium.io.TiStream;
import org.appcelerator.titanium.util.TiStreamHelper;

import ti.modules.titanium.BufferProxy;
import ti.modules.titanium.TitaniumModule;

@Kroll.module(parentModule = TitaniumModule.class)
public class StreamModule extends KrollModule
{
	private static final String TAG = "Stream";

	@Kroll.constant
	public static final int MODE_READ = 0;
	@Kroll.constant
	public static final int MODE_WRITE = 1;
	@Kroll.constant
	public static final int MODE_APPEND = 2;

	@Kroll.method
	public Object createStream(KrollDict params)
	//public Object createStream(Object container)
	{
		Object source = params.get("source");

		Object rawMode = params.get("mode");
		if (!(rawMode instanceof Number)) {
			throw new IllegalArgumentException("Unable to create stream, invalid mode");
		}
		int mode = ((Number) rawMode).intValue();

		if (source instanceof TiBlob) {
			if (mode != MODE_READ) {
				throw new IllegalArgumentException("Unable to create a blob stream in a mode other than read");
			}

			return new BlobStreamProxy((TiBlob) source);

		} else if (source instanceof BufferProxy) {
			return new BufferStreamProxy((BufferProxy) source, mode);

		} else {
			throw new IllegalArgumentException("Unable to create a stream for the specified argument");
		}
	}

	@Kroll.method
	//public void read(TiStream sourceStream, BufferProxy buffer, KrollFunction resultsCallback)
	//public void read(TiStream sourceStream, BufferProxy buffer, int offset, int length, KrollFunction resultsCallback)
	public void read(Object args[]) throws Exception
	{
		if (args.length == 0) {
			throw new IllegalArgumentException("Invalid number of arguments");
		}

		if (!(args[0] instanceof TiStream)) {
			throw new IllegalArgumentException("Invalid stream argument");
		}

		// delegate to TiStream now that it supports async calls
		TiStream sourceStream = (TiStream) args[0];
		Object[] newArgs = new Object[args.length - 1];
		System.arraycopy(args, 1, newArgs, 0, args.length - 1);
		sourceStream.read(newArgs);
	}

	@Kroll.method
	//public BufferProxy readAll(TiStream sourceStream) throws IOException
	//public void readAll(final TiStream sourceStream, final BufferProxy buffer, final KrollFunction resultsCallback)
	public Object readAll(Object args[]) throws IOException
	{
		if (args.length != 1 && args.length != 3) {
			throw new IllegalArgumentException("Invalid number of arguments");
		}

		if (!(args[0] instanceof TiStream)) {
			throw new IllegalArgumentException("Invalid stream argument");
		}

		TiStream sourceStream = (TiStream) args[0];

		// when single arg, handle sync
		if (args.length == 1) {
			// Spit out deprecation notice about sync call!
			// And throw exception when on main thread!
			// final String syncIsANoNo = "Synchronous invocation of readAll will crash under the main thread. This will no longer be supported in SDK 8.0.0. Please invoke with a final callback function to receive the result.";
			// if (TiApplication.isUIThread()) {
			// 	throw new IOException(syncIsANoNo);
			// } else {
			// 	Log.w(TAG, syncIsANoNo);
			// }
			// FIXME: Don't we need to apply the same thread model here as we did in TIStreamHelper?
			BufferProxy buffer = new BufferProxy(1024);
			readAllSync(sourceStream, buffer, 0);
			return buffer;
		}

		// When 3 args, handle async
		// buffer arg
		if (!(args[1] instanceof BufferProxy)) {
			throw new IllegalArgumentException("Invalid buffer argument");
		}
		BufferProxy bufferArg = (BufferProxy) args[1];

		// callback arg
		if (!(args[2] instanceof KrollFunction)) {
			throw new IllegalArgumentException("Invalid callback argument");
		}
		KrollFunction resultsCallback = (KrollFunction) args[2];

		final TiStream fsourceStream = sourceStream;
		final BufferProxy fbuffer = bufferArg;
		final KrollFunction fResultsCallback = resultsCallback;
		new Thread(new Runnable() {
			public void run()
			{
				int offset = 0;
				int code = 0;
				String error = "";

				if (fbuffer.getLength() < 1024) {
					fbuffer.resize(1024);
				}

				try {
					readAllSync(fsourceStream, fbuffer, offset);

				} catch (IOException e) {
					code = 1;
					error = e.getMessage();
				}

				fResultsCallback.callAsync(getKrollObject(), TiStreamHelper.buildRWCallbackArgs(
																 fsourceStream, fbuffer.getLength(), code, error));
			}
		})
			.start();

		return null; // TODO KrollProxy.UNDEFINED;
	}

	private void readAllSync(TiStream sourceStream, BufferProxy buffer, int offset) throws IOException
	{
		int totalBytesRead = 0;

		while (sourceStream.isReadable()) {
			int bytesRead = sourceStream.readSync(buffer, offset, 1024);
			if (bytesRead == -1) {
				break;
			}

			totalBytesRead += bytesRead;
			buffer.resize(1024 + totalBytesRead);
			offset += bytesRead;
		}

		buffer.resize(totalBytesRead);
	}

	@Kroll.method
	//public void write(TiStream outputStream, BufferProxy buffer, KrollFunction resultsCallback)
	//public void write(TiStream outputStream, BufferProxy buffer, int offset, int length, KrollFunction resultsCallback)
	public void write(Object args[]) throws Exception
	{
		if (args.length == 0) {
			throw new IllegalArgumentException("Invalid number of arguments");
		}

		if (!(args[0] instanceof TiStream)) {
			throw new IllegalArgumentException("Invalid stream argument");
		}

		// delegate to TiStream now that it supports async calls
		TiStream outputStream = (TiStream) args[0];
		if (outputStream.isWritable()) {
			Object[] newArgs = new Object[args.length - 1];
			System.arraycopy(args, 1, newArgs, 0, args.length - 1);
			outputStream.write(newArgs);
		}
	}

	@Kroll.method
	//public void writeStream(TiStream inputStream, TiStream outputStream, int maxChunkSize) throws IOException
	//public void writeStream(TiStream inputStream, TiStream outputStream, int maxChunkSize, KrollFunction resultsCallback)
	public int writeStream(Object args[]) throws IOException
	{
		if (args.length < 3 || args.length > 4) {
			throw new IllegalArgumentException("Invalid number of arguments");
		}

		if (!(args[0] instanceof TiStream)) {
			throw new IllegalArgumentException("Invalid input stream argument");
		}
		TiStream inputStream = (TiStream) args[0];

		if (!(args[1] instanceof TiStream)) {
			throw new IllegalArgumentException("Invalid output stream argument");
		}
		TiStream outputStream = (TiStream) args[1];

		if (!(args[2] instanceof Number)) {
			throw new IllegalArgumentException("Invalid max chunk size argument");
		}
		int maxChunkSize = ((Number) args[2]).intValue();

		// sync variant?
		if (args.length == 3) {
			// Spit out deprecation notice about sync call!
			// And throw exception when on main thread!
			// final String syncIsANoNo = "Synchronous invocation of writeStream will crash under the main thread. This will no longer be supported in SDK 8.0.0. Please invoke with a final callback function to receive the result.";
			// if (TiApplication.isUIThread()) {
			// 	throw new IOException(syncIsANoNo);
			// } else {
			// 	Log.w(TAG, syncIsANoNo);
			// }
			// FIXME: Use same thread/Runnable model as in TiStreamHelper when running sync on main thread?
			return writeStreamSync(inputStream, outputStream, maxChunkSize);
		}

		if (!(args[3] instanceof KrollFunction)) {
			throw new IllegalArgumentException("Invalid callback argument");
		}
		KrollFunction resultsCallback = (KrollFunction) args[3];

		final TiStream finputStream = inputStream;
		final TiStream foutputStream = outputStream;
		final int fmaxChunkSize = maxChunkSize;
		final KrollFunction fResultsCallback = resultsCallback;

		new Thread(new Runnable() {
			public void run()
			{
				int totalBytesWritten = 0;
				int code = 0;
				String error = "";

				try {
					totalBytesWritten = writeStreamSync(finputStream, foutputStream, fmaxChunkSize);

				} catch (IOException e) {
					code = 1;
					error = e.getMessage();
				}

				fResultsCallback.callAsync(
					getKrollObject(),
					buildWriteStreamCallbackArgs(finputStream, foutputStream, totalBytesWritten, code, error));
			}
		})
			.start();

		return 0;
	}

	private int writeStreamSync(TiStream inputStream, TiStream outputStream, int maxChunkSize) throws IOException
	{
		BufferProxy buffer = new BufferProxy(maxChunkSize);
		int totalBytesWritten = 0;

		while (inputStream.isReadable() && outputStream.isWritable()) {
			int bytesRead = inputStream.readSync(buffer, 0, maxChunkSize);
			if (bytesRead == -1) {
				break;
			}

			int bytesWritten = outputStream.writeSync(buffer, 0, bytesRead);
			totalBytesWritten += bytesWritten;
			buffer.clear();
		}

		return totalBytesWritten;
	}

	@Kroll.method
	//public void pump(TiStream inputStream, KrollFunction handler, int maxChunkSize)
	//public void pump(TiStream inputStream, KrollFunction handler, int maxChunkSize, boolean isAsync)
	public void pump(Object args[])
	{
		if (args.length != 3 && args.length != 4) {
			throw new IllegalArgumentException("Invalid number of arguments");
		}

		// stream
		if (!(args[0] instanceof TiStream)) {
			throw new IllegalArgumentException("Invalid stream argument");
		}
		TiStream inputStream = (TiStream) args[0];

		// handler
		if (!(args[1] instanceof KrollFunction)) {
			throw new IllegalArgumentException("Invalid handler argument");
		}
		KrollFunction handler = (KrollFunction) args[1];

		// max chunk size
		if (!(args[2] instanceof Number)) {
			throw new IllegalArgumentException("Invalid max chunk size argument");
		}
		int maxChunkSize = ((Number) args[2]).intValue();

		// isAsync
		boolean isAsync = false;
		if (args.length == 4) {
			if (!(args[3] instanceof Boolean)) {
				throw new IllegalArgumentException("Invalid async flag argument");
			}
			isAsync = ((Boolean) args[3]).booleanValue();
		}

		if (!isAsync) {
			// Spit out deprecation notice about sync call!
			// And throw exception when on main thread!
			// final String syncIsANoNo = "Synchronous invocation of pump will crash under the main thread. This will no longer be supported in SDK 8.0.0. final async boolean argument will be removed and calls will be assumed to be async.";
			// if (TiApplication.isUIThread()) {
			// 	throw new IllegalArgumentException(syncIsANoNo);
			// } else {
			// 	Log.w(TAG, syncIsANoNo);
			// }
			// FIXME: Use same thread/Runnable model as in TiStreamHelper when running sync on main thread?
			pumpSync(inputStream, handler, maxChunkSize);
		} else {
			final TiStream finputStream = inputStream;
			final KrollFunction fHandler = handler;
			final int fmaxChunkSize = maxChunkSize;

			new Thread(new Runnable() {
				public void run()
				{
					pumpSync(finputStream, fHandler, fmaxChunkSize);
				}
			}) {}
				.start();
		}
	}

	private void pumpSync(TiStream inputStream, KrollFunction handler, int maxChunkSize)
	{
		int totalBytesRead = 0;
		final KrollObject krollObject = getKrollObject();
		try {
			while (inputStream.isReadable()) {
				BufferProxy buffer = new BufferProxy(maxChunkSize);
				int bytesRead = inputStream.readSync(buffer, 0, maxChunkSize);
				if (bytesRead != -1) {
					totalBytesRead += bytesRead;
				}

				if (bytesRead != buffer.getLength()) {
					if (bytesRead == -1) {
						buffer.resize(0);
					} else {
						buffer.resize(bytesRead);
					}
				}

				handler.call(krollObject, buildPumpCallbackArgs(inputStream, buffer, bytesRead, totalBytesRead, 0, ""));
				buffer = null;

				if (bytesRead == -1) {
					break;
				}
			}

		} catch (IOException e) {
			handler.call(krollObject,
						 buildPumpCallbackArgs(inputStream, new BufferProxy(), 0, totalBytesRead, 1, e.getMessage()));
		}
	}

	private KrollDict buildWriteStreamCallbackArgs(TiStream fromStream, TiStream toStream, int bytesProcessed, int code,
												   String error)
	{
		KrollDict callbackArgs = new KrollDict();
		callbackArgs.put("fromStream", fromStream);
		callbackArgs.put("toStream", toStream);
		callbackArgs.put("bytesProcessed", bytesProcessed);
		callbackArgs.putCodeAndMessage(code, error);

		return callbackArgs;
	}

	private KrollDict buildPumpCallbackArgs(TiStream sourceStream, BufferProxy buffer, int bytesProcessed,
											int totalBytesProcessed, int code, String error)
	{
		KrollDict callbackArgs = new KrollDict();
		callbackArgs.put("source", sourceStream);
		callbackArgs.put("buffer", buffer);
		callbackArgs.put("bytesProcessed", bytesProcessed);
		callbackArgs.put("totalBytesProcessed", totalBytesProcessed);
		callbackArgs.putCodeAndMessage(code, error);

		return callbackArgs;
	}

	@Override
	public String getApiName()
	{
		return "Ti.Stream";
	}
}
