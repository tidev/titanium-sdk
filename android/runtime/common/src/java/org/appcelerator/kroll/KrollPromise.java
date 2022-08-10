package org.appcelerator.kroll;

import org.appcelerator.kroll.common.TiMessenger;

public interface KrollPromise<V> {

	interface OnExecuteCallback<V> {
		void onExecute(KrollPromise<V> promise);
	}

	void resolve(V value);

	void reject(Object value);

	static <V> KrollPromise<V> create(OnExecuteCallback<V> callback)
	{
		final KrollPromise<V> promise = KrollRuntime.getInstance().createPromise();
		TiMessenger.postOnRuntime(() -> {
			callback.onExecute(promise);
		});
		return promise;
	}

	class NullPromise implements KrollPromise
	{
		@Override
		public void resolve(Object value) {}
		@Override
		public void reject(Object value) {}
	}
}
