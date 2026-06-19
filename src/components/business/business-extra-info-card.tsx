'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { updateBusinessExtraInfo } from "@/app/(dashboard)/business/[id]/actions"
import { upsertCompetitorAction, deleteCompetitorAction } from "@/app/(dashboard)/business/[id]/competitor-actions"
import { toast } from "sonner"
import { Facebook, Instagram, Globe, Phone, Save, Loader2, Users, Plus, Trash2, MapPin, Pencil, X, Linkedin, Youtube, Search } from "lucide-react"
import { SocialLinks } from '@/modules/business/types'

interface Competitor {
  id: string
  name: string | null
  website: string | null
  facebook: string | null
  instagram: string | null
  tiktok: string | null
  linkedin: string | null
  youtube: string | null
  seoGoogle: string | null
}

interface BusinessExtraInfoCardProps {
  businessId: string
  initialPhoneNumbers?: string | null
  initialLocation?: string | null
  initialSocialLinks?: SocialLinks | null
  initialCompetitors: Competitor[]
  maxCompetitors: number
}

export function BusinessExtraInfoCard({ 
  businessId, 
  initialPhoneNumbers, 
  initialLocation,
  initialSocialLinks,
  initialCompetitors,
  maxCompetitors
}: BusinessExtraInfoCardProps) {
  const [loading, setLoading] = useState(false)
  
  // States for My Business
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [phoneNumbers, setPhoneNumbers] = useState(initialPhoneNumbers || '')
  const [location, setLocation] = useState(initialLocation || '')
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(initialSocialLinks || {})
  
  // States for Competitors
  const [editingCompIndex, setEditingCompIndex] = useState<number | null>(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<number, string[]>>(() => {
    const initial: Record<number, string[]> = {}
    const keys = ['website', 'facebook', 'instagram', 'tiktok', 'linkedin', 'youtube', 'seoGoogle']
    initialCompetitors.forEach((comp, idx) => {
      const active = keys.filter(k => !!(comp as any)[k])
      initial[idx] = active.length > 0 ? active : ['website']
    })
    return initial
  })
  const [competitors, setCompetitors] = useState<Partial<Competitor>[]>(initialCompetitors)

  const handleSaveContact = async () => {
    setLoading(true)
    try {
      const result = await updateBusinessExtraInfo(businessId, {
        phoneNumbers,
        location,
        socialLinks
      })
      if (result.success) {
        toast.success('Contacto actualizado')
        setIsEditingContact(false)
      } else toast.error(result.error)
    } catch (error) {
      toast.error('Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCompetitor = async (index: number) => {
    const comp = competitors[index]
    if (!comp.name) return toast.error('El nombre del competidor es requerido')

    setLoading(true)
    try {
      const result = await upsertCompetitorAction(businessId, comp.id || undefined, {
        name: comp.name,
        website: comp.website || undefined,
        facebook: comp.facebook || undefined,
        instagram: comp.instagram || undefined,
        tiktok: comp.tiktok || undefined,
        linkedin: comp.linkedin || undefined,
        youtube: comp.youtube || undefined,
        seoGoogle: comp.seoGoogle || undefined
      })
      if (result.success) {
        toast.success('Competidor guardado')
        setEditingCompIndex(null)
      } else toast.error(result.error)
    } catch (error) {
      toast.error('Error al guardar competidor')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCompetitor = async (index: number) => {
    const comp = competitors[index]
    if (!comp.id) {
        setCompetitors(prev => prev.filter((_, i) => i !== index))
        setEditingCompIndex(null)
        return
    }

    setLoading(true)
    try {
      const result = await deleteCompetitorAction(businessId, comp.id)
      if (result.success) {
        toast.success('Competidor eliminado')
        setCompetitors(prev => prev.filter((_, i) => i !== index))
        setEditingCompIndex(null)
      } else toast.error(result.error)
    } finally {
      setLoading(false)
    }
  }

  const addCompetitor = () => {
    if (competitors.length >= maxCompetitors) {
        toast.error(`Has alcanzado el límite de ${maxCompetitors} competidores`)
        return
    }
    const newIdx = competitors.length
    setCompetitors(prev => [...prev, { id: '', name: '', website: '', facebook: '', instagram: '', tiktok: '', linkedin: '', youtube: '', seoGoogle: '' }])
    setSelectedPlatforms(prev => ({ ...prev, [newIdx]: ['website'] }))
    setEditingCompIndex(newIdx)
  }

  const updateCompField = (index: number, field: keyof Competitor, value: string) => {
    setCompetitors(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }

  const togglePlatform = (index: number, platform: string) => {
    setSelectedPlatforms(prev => {
      const current = prev[index] || ['website']
      if (current.includes(platform)) {
        if (current.length > 1) {
          return { ...prev, [index]: current.filter(p => p !== platform) }
        }
        return prev
      } else {
        return { ...prev, [index]: [...current, platform] }
      }
    })
  }

  const platforms = [
    { key: 'website', label: 'Sitio Web', icon: Globe },
    { key: 'facebook', label: 'Facebook', icon: Facebook },
    { key: 'instagram', label: 'Instagram', icon: Instagram },
    { key: 'tiktok', label: 'TikTok', icon: TikTokIcon },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
    { key: 'youtube', label: 'YouTube', icon: Youtube },
    { key: 'seoGoogle', label: 'SEO Google', icon: Search },
  ]

  return (
    <Card className="card-shadow overflow-hidden border-none">
      <CardHeader className="bg-muted/30 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Información Estratégica
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-8">
        {/* SECCIÓN CONTACTO PROPIO */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black flex items-center gap-2 text-primary uppercase tracking-wider">
              <Phone className="h-4 w-4" /> Tu Negocio
            </h3>
            <div className="flex items-center gap-2">
                <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setIsEditingContact(!isEditingContact)}
                    className="h-8 w-8 p-0"
                >
                    {isEditingContact ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                </Button>
                {isEditingContact && (
                    <Button size="sm" onClick={handleSaveContact} disabled={loading} className="h-7 px-3 text-[10px] bg-primary font-bold">
                        <Save className="h-3 w-3 mr-1" /> Guardar
                    </Button>
                )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Teléfonos</Label>
                <Input 
                    placeholder="Ej: +51 987 654 321" 
                    value={phoneNumbers}
                    onChange={(e) => setPhoneNumbers(e.target.value)}
                    disabled={!isEditingContact}
                    className={`h-9 text-xs ${!isEditingContact ? 'bg-transparent border-transparent px-0' : 'bg-muted/20'}`}
                />
            </div>
            <div className="grid gap-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Ubicación
                </Label>
                <Input 
                    placeholder="Ej: Lima, Perú" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={!isEditingContact}
                    className={`h-9 text-xs ${!isEditingContact ? 'bg-transparent border-transparent px-0' : 'bg-muted/20'}`}
                />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {['facebook', 'instagram', 'tiktok'].map((net) => (
               <div key={net} className="grid gap-1.5">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                     {net === 'facebook' && <Facebook className="h-2.5 w-2.5" />}
                     {net === 'instagram' && <Instagram className="h-2.5 w-2.5" />}
                     {net === 'tiktok' && <TikTokIcon className="h-2.5 w-2.5" />}
                     {net}
                  </Label>
                  <Input 
                    placeholder="Sin configurar" 
                    value={(socialLinks as any)[net] || ''}
                    onChange={(e) => setSocialLinks(prev => ({ ...prev, [net]: e.target.value }))}
                    disabled={!isEditingContact}
                    className={`h-8 text-[11px] ${!isEditingContact ? 'bg-transparent border-transparent px-0 truncate' : 'bg-muted/20 px-2'}`}
                  />
               </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-border/50" />

        {/* SECCIÓN COMPETENCIA */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black flex items-center gap-2 text-orange-600 uppercase tracking-wider">
              <Users className="h-4 w-4" /> Competencia ({competitors.length}/{maxCompetitors})
            </h3>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={addCompetitor} 
              disabled={competitors.length >= maxCompetitors}
              className={`h-7 px-3 text-[10px] border-orange-200 text-orange-600 hover:bg-orange-50 font-bold ${
                competitors.length >= maxCompetitors ? 'opacity-50 grayscale' : ''
              }`}
            >
              <Plus className="h-3 w-3 mr-1" /> Nuevo Competidor
            </Button>
          </div>

          <div className="space-y-4">
            {competitors.map((comp, idx) => {
              const isEditing = editingCompIndex === idx
              return (
                <div key={idx} className={`p-4 rounded-xl border transition-all ${isEditing ? 'bg-orange-50/50 border-orange-200 shadow-sm' : 'bg-muted/10 border-transparent hover:border-muted-foreground/20'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                            <Users className="h-4 w-4 text-orange-600" />
                        </div>
                        <span className="text-sm font-bold truncate max-w-[150px]">
                            {comp.name || 'Sin nombre'}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => setEditingCompIndex(isEditing ? null : idx)}
                        >
                            {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                        </Button>
                        {isEditing && (
                            <>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteCompetitor(idx)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                    size="sm" 
                                    onClick={() => handleSaveCompetitor(idx)} 
                                    disabled={loading} 
                                    className="h-7 px-3 text-[10px] bg-orange-600 hover:bg-orange-700 font-bold ml-1"
                                >
                                    <Save className="h-3 w-3 mr-1" /> Guardar
                                </Button>
                            </>
                        )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">Nombre</Label>
                      <Input 
                        placeholder="Nombre..." 
                        value={comp.name || ''}
                        onChange={(e) => updateCompField(idx, 'name', e.target.value)}
                        disabled={!isEditing}
                        className={`h-8 text-xs ${!isEditing ? 'bg-transparent border-transparent px-0' : 'bg-background'}`}
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <>
                      <div className="mt-4">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground mb-2 block">Seleccionar plataformas a escrapear</Label>
                        <div className="flex flex-wrap gap-2">
                          {platforms.map((platform) => {
                            const PlatformIcon = platform.icon
                            const isSelected = (selectedPlatforms[idx] || ['website']).includes(platform.key)
                            return (
                              <button
                                key={platform.key}
                                type="button"
                                onClick={() => togglePlatform(idx, platform.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-medium transition-all ${
                                  isSelected 
                                    ? 'bg-orange-50 border-orange-300 text-orange-700' 
                                    : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'
                                }`}
                              >
                                <PlatformIcon className="h-3 w-3" />
                                {platform.label}
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        {(selectedPlatforms[idx] || ['website']).map((platformKey) => {
                          const platform = platforms.find(p => p.key === platformKey)
                          if (!platform) return null
                          const PlatformIcon = platform.icon
                          return (
                            <div key={platform.key} className="grid gap-1.5">
                              <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                <PlatformIcon className="h-2.5 w-2.5" />
                                {platform.label}
                              </Label>
                              <Input 
                                placeholder="https://..." 
                                value={(comp as any)[platform.key] || ''}
                                onChange={(e) => updateCompField(idx, platform.key as keyof Competitor, e.target.value)}
                                className="h-8 text-xs bg-background"
                              />
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )}

                  {!isEditing && (
                    <div className="mt-3 space-y-2">
                      {platforms.map((platform) => {
                        const PlatformIcon = platform.icon
                        const url = (comp as any)[platform.key]
                        if (!url) return null
                        return (
                          <div key={platform.key} className="flex items-center gap-2 text-xs">
                            <PlatformIcon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">{platform.label}:</span>
                            <a 
                              href={url} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-blue-500 hover:underline truncate"
                            >
                              {url}
                            </a>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  )
}
