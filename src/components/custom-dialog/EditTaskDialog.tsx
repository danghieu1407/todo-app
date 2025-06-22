"use client"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Upload, ImageIcon, X, Loader2, CheckCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface EditTaskDialogProps {
  task: {
    id: string | number
    title: string
    date: string
    priority: 'extreme' | 'moderate' | 'low'
    description: string
    status: string
    image_url?: string | null
    [key: string]: any
  }
  onTaskUpdated?: () => void
  trigger?: React.ReactNode
}

export function EditTaskDialog({ task, onTaskUpdated, trigger }: EditTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Form state
  const [formData, setFormData] = useState({
    title: task.title || "",
    date: task.date || "",
    priority: (task.priority as 'extreme' | 'moderate' | 'low') || 'moderate',
    description: task.description || "",
    status: task.status || "pending"
  })

  // Image state
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(task.image_url || null)
  const [dragActive, setDragActive] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [removeImageFlag, setRemoveImageFlag] = useState(false)

  // Form validation
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  useEffect(() => {
    if (open) {
      setFormData({
        title: task.title || "",
        date: task.date || "",
        priority: (task.priority as 'extreme' | 'moderate' | 'low') || 'moderate',
        description: task.description || "",
        status: task.status || "pending"
      })
      setImagePreview(task.image_url || null)
      setSelectedImage(null)
      setRemoveImageFlag(false)
      setImageError(null)
      setErrors({})
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }, [open, task])

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    if (!formData.title.trim()) {
      newErrors.title = "Task title is required"
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Task title must be at least 3 characters"
    }
    if (!formData.date) {
      newErrors.date = "Date is required"
    } else {
      const selectedDate = new Date(formData.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        newErrors.date = "Date cannot be in the past"
      }
    }
    if (selectedImage) {
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (selectedImage.size > maxSize) {
        newErrors.image = "Image size must be less than 5MB"
      }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const validateImageFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return "Please select a valid image file"
    }
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return "Image size must be less than 5MB"
    }
    return null
  }

  const handleImageSelect = (file: File) => {
    const error = validateImageFile(file)
    if (error) {
      setImageError(error)
      return
    }
    setImageError(null)
    setSelectedImage(file)
    setRemoveImageFlag(false)
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageSelect(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleImageSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault() }
  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); setDragActive(true) }
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false) }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setImageError(null)
    setRemoveImageFlag(true)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const uploadImageToSupabase = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true)
      setUploadProgress(0)
      const fileExt = file.name.split('.').pop()?.toLowerCase()
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const fileName = `task-${timestamp}-${randomString}.${fileExt}`
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) { clearInterval(progressInterval); return prev }
          return prev + 10
        })
      }, 100)
      const { data, error } = await supabase.storage
        .from('task-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })
      clearInterval(progressInterval)
      setUploadProgress(100)
      if (error) {
        console.error('Error uploading image:', error)
        throw new Error(`Upload failed: ${error.message}`)
      }
      const { data: { publicUrl } } = supabase.storage
        .from('task-images')
        .getPublicUrl(fileName)
      if (!publicUrl) {
        throw new Error('Failed to get public URL')
      }
      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      setImageError(error instanceof Error ? error.message : 'Failed to upload image')
      return null
    } finally {
      setUploadingImage(false)
      setUploadProgress(0)
    }
  }

  const updateTask = async () => {
    if (!validateForm()) return
    try {
      setLoading(true)
      let imageUrl = imagePreview
      if (selectedImage) {
        imageUrl = await uploadImageToSupabase(selectedImage)
        if (!imageUrl) return
      }
      if (removeImageFlag) imageUrl = null
      const updatedTask = {
        title: formData.title.trim(),
        date: formData.date,
        priority: formData.priority,
        description: formData.description.trim() || null,
        image_url: imageUrl,
        status: formData.status,
        updated_at: new Date().toISOString()
      }
      const { data, error } = await supabase
        .from('tasks')
        .update(updatedTask)
        .eq('id', task.id)
        .select()
      if (error) {
        console.error('Error updating task:', error)
        throw new Error(`Failed to update task: ${error.message}`)
      }
      if (!data || data.length === 0) {
        throw new Error('No data returned from task update')
      }
      setOpen(false)
      showSuccessMessage()
      if (onTaskUpdated) onTaskUpdated()
    } catch (error) {
      console.error('Error updating task:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const showSuccessMessage = () => {
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center'
    notification.innerHTML = `
      <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
      </svg>
      Task updated successfully!
    `
    document.body.appendChild(notification)
    setTimeout(() => { document.body.removeChild(notification) }, 3000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="text-blue-500 hover:text-blue-700 bg-transparent px-2 py-1 text-xs font-medium">
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <DialogTitle className="text-2xl font-semibold">Edit Task</DialogTitle>
          <Button 
            variant="ghost" 
            onClick={() => setOpen(false)} 
            className="text-sm underline hover:no-underline"
            disabled={loading}
          >
            Cancel
          </Button>
        </DialogHeader>
        <div className="space-y-6">
          {/* Title Field */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-medium">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="title" 
              className={`h-12 text-base ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Enter task title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              disabled={loading}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>
          {/* Date Field */}
          <div className="space-y-2">
            <Label htmlFor="date" className="text-base font-medium">
              Date <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input 
                id="date" 
                type="date" 
                className={`h-12 text-base pr-10 ${errors.date ? 'border-red-500' : ''}`}
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                disabled={loading}
                min={new Date().toISOString().split('T')[0]}
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
          </div>
          {/* Priority Field */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Priority</Label>
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="extreme-edit"
                  name="priority-edit"
                  value="extreme"
                  checked={formData.priority === "extreme"}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-4 h-4 text-red-500 border-gray-300 focus:ring-red-500"
                  disabled={loading}
                />
                <Label htmlFor="extreme-edit" className="text-red-500 font-medium">
                  🔥 Extreme
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="moderate-edit"
                  name="priority-edit"
                  value="moderate"
                  checked={formData.priority === "moderate"}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-4 h-4 text-blue-500 border-gray-300 focus:ring-blue-500"
                  disabled={loading}
                />
                <Label htmlFor="moderate-edit" className="text-blue-500 font-medium">
                  ⚡ Moderate
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="low-edit"
                  name="priority-edit"
                  value="low"
                  checked={formData.priority === "low"}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-4 h-4 text-green-500 border-gray-300 focus:ring-green-500"
                  disabled={loading}
                />
                <Label htmlFor="low-edit" className="text-green-500 font-medium">
                  🌱 Low
                </Label>
              </div>
            </div>
          </div>
          {/* Task Description and Upload Image */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Task Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-medium">
                Task Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your task in detail..."
                className="min-h-[200px] text-base resize-none"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={loading}
              />
              <p className="text-xs text-gray-500">
                {formData.description.length}/1000 characters
              </p>
            </div>
            {/* Upload Image */}
            <div className="space-y-2">
              <Label className="text-base font-medium">
                Upload Image
                <span className="text-sm text-gray-500 ml-2">(Max 5MB)</span>
              </Label>
              {imagePreview ? (
                <div className="relative border-2 border-gray-300 rounded-lg min-h-[200px] flex items-center justify-center overflow-hidden">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-w-full max-h-[200px] object-contain rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 shadow-lg"
                    onClick={removeImage}
                    disabled={loading || uploadingImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-white text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                        <p>Uploading... {uploadProgress}%</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center min-h-[200px] flex flex-col items-center justify-center space-y-4 transition-all cursor-pointer
                    ${dragActive 
                      ? 'border-orange-500 bg-orange-50' 
                      : 'border-gray-300 hover:border-gray-400'
                    }
                    ${errors.image ? 'border-red-500' : ''}
                  `}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    {uploadingImage ? (
                      <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                        <Upload className="w-4 h-4 text-gray-400 ml-1 -mt-2" />
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-600 font-medium">
                      {dragActive ? 'Drop your image here' : 'Drag & Drop your image here'}
                    </p>
                    <p className="text-gray-400 text-sm">or</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={loading || uploadingImage}
                      type="button"
                      className="hover:bg-orange-50 hover:border-orange-300"
                    >
                      Browse Files
                    </Button>
                    <p className="text-xs text-gray-500">
                      Supports: JPG, PNG, GIF, WebP (Max 5MB)
                    </p>
                  </div>
                </div>
              )}
              {(imageError || errors.image) && (
                <p className="text-sm text-red-500">{imageError || errors.image}</p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={loading || uploadingImage}
              />
            </div>
          </div>
          {/* Update Button */}
          <div className="pt-4 flex gap-3">
            <Button
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-2 h-12 text-base font-medium flex-1 sm:flex-none"
              onClick={updateTask}
              disabled={loading || uploadingImage}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating Task...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Update Task
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading || uploadingImage}
              className="px-8 py-2 h-12 text-base"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
