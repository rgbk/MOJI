import { useState, useEffect } from 'react'
import { uiCopyService, type UICopySection } from '../lib/uiCopy'
import { cn } from '../lib/utils'

export default function UICopyTab() {
  const [sections, setSections] = useState<UICopySection[]>([])
  const [selectedSection, setSelectedSection] = useState<string | null>(null)
  const [editingValues, setEditingValues] = useState<Record<string, string>>({})
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadSections()
  }, [])

  const loadSections = () => {
    const loadedSections = uiCopyService.getSections()
    setSections(loadedSections)
    if (loadedSections.length > 0 && !selectedSection) {
      setSelectedSection(loadedSections[0].id)
      setEditingValues(loadedSections[0].values)
    }
  }

  const handleSectionSelect = (sectionId: string) => {
    if (hasChanges) {
      if (!confirm('You have unsaved changes. Continue without saving?')) {
        return
      }
    }
    
    const section = sections.find(s => s.id === sectionId)
    if (section) {
      setSelectedSection(sectionId)
      setEditingValues(section.values)
      setHasChanges(false)
    }
  }

  const handleValueChange = (key: string, value: string) => {
    setEditingValues(prev => ({
      ...prev,
      [key]: value
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (selectedSection) {
      await uiCopyService.updateSection(selectedSection, editingValues)
      loadSections()
      setHasChanges(false)
      alert('UI copy saved successfully!')
    }
  }

  const handleReset = async () => {
    if (confirm('Reset all UI copy to defaults? This cannot be undone.')) {
      await uiCopyService.resetToDefaults()
      loadSections()
      setHasChanges(false)
    }
  }

  const handleExport = () => {
    const json = uiCopyService.exportCopy()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `moji-ui-copy-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const text = await file.text()
        const success = await uiCopyService.importCopy(text)
        if (success) {
          loadSections()
          setHasChanges(false)
          alert('UI copy imported successfully!')
        } else {
          alert('Failed to import UI copy. Please check the file format.')
        }
      }
    }
    input.click()
  }

  const currentSection = sections.find(s => s.id === selectedSection)

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">UI Copy Management</h2>
        <div className="flex gap-2">
          <button
            onClick={handleImport}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            📥 Import
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
          >
            📤 Export
          </button>
          <button
            onClick={async () => {
              if (confirm('Delete unused home.button.admin and home.button.join keys?')) {
                try {
                  // Delete from database using the service
                  const { createClient } = await import('@supabase/supabase-js')
                  const supabase = createClient(
                    import.meta.env.VITE_SUPABASE_URL,
                    import.meta.env.VITE_SUPABASE_ANON_KEY
                  )
                  
                  await supabase.from('ui_copy').delete().eq('key', 'home.button.admin')
                  await supabase.from('ui_copy').delete().eq('key', 'home.button.join')
                  
                  // Reload sections to refresh UI
                  loadSections()
                  alert('✅ Deleted unused keys!')
                } catch (error) {
                  alert('❌ Failed to delete keys: ' + error.message)
                }
              }
            }}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors"
          >
            🗑️ Clean Unused
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
          >
            🔄 Reset to Defaults
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex gap-6">
        {/* Section List */}
        <div className="w-1/3 bg-white/10 rounded-lg p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold text-white mb-3">Sections</h3>
          <div className="space-y-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => handleSectionSelect(section.id)}
                className={cn(
                  "w-full text-left p-3 rounded-lg transition-colors",
                  selectedSection === section.id
                    ? "bg-white/20 text-white"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <div className="font-semibold">{section.name}</div>
                <div className="text-sm opacity-70">{section.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Value Editor */}
        <div className="flex-1 bg-white/10 rounded-lg p-4 overflow-y-auto">
          {currentSection ? (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white">{currentSection.name}</h3>
                <p className="text-white/70 text-sm">{currentSection.description}</p>
              </div>

              <div className="space-y-4">
                {Object.entries(editingValues).map(([key, value]) => {
                  const displayKey = key.split('.').slice(1).join('.')
                  return (
                    <div key={key}>
                      <label className="block text-white/80 text-sm mb-1">
                        {displayKey || key}
                      </label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleValueChange(key, e.target.value)}
                        className="w-full p-2 rounded bg-white/20 text-white placeholder-white/50"
                      />
                    </div>
                  )
                })}
              </div>

              {hasChanges && (
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={handleSave}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    💾 Save Changes
                  </button>
                  <button
                    onClick={() => {
                      if (currentSection) {
                        setEditingValues(currentSection.values)
                        setHasChanges(false)
                      }
                    }}
                    className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-white/50 mt-8">
              Select a section to edit UI copy
            </div>
          )}
        </div>
      </div>
    </div>
  )
}