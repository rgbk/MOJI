// Paste this in browser console on the admin page to force delete unused keys
async function forceCleanupUI() {
  console.log('🧹 Force cleaning up unused UI keys...');
  
  // Get the uiCopyService from the window (if available)
  if (window.uiCopyService) {
    try {
      await window.uiCopyService.deleteKey('home.button.admin');
      console.log('✅ Deleted home.button.admin');
    } catch (e) {
      console.log('ℹ️ home.button.admin not found');
    }
    
    try {
      await window.uiCopyService.deleteKey('home.button.join');
      console.log('✅ Deleted home.button.join');
    } catch (e) {
      console.log('ℹ️ home.button.join not found');
    }
    
    // Force reload the UI copy
    await window.uiCopyService.load();
    console.log('🔄 Reloaded UI copy - refresh the page to see changes');
  } else {
    console.error('❌ uiCopyService not available in window');
  }
}

// Run it
forceCleanupUI();