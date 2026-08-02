package com.wimmich.app.backup

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test
import java.io.File

class ChecksumUtilTest {

    @Test
    fun `same content produces the same checksum`() {
        val a = File.createTempFile("checksum_a", ".bin").apply { writeBytes("hello wimmich".toByteArray()) }
        val b = File.createTempFile("checksum_b", ".bin").apply { writeBytes("hello wimmich".toByteArray()) }

        assertEquals(ChecksumUtil.sha256(a), ChecksumUtil.sha256(b))
    }

    @Test
    fun `different content produces different checksums`() {
        val a = File.createTempFile("checksum_a", ".bin").apply { writeBytes("hello wimmich".toByteArray()) }
        val b = File.createTempFile("checksum_b", ".bin").apply { writeBytes("goodbye wimmich".toByteArray()) }

        assertNotEquals(ChecksumUtil.sha256(a), ChecksumUtil.sha256(b))
    }

    @Test
    fun `matches the known NIST sha256 test vector for 'abc'`() {
        val file = File.createTempFile("checksum_known", ".bin").apply { writeBytes("abc".toByteArray()) }

        assertEquals(
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
            ChecksumUtil.sha256(file),
        )
    }
}
