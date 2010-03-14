/**
 * Appcelerator Titanium License
 * This source code and all modifications done by Appcelerator
 * are licensed under the Apache Public License (version 2) and
 * are Copyright (c) 2009 by Appcelerator, Inc.
 */

/*
 * Copyright (C) 2005, 2006, 2007 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer. 
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution. 
 * 3.  Neither the name of Apple Computer, Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission. 
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#ifndef TiRetainPtr_h
#define TiRetainPtr_h

#include <TiCore/TiStringRef.h>
#include <algorithm>

inline void TiRetain(TiStringRef string) { TiStringRetain(string); }
inline void TiRelease(TiStringRef string) { TiStringRelease(string); }

enum AdoptTag { Adopt };

template <typename T> class TiRetainPtr {
public:
    TiRetainPtr() : m_ptr(0) {}
    TiRetainPtr(T ptr) : m_ptr(ptr) { if (ptr) TiRetain(ptr); }

    TiRetainPtr(AdoptTag, T ptr) : m_ptr(ptr) { }
    
    TiRetainPtr(const TiRetainPtr& o) : m_ptr(o.m_ptr) { if (T ptr = m_ptr) TiRetain(ptr); }

    ~TiRetainPtr() { if (T ptr = m_ptr) TiRelease(ptr); }
    
    template <typename U> TiRetainPtr(const TiRetainPtr<U>& o) : m_ptr(o.get()) { if (T ptr = m_ptr) TiRetain(ptr); }
    
    T get() const { return m_ptr; }
    
    T releaseRef() { T tmp = m_ptr; m_ptr = 0; return tmp; }
    
    T operator->() const { return m_ptr; }
    
    bool operator!() const { return !m_ptr; }

    // This conversion operator allows implicit conversion to bool but not to other integer types.
    typedef T TiRetainPtr::*UnspecifiedBoolType;
    operator UnspecifiedBoolType() const { return m_ptr ? &TiRetainPtr::m_ptr : 0; }
    
    TiRetainPtr& operator=(const TiRetainPtr&);
    template <typename U> TiRetainPtr& operator=(const TiRetainPtr<U>&);
    TiRetainPtr& operator=(T);
    template <typename U> TiRetainPtr& operator=(U*);

    void adopt(T);
    
    void swap(TiRetainPtr&);

private:
    T m_ptr;
};

template <typename T> inline TiRetainPtr<T>& TiRetainPtr<T>::operator=(const TiRetainPtr<T>& o)
{
    T optr = o.get();
    if (optr)
        TiRetain(optr);
    T ptr = m_ptr;
    m_ptr = optr;
    if (ptr)
        TiRelease(ptr);
    return *this;
}

template <typename T> template <typename U> inline TiRetainPtr<T>& TiRetainPtr<T>::operator=(const TiRetainPtr<U>& o)
{
    T optr = o.get();
    if (optr)
        TiRetain(optr);
    T ptr = m_ptr;
    m_ptr = optr;
    if (ptr)
        TiRelease(ptr);
    return *this;
}

template <typename T> inline TiRetainPtr<T>& TiRetainPtr<T>::operator=(T optr)
{
    if (optr)
        TiRetain(optr);
    T ptr = m_ptr;
    m_ptr = optr;
    if (ptr)
        TiRelease(ptr);
    return *this;
}

template <typename T> inline void TiRetainPtr<T>::adopt(T optr)
{
    T ptr = m_ptr;
    m_ptr = optr;
    if (ptr)
        TiRelease(ptr);
}

template <typename T> template <typename U> inline TiRetainPtr<T>& TiRetainPtr<T>::operator=(U* optr)
{
    if (optr)
        TiRetain(optr);
    T ptr = m_ptr;
    m_ptr = optr;
    if (ptr)
        TiRelease(ptr);
    return *this;
}

template <class T> inline void TiRetainPtr<T>::swap(TiRetainPtr<T>& o)
{
    std::swap(m_ptr, o.m_ptr);
}

template <class T> inline void swap(TiRetainPtr<T>& a, TiRetainPtr<T>& b)
{
    a.swap(b);
}

template <typename T, typename U> inline bool operator==(const TiRetainPtr<T>& a, const TiRetainPtr<U>& b)
{ 
    return a.get() == b.get(); 
}

template <typename T, typename U> inline bool operator==(const TiRetainPtr<T>& a, U* b)
{ 
    return a.get() == b; 
}

template <typename T, typename U> inline bool operator==(T* a, const TiRetainPtr<U>& b) 
{
    return a == b.get(); 
}

template <typename T, typename U> inline bool operator!=(const TiRetainPtr<T>& a, const TiRetainPtr<U>& b)
{ 
    return a.get() != b.get(); 
}

template <typename T, typename U> inline bool operator!=(const TiRetainPtr<T>& a, U* b)
{
    return a.get() != b; 
}

template <typename T, typename U> inline bool operator!=(T* a, const TiRetainPtr<U>& b)
{ 
    return a != b.get(); 
}


#endif // TiRetainPtr_h
