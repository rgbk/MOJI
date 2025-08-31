import { supabase } from './supabase'

export const debugSupabase = async () => {
  console.log('🔍 DEBUG: Environment Variables - FRESH CHECK')
  console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
  console.log('SHOULD BE: https://mmptmlxdrrrxztaewdkv.supabase.co')
  console.log('VITE_SUPABASE_ANON_KEY exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY)
  console.log('VITE_SUPABASE_ANON_KEY length:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length)

  console.log('🔍 DEBUG: Supabase Client')
  console.log('Supabase client created:', !!supabase)

  // Test basic connection
  try {
    console.log('🔍 DEBUG: Testing Connection')
    const { data, error } = await supabase.from('game_rooms').select('count').limit(1)
    console.log('Connection test result:', { data, error })
    
    if (error) {
      console.error('❌ Connection failed:', error)
      return { success: false, error: error.message }
    } else {
      console.log('✅ Connection successful!')
      return { success: true }
    }
  } catch (err) {
    console.error('❌ Connection error:', err)
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}