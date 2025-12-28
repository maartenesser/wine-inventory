'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Camera, Upload, X, Loader2 } from 'lucide-react'

interface ImageUploadProps {
  onImageCapture: (file: File) => void
  isLoading?: boolean
}

export function ImageUpload({ onImageCapture, isLoading }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const convertHeicToJpeg = async (file: File): Promise<File> => {
    // Check if it's a HEIC file
    const isHeic = file.type === 'image/heic' ||
                   file.type === 'image/heif' ||
                   file.name.toLowerCase().endsWith('.heic') ||
                   file.name.toLowerCase().endsWith('.heif')

    if (!isHeic) {
      return file
    }

    setIsConverting(true)
    try {
      // Dynamically import heic2any to avoid SSR issues
      const heic2any = (await import('heic2any')).default
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.9
      })

      // heic2any can return an array or single blob
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
      const convertedFile = new File(
        [blob],
        file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
        { type: 'image/jpeg' }
      )
      return convertedFile
    } catch (error) {
      console.error('Failed to convert HEIC:', error)
      // Return original file if conversion fails
      return file
    } finally {
      setIsConverting(false)
    }
  }

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.heic') && !file.name.toLowerCase().endsWith('.heif')) {
      alert('Please select an image file')
      return
    }

    // Convert HEIC to JPEG if needed
    const processedFile = await convertHeicToJpeg(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(processedFile)

    onImageCapture(processedFile)
  }, [onImageCapture])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFile(file)
    }
  }

  const clearPreview = () => {
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {preview ? (
        <Card className="relative">
          <CardContent className="p-4">
            <div className="relative">
              <img
                src={preview}
                alt="Wine bottle preview"
                className="w-full rounded-lg object-contain max-h-96"
              />
              {(isLoading || isConverting) && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>{isConverting ? 'Converting image...' : 'Analyzing wine label...'}</p>
                  </div>
                </div>
              )}
              {!isLoading && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={clearPreview}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-4">
              {/* Camera button - mobile friendly */}
              <Button
                variant="outline"
                size="lg"
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col h-auto py-4 px-6"
              >
                <Camera className="h-8 w-8 mb-2" />
                <span>Take Photo</span>
              </Button>

              {/* Upload button */}
              <Button
                variant="outline"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col h-auto py-4 px-6"
              >
                <Upload className="h-8 w-8 mb-2" />
                <span>Upload</span>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              or drag and drop a wine bottle image
            </p>

            {/* Hidden inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>
      )}
    </div>
  )
}
