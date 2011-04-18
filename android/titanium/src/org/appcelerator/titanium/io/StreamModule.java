/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

package org.appcelerator.titanium.io;

import java.io.IOException;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.kroll.KrollModule;
import org.appcelerator.kroll.annotations.Kroll;
import org.appcelerator.titanium.TiContext;
import org.appcelerator.titanium.kroll.KrollCallback;
import org.appcelerator.titanium.proxy.BufferProxy;
import org.appcelerator.titanium.util.TiConfig;


@Kroll.module
public class StreamModule extends KrollModule
{
	private static final String LCAT = "StreamModule";
	private static final boolean DBG = TiConfig.LOGD;


	public StreamModule(TiContext tiContext)
	{
		super(tiContext);
	}

	@Kroll.method
	public void read(final TiStream sourceStream, final BufferProxy buffer, final KrollCallback resultsCallback)
	{
		new Thread(
				new Runnable()
				{
					public void run()
					{
						int bytesRead = -1;
						String errorState = "";
						String errorDescription = "";

						try {
							bytesRead = sourceStream.read(buffer);


						} catch (IOException e) {
							e.printStackTrace();
							errorState = "error";
							errorDescription = e.getMessage();
						}

						resultsCallback.callAsync(buildRWCallbackArgs(sourceStream, bytesRead, errorState, errorDescription));
					}
				}
			) {}.start();
	}

	@Kroll.method
	public void read(final TiStream sourceStream, final BufferProxy buffer, final int offset, final int length, final KrollCallback resultsCallback)
	{
		new Thread(
				new Runnable()
				{
					public void run()
					{
						int bytesRead = -1;
						String errorState = "";
						String errorDescription = "";

						try {
							bytesRead = sourceStream.read(buffer, offset, length);


						} catch (IOException e) {
							e.printStackTrace();
							errorState = "error";
							errorDescription = e.getMessage();
						}

						resultsCallback.callAsync(buildRWCallbackArgs(sourceStream, bytesRead, errorState, errorDescription));
					}
				}
			) {}.start();
	}

	@Kroll.method
	public BufferProxy readAll(TiStream sourceStream) throws IOException
	{
		BufferProxy buffer = new BufferProxy(context, 1024);
		int offset = 0;

		while(true) {
			int bytesRead = sourceStream.read(buffer, offset, 1024);
			if(bytesRead == -1) {
				break;
			}

			buffer.resize(bytesRead);
			offset += bytesRead;
		}

		return buffer;
	}

	@Kroll.method
	public void readAll(final TiStream sourceStream, final BufferProxy buffer, final KrollCallback resultsCallback)
	{
		new Thread(
				new Runnable()
				{
					public void run()
					{
						int offset = 0;
						String errorState = "";
						String errorDescription = "";

						if(buffer.getLength() < 1024) {
							buffer.resize(1024);
						}

						try {
							while(true) {
								int bytesRead = sourceStream.read(buffer, offset, 1024);
								if(bytesRead == -1) {
									break;
								}

								buffer.resize(bytesRead);
								offset += bytesRead;
							}

						} catch (IOException e) {
							errorState = "error";
							errorDescription = e.getMessage();
						}

						resultsCallback.callAsync(buildRWCallbackArgs(sourceStream, buffer.getLength(), errorState, errorDescription));
					}
				}
			) {}.start();
	}

	@Kroll.method
	public void write(final TiStream outputStream, final BufferProxy buffer, final KrollCallback resultsCallback)
	{
		new Thread(
				new Runnable()
				{
					public void run()
					{
						int bytesWritten = -1;
						String errorState = "";
						String errorDescription = "";

						try {
							bytesWritten = outputStream.write(buffer);

						} catch (IOException e) {
							e.printStackTrace();
							errorState = "error";
							errorDescription = e.getMessage();
						}

						resultsCallback.callAsync(buildRWCallbackArgs(outputStream, bytesWritten, errorState, errorDescription));
					}
				}
			) {}.start();
	}

	@Kroll.method
	public void write(final TiStream outputStream, final BufferProxy buffer, final int offset, final int length, final KrollCallback resultsCallback)
	{
		new Thread(
				new Runnable()
				{
					public void run()
					{
						int bytesWritten = -1;
						String errorState = "";
						String errorDescription = "";

						try {
							bytesWritten = outputStream.write(buffer, offset, length);

						} catch (IOException e) {
							e.printStackTrace();
							errorState = "error";
							errorDescription = e.getMessage();
						}

						resultsCallback.callAsync(buildRWCallbackArgs(outputStream, bytesWritten, errorState, errorDescription));
					}
				}
			) {}.start();
	}

	@Kroll.method
	public void writeStream(TiStream inputStream, TiStream outputStream, int maxChunkSize) throws IOException
	{
		BufferProxy buffer = new BufferProxy(getTiContext(), maxChunkSize);

		while(true) {
			int bytesWritten = inputStream.read(buffer, 0, maxChunkSize);
			if(bytesWritten == -1) {
				break;
			}

			outputStream.write(buffer);
			buffer.clear();
		}
	}

	@Kroll.method
	public void writeStream(final TiStream inputStream, final TiStream outputStream, final int maxChunkSize, final KrollCallback resultsCallback)
	{
		new Thread(
				new Runnable()
				{
					public void run()
					{
						BufferProxy buffer = new BufferProxy(getTiContext(), maxChunkSize);
						int totalBytesWritten = 0;
						String errorState = "";
						String errorDescription = "";

						try {
							while(true) {
								int bytesWritten = inputStream.read(buffer, 0, maxChunkSize);
								if(bytesWritten == -1) {
									break;
								}

								outputStream.write(buffer);
								totalBytesWritten += bytesWritten;
								buffer.clear();
							}

						} catch (IOException e) {
							errorState = "error";
							errorDescription = e.getMessage();
						}

						resultsCallback.callAsync(buildWriteStreamCallbackArgs(inputStream, outputStream, totalBytesWritten, errorState, errorDescription));
					}
				}
			) {}.start();
	}

	@Kroll.method
	public void pump(TiStream inputStream, KrollCallback handler, int maxChunkSize)
	{
		BufferProxy buffer = new BufferProxy(getTiContext(), maxChunkSize);
		int totalBytesWritten = 0;
		String errorState = "";
		String errorDescription = "";

		try {
			while(true) {
				int bytesWritten = inputStream.read(buffer, 0, maxChunkSize);
				if(bytesWritten == -1) {
					break;
				}

				totalBytesWritten += bytesWritten;

				handler.callAsync(buildPumpCallbackArgs(inputStream, buffer, bytesWritten, totalBytesWritten, errorState, errorDescription));
				buffer.clear();
			}

		} catch (IOException e) {
			errorState = "error";
			errorDescription = e.getMessage();
			handler.callAsync(buildPumpCallbackArgs(inputStream, buffer, 0, totalBytesWritten, errorState, errorDescription));
		}
	}

	@Kroll.method
	public void pump(final TiStream inputStream, final KrollCallback handler, final int maxChunkSize, boolean isAsync)
	{
		if(isAsync)
		{
			new Thread(
					new Runnable()
					{
						public void run()
						{
							pump(inputStream, handler, maxChunkSize);
						}
					}
				) {}.start();

		} else {
			pump(inputStream, handler, maxChunkSize);
		}
	}

	private KrollDict buildRWCallbackArgs(TiStream sourceStream, int bytesProcessed, String errorState, String errorDescription)
	{
		KrollDict callbackArgs = new KrollDict();
		callbackArgs.put("source", sourceStream);
		callbackArgs.put("bytesProcessed", bytesProcessed);
		callbackArgs.put("errorState", errorState);
		callbackArgs.put("errorDescription", errorDescription);

		return callbackArgs;
	}

	private KrollDict buildWriteStreamCallbackArgs(TiStream fromStream, TiStream toStream, int bytesProcessed, String errorState, String errorDescription)
	{
		KrollDict callbackArgs = new KrollDict();
		callbackArgs.put("fromStream", fromStream);
		callbackArgs.put("toStream", toStream);
		callbackArgs.put("bytesProcessed", bytesProcessed);
		callbackArgs.put("errorState", errorState);
		callbackArgs.put("errorDescription", errorDescription);

		return callbackArgs;
	}

	private KrollDict buildPumpCallbackArgs(TiStream sourceStream, BufferProxy buffer, int bytesProcessed, int totalBytesProcessed, String errorState, String errorDescription)
	{
		KrollDict callbackArgs = new KrollDict();
		callbackArgs.put("source", sourceStream);
		callbackArgs.put("buffer", buffer);
		callbackArgs.put("bytesProcessed", bytesProcessed);
		callbackArgs.put("totalBytesProcessed", totalBytesProcessed);
		callbackArgs.put("errorState", errorState);
		callbackArgs.put("errorDescription", errorDescription);

		return callbackArgs;
	}
}
