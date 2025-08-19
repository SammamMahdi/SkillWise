const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

class MessageEncryption {
  /**
   * Generate a secure encryption key
   */
  static generateKey() {
    return crypto.randomBytes(KEY_LENGTH);
  }

  /**
   * Derive a chat key from two user IDs (deterministic)
   * This ensures both users get the same key for their conversation
   */
  static deriveChatKey(userId1, userId2) {
    // Sort user IDs to ensure consistent key generation
    const sortedIds = [userId1, userId2].sort();
    const combined = sortedIds.join(':');
    
    // Use PBKDF2 to derive key from user IDs
    const salt = crypto.createHash('sha256').update('SkillWise-Friends-Chat').digest();
    return crypto.pbkdf2Sync(combined, salt, 100000, KEY_LENGTH, 'sha256');
  }

  /**
   * Encrypt a message
   */
  static encrypt(text, key) {
    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipherGCM(ALGORITHM, key, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Combine iv, authTag, and encrypted data
      return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt a message
   */
  static decrypt(encryptedData, key) {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];

      const decipher = crypto.createDecipherGCM(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  /**
   * Encrypt file metadata (filename, mimetype, etc.)
   */
  static encryptFileData(fileData, key) {
    return this.encrypt(JSON.stringify(fileData), key);
  }

  /**
   * Decrypt file metadata
   */
  static decryptFileData(encryptedFileData, key) {
    const decrypted = this.decrypt(encryptedFileData, key);
    return JSON.parse(decrypted);
  }

  /**
   * Generate a secure random filename for uploaded files
   */
  static generateSecureFilename(originalName) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const ext = originalName.split('.').pop();
    return `${timestamp}_${random}.${ext}`;
  }

  /**
   * Hash a message for integrity checking (optional)
   */
  static hashMessage(message) {
    return crypto.createHash('sha256').update(message).digest('hex');
  }
}

module.exports = MessageEncryption;
