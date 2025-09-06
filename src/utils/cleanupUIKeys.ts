import { uiCopyService } from '../lib/uiCopy'

// Keys that are actually used in the code (found by grepping)
const USED_KEYS = [
  'answer.correct.opponent',
  'answer.correct.you',
  'answer.label',
  'answer.next.multi', 
  'answer.next.single',
  'answer.waiting',
  'game.error.reload',
  'game.error.title',
  'game.input.placeholder',
  'game.player.opponent',
  'game.player.you',
  'game.room.label',
  'game.waiting',
  'home.button.start',
  'home.subtitle',
  'home.title',
  'lobby.copied',
  'lobby.copied.help',
  'lobby.copy',
  'lobby.join.alert',
  'lobby.join.button',
  'lobby.join.help',
  'lobby.ready',
  'lobby.share',
  'lobby.start',
  'lobby.title',
  'lobby.waiting.host'
]

// Keys that are definitely unused (mentioned by user)
const UNUSED_KEYS = [
  'home.button.admin',
  'home.button.join'
]

export async function cleanupUnusedUIKeys() {
  console.log('🧹 Starting UI copy cleanup...')
  
  try {
    // Delete unused keys
    for (const key of UNUSED_KEYS) {
      try {
        await uiCopyService.deleteKey(key)
        console.log(`✅ Deleted unused key: ${key}`)
      } catch (error) {
        console.log(`ℹ️  Key ${key} doesn't exist (already clean)`)
      }
    }
    
    console.log('✅ UI copy cleanup complete!')
    console.log(`📊 Kept ${USED_KEYS.length} used keys`)
    console.log(`🗑️  Removed ${UNUSED_KEYS.length} unused keys`)
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error)
  }
}