/**
 * Validates that a string contains only standard Unicode characters
 * Allows letters, numbers, basic punctuation, and common symbols
 * Blocks emojis, special symbols, and non-standard characters
 */

export function isValidUnicodeUsername(username: string): boolean {
  if (!username || username.trim().length === 0) {
    return false;
  }

  // Regex pattern for standard Unicode characters
  // Allows:
  // - Basic Latin letters (a-z, A-Z)
  // - Latin Extended letters (á, é, í, ó, ú, etc.)
  // - Numbers (0-9)
  // - Common punctuation and symbols: space, hyphen, underscore, period, apostrophe
  // - Common currency and math symbols: @, #, $, %, &, *, +, =, etc.
  const standardUnicodePattern = /^[\p{L}\p{N}\s\-_\.'@#\$%&*+=<>!?~`|\\/()[\]{}":;,\u00A0-\u017F\u0100-\u017F\u0180-\u024F\u1E00-\u1EFF]*$/u;
  
  // Block emojis and other non-standard characters
  const emojiPattern = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  
  // Check if string contains only standard Unicode characters
  const hasStandardChars = standardUnicodePattern.test(username);
  
  // Check if string contains emojis or special symbols
  const hasEmojis = emojiPattern.test(username);
  
  // Valid if it has standard chars and no emojis
  return hasStandardChars && !hasEmojis;
}

export function getUnicodeValidationMessage(invalidUsername: string): string {
  // Check what type of invalid characters are present
  const emojiPattern = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  
  if (emojiPattern.test(invalidUsername)) {
    return 'Username cannot contain emojis or special symbols';
  }
  
  return 'Username can only contain letters, numbers, and basic punctuation';
}
