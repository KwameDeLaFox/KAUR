'use client'

import { useCallback, useState } from 'react'
import { UploadCloud, File, Loader2 } from 'lucide-react'
import { uploadFile } from '@/lib/actions'

export function UploadZone({ projectId }: { projectId: number }) {
    const [isDragActive, setIsDragActive] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragActive(true)
    }, [])

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        setIsDragActive(false)
    }, [])

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setIsUploading(true)
            const files = Array.from(e.dataTransfer.files)

            // Upload sequentially for simplicity in MVP
            for (const file of files) {
                const formData = new FormData()
                formData.append('file', file)
                try {
                    await uploadFile(projectId, formData)
                } catch (error) {
                    console.error("Upload failed", error)
                    alert(`Failed to upload ${file.name}`)
                }
            }
            setIsUploading(false)
        }
    }, [projectId])

    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setIsUploading(true)
            const files = Array.from(e.target.files)
            for (const file of files) {
                const formData = new FormData()
                formData.append('file', file)
                await uploadFile(projectId, formData)
            }
            setIsUploading(false)
        }
    }

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
        border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer
        ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
      `}
        >
            <input
                type="file"
                multiple
                className="hidden"
                id="file-upload"
                onChange={handleInputChange}
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                {isUploading ? (
                    <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
                ) : (
                    <UploadCloud className="h-10 w-10 text-muted-foreground" />
                )}
                <div className="text-xl font-medium">
                    {isUploading ? 'Uploading context...' : 'Drag files here or click to upload'}
                </div>
                <p className="text-sm text-muted-foreground">
                    Supported: PDF, DOCX, TXT, Audio, Video
                </p>
            </label>
        </div>
    )
}
