package ti.crypt;

import java.security.MessageDigest;

public class Binding {

	public static byte[] getKey(byte[] salt) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hash = digest.digest(salt);

			byte[] key = new byte[16];
			System.arraycopy(hash, 0, key, 0, 16);
			return key;

		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}
}
