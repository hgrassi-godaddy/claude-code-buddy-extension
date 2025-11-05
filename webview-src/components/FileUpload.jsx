import { useState, useRef } from 'react'

const FileUpload = ({ onFileUpload, isDarkMode }) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const fileInputRef = useRef(null)

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    handleFiles(files)
  }

  const handleFiles = (files) => {
    const validFiles = files.filter(file => {
      // Filter for code files
      const validExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.html', '.css', '.json', '.md', '.txt']
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
      return validExtensions.includes(extension) && file.size < 5 * 1024 * 1024 // 5MB limit
    })

    validFiles.forEach(file => {
      const fileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: new Date(file.lastModified)
      }

      setUploadedFiles(prev => [...prev, fileInfo])
      onFileUpload(fileInfo)

      // Read file content (for demo purposes)
      const reader = new FileReader()
      reader.onload = (e) => {
        console.log(`File content for ${file.name}:`, e.target.result)
      }
      reader.readAsText(file)
    })
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getFileIcon = (filename) => {
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'))
    const icons = {
      '.js': '🟨',
      '.jsx': '⚛️',
      '.ts': '🔵',
      '.tsx': '⚛️',
      '.py': '🐍',
      '.java': '☕',
      '.cpp': '⚙️',
      '.c': '⚙️',
      '.html': '🌐',
      '.css': '🎨',
      '.json': '📄',
      '.md': '📝',
      '.txt': '📄'
    }
    return icons[extension] || '📄'
  }

  return (
    <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
      <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Upload Code Files</h3>

      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragOver
            ? (isDarkMode ? 'border-blue-400 bg-blue-400/10' : 'border-blue-600 bg-blue-600/10')
            : (isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400')
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-2xl mb-2">📁</div>
        <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Drag & drop code files here
        </p>
        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          or click to browse
        </p>
        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Supports: JS, TS, Python, Java, C/C++, HTML, CSS, JSON, MD
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.html,.css,.json,.md,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Uploaded Files</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded text-xs ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
              >
                <div className="flex items-center space-x-2">
                  <span>{getFileIcon(file.name)}</span>
                  <span className={`truncate max-w-24 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{file.name}</span>
                </div>
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>{formatFileSize(file.size)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Code Paste */}
      <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
        <h4 className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Quick Paste</h4>
        <textarea
          placeholder="Paste code snippet here..."
          className={`w-full h-20 text-xs rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            isDarkMode
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          } border`}
          onChange={(e) => {
            if (e.target.value.trim()) {
              const codeSnippet = {
                name: 'code-snippet.txt',
                size: e.target.value.length,
                type: 'text/plain',
                content: e.target.value
              }
              onFileUpload(codeSnippet)
              e.target.value = ''
            }
          }}
        />
      </div>
    </div>
  )
}

export default FileUpload