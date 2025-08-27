/**
 * Video utilities for MOJI!
 */

export function getVideoUrl(videoFile: string | undefined): string | null {
  if (!videoFile) return null
  
  // Construct the public path
  return `/videos/${videoFile}`
}

export function checkVideoExists(videoFile: string | undefined): Promise<boolean> {
  if (!videoFile) return Promise.resolve(false)
  
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.onloadstart = () => resolve(true)
    video.onerror = () => resolve(false)
    video.src = getVideoUrl(videoFile)!
  })
}

/**
 * Get fallback YouTube embed if local video fails
 */
export function getYouTubeFallback(videoFile: string | undefined): string | null {
  const fallbacks: Record<string, string> = {
    'rhcp-under-the-bridge.mp4': 'https://www.youtube.com/embed/lwlogyj7nFE',
    'billie-eilish-ocean-eyes-official.mp4': 'https://www.youtube.com/embed/viimfQi_pUw',
    'soundgarden-black-hole-sun.mp4': 'https://www.youtube.com/embed/3mbBbFH9fAg',
    'survivor-eye-of-the-tiger.mp4': 'https://www.youtube.com/embed/btPJPFnesV4',
    'daft-punk-around-the-world.mp4': 'https://www.youtube.com/embed/dwDns8x3Jb4',
    'gorillaz-clint-eastwood.mp4': 'https://www.youtube.com/embed/1V_xRb0x9aw',
    'billy-idol-eyes-without-face.mp4': 'https://www.youtube.com/embed/9OFpfTd0EIs',
    'rainbow-stargazer.mp4': 'https://www.youtube.com/embed/p3VgV31vmUE',
    'prince-purple-rain.mp4': 'https://www.youtube.com/embed/TvnYmWpD_T8',
    'dire-straits-money-for-nothing.mp4': 'https://www.youtube.com/embed/wTP2RUD_cL0'
  }
  
  return videoFile ? fallbacks[videoFile] || null : null
}