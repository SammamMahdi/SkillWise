const crypto = require('crypto');

class MessageEncryption {
  constructor() {
    // Use a stronger encryption algorithm
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.ivLength = 16; // 128 bits
    this.tagLength = 16; // 128 bits
  }

  /**
   * Generate a random encryption key
   * @returns {string} Base64 encoded key
   */
  generateKey() {
    return crypto.randomBytes(this.keyLength).toString('base64');
  }

  /**
   * Encrypt a message
   * @param {string} plaintext - Message to encrypt
   * @param {string} key - Base64 encoded encryption key
   * @returns {object} Encrypted data with iv, tag, and encrypted content
   */
  encrypt(plaintext, key) {
    try {
      const keyBuffer = Buffer.from(key, 'base64');
      const iv = crypto.randomBytes(this.ivLength);
      
      const cipher = crypto.createCipheriv(this.algorithm, keyBuffer, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      const tag = cipher.getAuthTag();
      
      return {
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        encrypted: encrypted
      };
    } catch (error) {
      throw new Error('Encryption failed: ' + error.message);
    }
  }

  /**
   * Decrypt a message
   * @param {object} encryptedData - Object containing iv, tag, and encrypted content
   * @param {string} key - Base64 encoded encryption key
   * @returns {string} Decrypted plaintext
   */
  decrypt(encryptedData, key) {
    try {
      const keyBuffer = Buffer.from(key, 'base64');
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const tag = Buffer.from(encryptedData.tag, 'base64');
      
      const decipher = crypto.createDecipheriv(this.algorithm, keyBuffer, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed: ' + error.message);
    }
  }

  /**
   * Generate a conversation key for two users
   * This ensures both users can encrypt/decrypt messages with the same key
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @param {string} salt - Additional salt for key derivation
   * @returns {string} Base64 encoded conversation key
   */
  generateConversationKey(userId1, userId2, salt = 'friendchat') {
    // Sort user IDs to ensure consistent key generation regardless of order
    const sortedIds = [userId1, userId2].sort();
    const combinedId = sortedIds.join(':') + ':' + salt;
    
    // Use PBKDF2 to derive a key from the combined ID
    const key = crypto.pbkdf2Sync(combinedId, salt, 100000, this.keyLength, 'sha256');
    return key.toString('base64');
  }

  /**
   * Hash a message for integrity verification (optional)
   * @param {string} message - Message to hash
   * @returns {string} SHA-256 hash
   */
  hashMessage(message) {
    return crypto.createHash('sha256').update(message).digest('hex');
  }

  /**
   * Encrypt file metadata (filename, mimetype, etc.)
   * @param {Object} fileData - File metadata object
   * @param {string} key - Base64 encoded encryption key
   * @returns {string} Encrypted file data
   */
  encryptFileData(fileData, key) {
    return this.encryptToString(JSON.stringify(fileData), key);
  }

  /**
   * Decrypt file metadata
   * @param {string} encryptedFileData - Encrypted file data
   * @param {string} key - Base64 encoded encryption key
   * @returns {Object} Decrypted file metadata
   */
  decryptFileData(encryptedFileData, key) {
    const decrypted = this.decryptFromString(encryptedFileData, key);
    return JSON.parse(decrypted);
  }

  /**
   * Generate a secure random filename for uploaded files
   * @param {string} originalName - Original filename
   * @returns {string} Secure filename
   */
  generateSecureFilename(originalName) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const ext = originalName.split('.').pop();
    return `${timestamp}_${random}.${ext}`;
  }

  /**
   * Alias for generateConversationKey for backward compatibility
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {string} Base64 encoded conversation key
   */
  deriveChatKey(userId1, userId2) {
    return this.generateConversationKey(userId1, userId2);
  }

  /**
   * Encrypt a message and return as string for database storage
   * @param {string} plaintext - Text to encrypt
   * @param {string} key - Base64 encoded encryption key
   * @returns {string} Encrypted data as string (iv:tag:encrypted)
   */
  encryptToString(plaintext, key) {
    try {
      const keyBuffer = Buffer.from(key, 'base64');
      const iv = crypto.randomBytes(this.ivLength);
      
      const cipher = crypto.createCipheriv(this.algorithm, keyBuffer, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Return as colon-separated string: iv:tag:encrypted
      return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
    } catch (error) {
      throw new Error('Encryption failed: ' + error.message);
    }
  }

  /**
   * Decrypt a string-formatted encrypted message
   * @param {string} encryptedString - Encrypted data as string (iv:tag:encrypted)
   * @param {string} key - Base64 encoded encryption key
   * @returns {string} Decrypted plaintext
   */
  decryptFromString(encryptedString, key) {
    try {
      const parts = encryptedString.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const keyBuffer = Buffer.from(key, 'base64');
      const iv = Buffer.from(parts[0], 'hex');
      const tag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipheriv(this.algorithm, keyBuffer, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error('Decryption failed: ' + error.message);
    }
  }
}

module.exports = new MessageEncryption();
