/**
 * Habita — Document File Manager
 * Phase 3: OCR Pipeline
 *
 * Handles saving, loading, and deleting uploaded documents
 * using expo-file-system. Documents are stored in the app's
 * document directory (persistent across restarts).
 */

import * as FileSystem from 'expo-file-system/legacy';

const DOCUMENT_SUBDIR = 'documents';

/**
 * Ensure the document subdirectory exists.
 * Creates it if necessary.
 */
async function ensureDirectoryExists() {
  const dir = FileSystem.documentDirectory + DOCUMENT_SUBDIR + '/';
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
  return dir;
}

/**
 * Save an uploaded file (from image picker or camera) to app storage.
 * @param {string} sourceUri - The URI returned by expo-image-picker
 * @param {string} fileName - Desired filename (e.g. 'tenancy_2026_01.jpg')
 * @returns {Promise<string>} The persistent file URI
 */
export async function saveUploadedDocument(sourceUri, fileName) {
  try {
    const baseDir = await ensureDirectoryExists();
    const destUri = baseDir + fileName;

    // Copy the file from the picker's cache location to persistent storage
    await FileSystem.copyAsync({
      from: sourceUri,
      to: destUri,
    });

    return destUri;
  } catch (err) {
    console.error('[FileManager] Failed to save document:', err);
    throw new Error('Failed to save document: ' + err.message);
  }
}

/**
 * Get the URI for a stored document.
 * @param {string} relativePath - Path relative to the documents directory
 * @returns {string} Full file URI
 */
export function getFileUri(relativePath) {
  return FileSystem.documentDirectory + DOCUMENT_SUBDIR + '/' + relativePath;
}

/**
 * Delete a stored document.
 * @param {string} relativePath - Path relative to the documents directory
 * @returns {Promise<boolean>} True if deleted, false if file didn't exist
 */
export async function deleteDocument(relativePath) {
  try {
    const fileUri = getFileUri(relativePath);
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists) {
      await FileSystem.deleteAsync(fileUri);
      return true;
    }
    return false;
  } catch (err) {
    console.error('[FileManager] Failed to delete document:', err);
    return false;
  }
}

/**
 * Read a document file as base64 (useful for displaying images).
 * @param {string} relativePath
 * @returns {Promise<string>} Base64-encoded file content
 */
export async function readDocumentAsBase64(relativePath) {
  try {
    const fileUri = getFileUri(relativePath);
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (err) {
    console.error('[FileManager] Failed to read document:', err);
    throw new Error('Failed to read document: ' + err.message);
  }
}

/**
 * List all stored documents.
 * @returns {Promise<Array<{uri: string, name: string, size: number, modificationDate: string}>>}
 */
export async function listDocuments() {
  try {
    const dir = FileSystem.documentDirectory + DOCUMENT_SUBDIR + '/';
    const contents = await FileSystem.readDirectoryAsync(dir);
    const files = [];

    for (const name of contents) {
      const info = await FileSystem.getInfoAsync(dir + name);
      if (info.exists && !info.isDirectory) {
        files.push({
          uri: dir + name,
          name,
          size: info.size || 0,
          modificationDate: info.modificationTime || null,
        });
      }
    }

    return files.sort((a, b) => new Date(b.modificationDate) - new Date(a.modificationDate));
  } catch (err) {
    console.error('[FileManager] Failed to list documents:', err);
    return [];
  }
}
