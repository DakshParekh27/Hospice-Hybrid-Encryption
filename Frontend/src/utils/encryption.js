class CryptoManager {
  static async generateKeyPair() {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 4096,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    );
    return keyPair;
  }

  static async exportPublicKey(publicKey) {
    const exported = await window.crypto.subtle.exportKey('spki', publicKey);
    return this.arrayBufferToBase64(exported);
  }

  static async exportPrivateKey(privateKey) {
    const exported = await window.crypto.subtle.exportKey('pkcs8', privateKey);
    return this.arrayBufferToBase64(exported);
  }

  static async importPublicKey(base64Key) {
    const binaryKey = this.base64ToArrayBuffer(base64Key);
    return await window.crypto.subtle.importKey(
      'spki',
      binaryKey,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      true,
      ['encrypt']
    );
  }

  static async importPrivateKey(base64Key) {
    const binaryKey = this.base64ToArrayBuffer(base64Key);
    return await window.crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      true,
      ['decrypt']
    );
  }

  static async generateAESKey() {
    return await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  static async exportAESKey(key) {
    const exported = await window.crypto.subtle.exportKey('raw', key);
    return this.arrayBufferToBase64(exported);
  }

  static async importAESKey(base64Key) {
    const binaryKey = this.base64ToArrayBuffer(base64Key);
    return await window.crypto.subtle.importKey(
      'raw',
      binaryKey,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );
  }

  static async encryptFileWithAES(file, aesKey) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const fileBuffer = await file.arrayBuffer();
    
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      aesKey,
      fileBuffer
    );

    return {
      encryptedData: encryptedBuffer,
      iv: this.arrayBufferToBase64(iv)
    };
  }

  static async decryptFileWithAES(encryptedData, aesKey, ivBase64) {
    try {
      // Accept Blob or ArrayBuffer
      let encryptedBuffer;
      if (encryptedData instanceof Blob) {
        encryptedBuffer = await encryptedData.arrayBuffer();
      } else if (encryptedData && encryptedData.buffer && encryptedData.byteLength !== undefined) {
        // TypedArray (Uint8Array) or ArrayBufferView
        encryptedBuffer = encryptedData.buffer || encryptedData;
      } else {
        encryptedBuffer = encryptedData;
      }

      const iv = this.base64ToArrayBuffer(ivBase64);
      const ivBytes = new Uint8Array(iv);
      if (ivBytes.length < 12) {
        throw new Error(`Invalid IV length: ${ivBytes.length} (expected >= 12)`);
      }

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBytes
        },
        aesKey,
        encryptedBuffer
      );

      // Quick heuristics for PDFs: check for "%PDF" at the start
      try {
        const header = new Uint8Array(decryptedBuffer.slice(0, 4));
        const isPDF = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46;
        if (!isPDF) {
          // not necessarily an error for other filetypes, but log for debugging
          console.warn('Decrypted file does not start with PDF header ("%PDF"). Header bytes:', header);
        }
      } catch (hErr) {
        // ignore header check errors
        console.warn('Error while checking decrypted file header:', hErr);
      }

      return decryptedBuffer;
    } catch (err) {
      // Surface a clearer error that includes sizes (without exposing key material)
      const size = encryptedData && encryptedData.byteLength ? encryptedData.byteLength : (encryptedData && encryptedData.size ? encryptedData.size : 'unknown');
      throw new Error(`AES-GCM decryption failed: ${err.message} (encrypted size=${size})`);
    }
  }

  static async encryptAESKeyWithRSA(aesKeyBase64, publicKey) {
    const aesKeyBuffer = this.base64ToArrayBuffer(aesKeyBase64);
    
    const encryptedKey = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP'
      },
      publicKey,
      aesKeyBuffer
    );

    return this.arrayBufferToBase64(encryptedKey);
  }

  static async decryptAESKeyWithRSA(encryptedKeyBase64, privateKey) {
    const encryptedKeyBuffer = this.base64ToArrayBuffer(encryptedKeyBase64);
    
    const decryptedKey = await window.crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP'
      },
      privateKey,
      encryptedKeyBuffer
    );

    return this.arrayBufferToBase64(decryptedKey);
  }

  static async deriveKeyFromPassword(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  static async encryptPrivateKeyWithPassword(privateKeyBase64, password) {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    const derivedKey = await this.deriveKeyFromPassword(password, salt);
    
    const privateKeyBuffer = this.base64ToArrayBuffer(privateKeyBase64);
    const encryptedPrivateKey = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      derivedKey,
      privateKeyBuffer
    );

    return {
      encryptedPrivateKey: this.arrayBufferToBase64(encryptedPrivateKey),
      iv: this.arrayBufferToBase64(iv),
      salt: this.arrayBufferToBase64(salt)
    };
  }

  static async decryptPrivateKeyWithPassword(encryptedPrivateKeyBase64, password, ivBase64, saltBase64) {
    const salt = this.base64ToArrayBuffer(saltBase64);
    const iv = this.base64ToArrayBuffer(ivBase64);
    
    const derivedKey = await this.deriveKeyFromPassword(password, salt);
    
    const encryptedBuffer = this.base64ToArrayBuffer(encryptedPrivateKeyBase64);
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      derivedKey,
      encryptedBuffer
    );

    return this.arrayBufferToBase64(decryptedBuffer);
  }

  static arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  static base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  static async createEncryptedBlob(encryptedData, originalFileName) {
    const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
    return new File([blob], originalFileName + '.encrypted', { type: 'application/octet-stream' });
  }

  static async downloadDecryptedFile(decryptedData, fileName, mimeType) {
    const blob = new Blob([decryptedData], { type: mimeType || 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName.replace('.encrypted', '');
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}

export default CryptoManager;