/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package org.appcelerator.titanium.util;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.NoSuchElementException;

@SuppressWarnings({"serial"})
public class TiWeakList<T> extends ArrayList<WeakReference<T>> {

	protected List<WeakReference<T>> synchronizedList;

	public TiWeakList()
	{
		this(false);
	}

	public TiWeakList(boolean isSynchronized)
	{
		if (isSynchronized) {
			synchronizedList();
		}
	}

	public List<WeakReference<T>> synchronizedList()
	{
		if (synchronizedList == null) {
			synchronizedList = Collections.synchronizedList(this);
		}
		return synchronizedList;
	}

	public boolean refEquals(WeakReference<T> ref, Object o)
	{
		if (ref == null) return false;
		if (ref.get() == o) return true;
		if (ref.get() != null && ref.get().equals(o)) return true;
		return false;
	}

	protected boolean findRef(Object o)
	{
		for (WeakReference<T> ref : this) {
			if (refEquals(ref, o)) {
				return true;
			}
		}
		return false;
	}
	
	@Override
	public boolean add(WeakReference<T> o) 
	{
		if (synchronizedList != null) {
			synchronized (synchronizedList) {
				return super.add(o);
			}
		}
		return super.add(o);
	}

	@Override
	public boolean contains(Object o)
	{
		if (o instanceof WeakReference) return super.contains(o);
		if (synchronizedList != null) {
			synchronized (synchronizedList) {
				return findRef(o);
			}
		}
		return findRef(o);
	}

	protected boolean removeRef(Object o)
	{
		Iterator<WeakReference<T>> iter = iterator();
		while (iter.hasNext()) {
			WeakReference<T> ref = iter.next();
			if (refEquals(ref, o)) {
				iter.remove();
				return true;
			}
		}
		return false;
	}

	@Override
	public boolean remove(Object o)
	{
		if (o instanceof WeakReference) return super.remove(o);
		if (synchronizedList != null) {
			synchronized (synchronizedList) {
				return removeRef(o);
			}
		}
		return removeRef(o);
	}

	protected class NonNullIterator implements Iterator<T>
	{
		protected int index;

		public NonNullIterator(int index)
		{
			this.index = index;
		}

		protected int getNextIndex()
		{
			int size = size();
			for (int i = index; i < size; i++) {
				WeakReference<T> ref = get(i);
				if (ref != null && ref.get() != null) {
					return i;
				}
			}
			return -1;
		}

		@Override
		public boolean hasNext() {
			if (synchronizedList != null) {
				synchronized (synchronizedList) {
					return getNextIndex() >= 0;
				}
			} else {
				return getNextIndex() >= 0;
			}
		}

		@Override
		public T next() {
			if (synchronizedList != null) {
				synchronized (synchronizedList) {
					int nextIndex = getNextIndex();
					if (nextIndex < 0) throw new NoSuchElementException();
					index = nextIndex+1;
					return get(nextIndex).get();
				}
			} else {
				int nextIndex = getNextIndex();
				if (nextIndex < 0) throw new NoSuchElementException();
				index = nextIndex+1;
				return get(nextIndex).get();
			}
		}

		@Override
		public void remove() {
			if (synchronizedList != null) {
				synchronized (synchronizedList) {
					TiWeakList.this.remove(index);
				}
			} else {
				TiWeakList.this.remove(index);
			}
		}
	}

	public Iterator<T> nonNullIterator()
	{
		return new NonNullIterator(0);
	}

	public Iterable<T> nonNull()
	{
		return new Iterable<T>() {
			public Iterator<T> iterator() {
				return nonNullIterator();
			}
		};
	}
}
