/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
package ti.crypt;

/**
 * Java binding for the 'libti.crypt.so' runtime library generated at build time
 * by the 'ti.crypt' encryption module. Mirrors ti.cloak.Binding, which is
 * provided by the closed source 'ti.cloak.jar'.
 */
public final class Binding
{
	/**
	 * Fetches the AES key used to decrypt the app's JavaScript assets.
	 *
	 * @param salt The salt the key was obfuscated with.
	 * @return Returns the decryption key.
	 */
	public static native byte[] getKey(byte[] salt);
}
