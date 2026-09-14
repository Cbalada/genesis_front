'use me' // Note: standard client directive for Next.js App Router component
'use client'

import React, { useState, useEffect } from 'react'
import { PropertyImage, uploadPropertyImage, deletePropertyImage, setCoverImage } from '@/lib/api'
import { Upload, X, Star, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react'

interface Props {
  propertyId: string
  existingImages?: PropertyImage[]
  token: string
  onImagesChange: (images: PropertyImage[]) => void
}

interface SelectedFilePreview {
  id: string
  file: File
  previewUrl: string
  isCover: boolean
  status: 'idle' | 'uploading' | 'done' | 'error'
  errorMessage?: string
}

export default function PropertyImageUploader({
  propertyId,
  existingImages = [],
  token,
  onImagesChange,
}: Props) {
  const [images, setImages] = useState<PropertyImage[]>(existingImages)
  const [selectedFiles, setSelectedFiles] = useState<SelectedFilePreview[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  useEffect(() => {
    setImages(existingImages)
  }, [existingImages])

  // Revoke preview URLs on unmount
  useEffect(() => {
    return () => {
      selectedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl))
    }
  }, [selectedFiles])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalError(null)
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const validTypes = ['image/jpeg', 'image/png', 'image/webp']
    const maxSize = 10 * 1024 * 1024 // 10MB
    const maxAllowedTotal = 20
    const currentTotal = images.length + selectedFiles.length

    if (currentTotal + files.length > maxAllowedTotal) {
      setGlobalError(`Una propiedad no puede tener más de ${maxAllowedTotal} imágenes.`)
      return
    }

    const newPreviews: SelectedFilePreview[] = []
    let hasFirstCoverCandidate = images.length === 0 && selectedFiles.length === 0

    for (const file of files) {
      if (!validTypes.includes(file.type)) {
        setGlobalError(`Tipo de archivo no permitido: ${file.name}. Solo JPG, PNG y WebP.`)
        continue
      }
      if (file.size > maxSize) {
        setGlobalError(`El archivo "${file.name}" supera el tamaño máximo permitido de 10 MB.`)
        continue
      }

      newPreviews.push({
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        isCover: hasFirstCoverCandidate,
        status: 'idle',
      })
      hasFirstCoverCandidate = false
    }

    setSelectedFiles((prev) => [...prev, ...newPreviews])
    e.target.value = ''
  }

  const removeSelectedPreview = (id: string) => {
    setSelectedFiles((prev) => {
      const target = prev.find((item) => item.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((item) => item.id !== id)
    })
  }

  const handleUploadAll = async () => {
    if (!selectedFiles.length || isUploading) return
    setIsUploading(true)
    setGlobalError(null)

    let updatedImagesList = [...images]
    const remainingFiles = [...selectedFiles]

    for (let i = 0; i < remainingFiles.length; i++) {
      const item = remainingFiles[i]
      if (item.status === 'done') continue

      // Mark file uploading status
      setSelectedFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'uploading', errorMessage: undefined } : f))
      )

      try {
        const uploaded = await uploadPropertyImage(propertyId, item.file, item.isCover, token)
        updatedImagesList = [...updatedImagesList, uploaded]
        setImages(updatedImagesList)
        onImagesChange(updatedImagesList)

        // Mark done
        setSelectedFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: 'done' } : f))
        )
      } catch (err: any) {
        const msg = err?.message || 'Error al subir la imagen.'
        setSelectedFiles((prev) =>
          prev.map((f) => (f.id === item.id ? { ...f, status: 'error', errorMessage: msg } : f))
        )
        setGlobalError(`Ocurrió un error al subir "${item.file.name}".`)
      }
    }

    setIsUploading(false)
    // Clean up successfully uploaded previews
    setSelectedFiles((prev) => prev.filter((item) => item.status !== 'done'))
  }

  const handleDeleteImage = async (imageId?: string) => {
    if (!imageId) return
    setActionLoadingId(imageId)
    setGlobalError(null)
    try {
      await deletePropertyImage(propertyId, imageId, token)
      const filtered = images.filter((img) => img.id !== imageId)
      setImages(filtered)
      onImagesChange(filtered)
    } catch (err: any) {
      setGlobalError(err?.message || 'No se pudo eliminar la imagen.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleSetCover = async (imageId?: string) => {
    if (!imageId) return
    setActionLoadingId(imageId)
    setGlobalError(null)
    try {
      await setCoverImage(propertyId, imageId, token)
      const updated = images.map((img) => ({
        ...img,
        isCover: img.id === imageId,
      }))
      setImages(updated)
      onImagesChange(updated)
    } catch (err: any) {
      setGlobalError(err?.message || 'No se pudo definir la imagen de portada.')
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Global Error Banner */}
      {globalError && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 rounded-lg border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {/* Upload Drop Zone */}
      <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-indigo-500 transition-colors bg-slate-50/50 text-center">
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          id="property-images-input"
        />
        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
          <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Hacé clic o arrastrá imágenes para subir
            </p>
            <p className="text-xs text-slate-500 mt-1">
              JPG, PNG o WebP. Máximo 10 MB por archivo. Hasta 20 imágenes por propiedad.
            </p>
          </div>
        </div>
      </div>

      {/* Selected Previews (Pending Upload) */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3 p-4 bg-amber-50/50 rounded-xl border border-amber-200">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-amber-600" />
              Imágenes seleccionadas para subir ({selectedFiles.length})
            </h4>
            <button
              onClick={handleUploadAll}
              disabled={isUploading}
              className="px-4 py-2 bg-indigo-600 text-white font-medium text-xs rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Subir {selectedFiles.length} imagen{selectedFiles.length > 1 ? 'es' : ''}
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {selectedFiles.map((item) => (
              <div
                key={item.id}
                className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white shadow-xs"
              >
                <img
                  src={item.previewUrl}
                  alt="Preview"
                  className="w-full h-28 object-cover"
                />

                {item.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                )}

                {item.status === 'error' && (
                  <div className="absolute inset-0 bg-red-900/70 p-2 flex flex-col items-center justify-center text-white text-center text-xs">
                    <AlertCircle className="w-5 h-5 mb-1" />
                    <span>Error al subir</span>
                  </div>
                )}

                {item.status === 'idle' && (
                  <button
                    type="button"
                    onClick={() => removeSelectedPreview(item.id)}
                    className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full hover:bg-red-600 transition-colors"
                    title="Quitar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {item.isCover && (
                  <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-amber-500 text-white font-bold text-[10px] rounded uppercase shadow-xs">
                    Portada (propuesta)
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Images Gallery */}
      <div>
        <h4 className="text-sm font-semibold text-slate-800 mb-3">
          Galería actual ({images.length} / 20)
        </h4>

        {images.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
            <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500">
              No hay imágenes subidas en esta propiedad aún.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((img) => {
              const isLoadingThis = actionLoadingId === img.id
              return (
                <div
                  key={img.id || img.imageUrl}
                  className={`relative group rounded-xl overflow-hidden border-2 transition-all shadow-xs ${
                    img.isCover ? 'border-amber-500 ring-2 ring-amber-400/30' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <img
                    src={img.imageUrl}
                    alt="Property image"
                    className="w-full h-32 object-cover"
                  />

                  {isLoadingThis && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center text-white">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  )}

                  {/* Badges */}
                  {img.isCover && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500 text-white font-bold text-[10px] rounded uppercase shadow-xs flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      Portada
                    </span>
                  )}

                  {/* Actions overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                    <button
                      type="button"
                      onClick={() => handleSetCover(img.id)}
                      disabled={img.isCover || isLoadingThis}
                      className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                        img.isCover
                          ? 'bg-amber-500 text-white cursor-default'
                          : 'bg-white/90 hover:bg-amber-500 hover:text-white text-slate-800'
                      }`}
                      title={img.isCover ? 'Es la portada actual' : 'Establecer como portada'}
                    >
                      <Star className={`w-3.5 h-3.5 ${img.isCover ? 'fill-current' : ''}`} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      disabled={isLoadingThis}
                      className="p-1.5 bg-white/90 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
                      title="Eliminar imagen"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
