/**
 * Appcelerator Titanium License
 * This source code and all modifications done by Appcelerator
 * are licensed under the Apache Public License (version 2) and
 * are Copyright (c) 2009 by Appcelerator, Inc.
 */

/*
 * Copyright (C) 2006 Apple Computer, Inc.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE COMPUTER, INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE COMPUTER, INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. 
 */

#ifndef TiStringRef_h
#define TiStringRef_h

#include <TiCore/TiValueRef.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif
#include <stddef.h> /* for size_t */

#ifdef __cplusplus
extern "C" {
#endif

#if !defined(WIN32) && !defined(_WIN32) && !defined(__WINSCW__)
/*!
@typedef TiChar
@abstract A Unicode character.
*/
    typedef unsigned short TiChar;
#else
    typedef wchar_t TiChar;
#endif

/*!
@function
@abstract         Creates a Ti string from a buffer of Unicode characters.
@param chars      The buffer of Unicode characters to copy into the new TiString.
@param numChars   The number of characters to copy from the buffer pointed to by chars.
@result           A TiString containing chars. Ownership follows the Create Rule.
*/
JS_EXPORT TiStringRef TiStringCreateWithCharacters(const TiChar* chars, size_t numChars);
/*!
@function
@abstract         Creates a Ti string from a null-terminated UTF8 string.
@param string     The null-terminated UTF8 string to copy into the new TiString.
@result           A TiString containing string. Ownership follows the Create Rule.
*/
JS_EXPORT TiStringRef TiStringCreateWithUTF8CString(const char* string);

/*!
@function
@abstract         Retains a Ti string.
@param string     The TiString to retain.
@result           A TiString that is the same as string.
*/
JS_EXPORT TiStringRef TiStringRetain(TiStringRef string);
/*!
@function
@abstract         Releases a Ti string.
@param string     The TiString to release.
*/
JS_EXPORT void TiStringRelease(TiStringRef string);

/*!
@function
@abstract         Returns the number of Unicode characters in a Ti string.
@param string     The TiString whose length (in Unicode characters) you want to know.
@result           The number of Unicode characters stored in string.
*/
JS_EXPORT size_t TiStringGetLength(TiStringRef string);
/*!
@function
@abstract         Returns a pointer to the Unicode character buffer that 
 serves as the backing store for a Ti string.
@param string     The TiString whose backing store you want to access.
@result           A pointer to the Unicode character buffer that serves as string's 
 backing store, which will be deallocated when string is deallocated.
*/
JS_EXPORT const TiChar* TiStringGetCharactersPtr(TiStringRef string);

/*!
@function
@abstract Returns the maximum number of bytes a Ti string will 
 take up if converted into a null-terminated UTF8 string.
@param string The TiString whose maximum converted size (in bytes) you 
 want to know.
@result The maximum number of bytes that could be required to convert string into a 
 null-terminated UTF8 string. The number of bytes that the conversion actually ends 
 up requiring could be less than this, but never more.
*/
JS_EXPORT size_t TiStringGetMaximumUTF8CStringSize(TiStringRef string);
/*!
@function
@abstract Converts a Ti string into a null-terminated UTF8 string, 
 and copies the result into an external byte buffer.
@param string The source TiString.
@param buffer The destination byte buffer into which to copy a null-terminated 
 UTF8 representation of string. On return, buffer contains a UTF8 string 
 representation of string. If bufferSize is too small, buffer will contain only 
 partial results. If buffer is not at least bufferSize bytes in size, 
 behavior is undefined. 
@param bufferSize The size of the external buffer in bytes.
@result The number of bytes written into buffer (including the null-terminator byte).
*/
JS_EXPORT size_t TiStringGetUTF8CString(TiStringRef string, char* buffer, size_t bufferSize);

/*!
@function
@abstract     Tests whether two Ti strings match.
@param a      The first TiString to test.
@param b      The second TiString to test.
@result       true if the two strings match, otherwise false.
*/
JS_EXPORT bool TiStringIsEqual(TiStringRef a, TiStringRef b);
/*!
@function
@abstract     Tests whether a Ti string matches a null-terminated UTF8 string.
@param a      The TiString to test.
@param b      The null-terminated UTF8 string to test.
@result       true if the two strings match, otherwise false.
*/
JS_EXPORT bool TiStringIsEqualToUTF8CString(TiStringRef a, const char* b);

#ifdef __cplusplus
}
#endif

#endif /* TiStringRef_h */
