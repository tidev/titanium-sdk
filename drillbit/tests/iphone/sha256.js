// This test checks encoding of a string using the SHA2 (256) Secure hash alogrithm
describe("Test of SHA256", {
    testAdd: function() {
        valueOf(Ti.Utils.sha256("The quick brown fox jumps over the lazy dog.")).shouldBe('ef537f25c895bfa782526529a9b63d97aa631564d5d789c2b765448c8635fb6c');
    }
});
