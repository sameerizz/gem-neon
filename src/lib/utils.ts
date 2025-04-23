/**
 * Utility function to clear potentially corrupted localStorage data
 */
export function clearLocalStorageData() {
  try {
    // Remove Gemini-related localStorage items
    localStorage.removeItem('gemini-chats');
    localStorage.removeItem('gemini-current-chat');
    localStorage.removeItem('gemini-current-chat-id');
    console.log('Successfully cleared Gemini localStorage data');
    return true;
  } catch (error) {
    console.error('Error clearing localStorage:', error);
    return false;
  }
}

/**
 * Utility function to safely access localStorage with a fallback
 */
export function safeLocalStorage(key: string, fallback: any = null) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error);
    return fallback;
  }
} 