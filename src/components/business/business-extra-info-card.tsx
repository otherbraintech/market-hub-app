'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { updateBusinessExtraInfo } from "@/app/(dashboard)/business/[id]/actions"
import { upsertCompetitorAction, deleteCompetitorAction } from "@/app/(dashboard)/business/[id]/competitor-actions"
import { toast } from "sonner"
import { Facebook, Instagram, Globe, Phone, Save, Loader2, Users, Plus, Trash2, MapPin, Pencil, X, Linkedin, Youtube, Search, AlertTriangle, Check } from "lucide-react"
import { SocialLinks } from '@/modules/business/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  role?: string
}

export function BusinessExtraInfoCard({
  businessId,
  initialPhoneNumbers,
  initialLocation,
  initialSocialLinks,
  initialCompetitors,
  maxCompetitors,
  role
}: BusinessExtraInfoCardProps) {
  const [loading, setLoading] = useState(false)

  // States for My Business
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [phoneNumbers, setPhoneNumbers] = useState(initialPhoneNumbers || '')
  const [location, setLocation] = useState(initialLocation || '')
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(() => {
    if (!initialSocialLinks) return {};
    if (typeof initialSocialLinks === "string") {
      try {
        return JSON.parse(initialSocialLinks);
      } catch (e) {
        return {};
      }
    }
    return initialSocialLinks;
  })

  // States for Competitors
  const [showNameAlert, setShowNameAlert] = useState(false)
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

  // Dialog Nuevo Competidor
  const [isNewCompOpen, setIsNewCompOpen] = useState(false)
  const [newCompData, setNewCompData] = useState<Partial<Competitor>>({
    name: '', website: '', facebook: '', instagram: '', tiktok: '', linkedin: '', youtube: '', seoGoogle: ''
  })
  const [newCompPlatforms, setNewCompPlatforms] = useState<string[]>([])

  // Auto-abrir diálogo de competidor si el negocio tiene 0 competidores
  useEffect(() => {
    if (role === "USER") return;
    if (initialCompetitors.length === 0) {
      const timer = setTimeout(() => {
        setIsNewCompOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [initialCompetitors, role]);

  // Mapa de estados de scraping en tiempo real
  const [scrapingStatusMap, setScrapingStatusMap] = useState<Record<string, Record<string, { status: string; error?: string | null }>>>({})

  // Polling dinámico de estados de scraping de competidores cada 5 segundos
  useEffect(() => {
    if (competitors.length === 0) return

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/business/${businessId}/competitor-scraping-status`)
        if (res.ok) {
          const data = await res.json()
          if (data.statusMap) {
            setScrapingStatusMap(data.statusMap)
          }
        }
      } catch (e) {
        console.error("Error fetching scraping status:", e)
      }
    }

    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [businessId, competitors])

  const getScrapingIndicator = (competitorId?: string, platformKey?: string) => {
    if (!competitorId || !platformKey) return null;

    let channelName = platformKey.toUpperCase();
    if (platformKey === 'seoGoogle') {
      channelName = 'SEO_GOOGLE';
    }

    const compStatus = scrapingStatusMap[competitorId]?.[channelName];
    if (!compStatus) return null;

    switch (compStatus.status) {
      case 'PENDING':
      case 'PROCESSING':
        return (
          <span className="flex items-center gap-1 text-[9px] text-blue-600 font-bold bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded animate-pulse">
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
            <span>Analizando...</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="flex items-center gap-1 text-[9px] text-green-600 font-bold bg-green-50 dark:bg-green-950/40 px-1.5 py-0.5 rounded">
            <Check className="h-2.5 w-2.5 text-green-600" />
            <span>Listo</span>
          </span>
        );
      case 'ERROR':
        return (
          <span
            className="flex items-center gap-1 text-[9px] text-red-650 font-bold bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded cursor-help"
            title={compStatus.error || 'Error en scraping'}
          >
            <AlertTriangle className="h-2.5 w-2.5 text-red-600" />
            <span>Fallo</span>
          </span>
        );
      default:
        return null;
    }
  };

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
    if (!comp.name || !comp.name.trim()) {
      setShowNameAlert(true)
      return
    }

    setLoading(true)
    try {
      const activePlatforms = selectedPlatforms[index] || ['website']
      const result = await upsertCompetitorAction(businessId, comp.id || undefined, {
        name: comp.name,
        website: activePlatforms.includes('website') && comp.website?.trim() ? comp.website.trim() : null,
        facebook: activePlatforms.includes('facebook') && comp.facebook?.trim() ? comp.facebook.trim() : null,
        instagram: activePlatforms.includes('instagram') && comp.instagram?.trim() ? comp.instagram.trim() : null,
        tiktok: activePlatforms.includes('tiktok') && comp.tiktok?.trim() ? comp.tiktok.trim() : null,
        linkedin: activePlatforms.includes('linkedin') && comp.linkedin?.trim() ? comp.linkedin.trim() : null,
        youtube: activePlatforms.includes('youtube') && comp.youtube?.trim() ? comp.youtube.trim() : null,
        seoGoogle: activePlatforms.includes('seoGoogle') && comp.seoGoogle?.trim() ? comp.seoGoogle.trim() : null
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
    setNewCompData({ name: '', website: '', facebook: '', instagram: '', tiktok: '', linkedin: '', youtube: '', seoGoogle: '' })
    setNewCompPlatforms([])
    setIsNewCompOpen(true)
  }

  const handleCreateCompetitor = async () => {
    if (!newCompData.name || !newCompData.name.trim()) {
      toast.error('Por favor, ingresa el nombre del competidor')
      return
    }

    setLoading(true)
    try {
      const result = await upsertCompetitorAction(businessId, undefined, {
        name: newCompData.name,
        website: newCompPlatforms.includes('website') && newCompData.website?.trim() ? newCompData.website.trim() : null,
        facebook: newCompPlatforms.includes('facebook') && newCompData.facebook?.trim() ? newCompData.facebook.trim() : null,
        instagram: newCompPlatforms.includes('instagram') && newCompData.instagram?.trim() ? newCompData.instagram.trim() : null,
        tiktok: newCompPlatforms.includes('tiktok') && newCompData.tiktok?.trim() ? newCompData.tiktok.trim() : null,
        linkedin: newCompPlatforms.includes('linkedin') && newCompData.linkedin?.trim() ? newCompData.linkedin.trim() : null,
        youtube: newCompPlatforms.includes('youtube') && newCompData.youtube?.trim() ? newCompData.youtube.trim() : null,
        seoGoogle: newCompPlatforms.includes('seoGoogle') && newCompData.seoGoogle?.trim() ? newCompData.seoGoogle.trim() : null
      })

      if (result.success && result.competitor) {
        toast.success('Competidor añadido exitosamente')
        setCompetitors(prev => [...prev, result.competitor])
        // Añadir plataformas seleccionadas para la edición posterior si es necesario
        const newIdx = competitors.length
        setSelectedPlatforms(prev => ({ ...prev, [newIdx]: newCompPlatforms }))
        setIsNewCompOpen(false)
      } else {
        toast.error(result.error || 'Error al guardar competidor')
      }
    } catch (e) {
      toast.error('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
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

  const toggleNewPlatform = (platform: string) => {
    setNewCompPlatforms(current => {
      if (current.includes(platform)) {
        if (current.length > 1) {
          return current.filter(p => p !== platform)
        }
        return current
      } else {
        return [...current, platform]
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
    <>
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

          {/* SECCIÓN COMPETENCIA / CANALES DE COMPETIDORES */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black flex items-center gap-2 text-orange-650 uppercase tracking-wider">
                <Users className="h-4 w-4" /> Canales de Competidores ({competitors.length}/{maxCompetitors})
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={addCompetitor}
                disabled={competitors.length >= maxCompetitors}
                className={`h-7 px-3 text-[10px] border-orange-200 text-orange-600 hover:bg-orange-50 font-bold ${competitors.length >= maxCompetitors ? 'opacity-50 grayscale' : ''
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
                              className="h-7 px-3 text-[10px] bg-orange-650 hover:bg-orange-700 font-bold ml-1"
                            >
                              <Save className="h-3 w-3 mr-1" /> Guardar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-1.5">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground">Nombre del Competidor</Label>
                        <Input
                          placeholder="Nombre..."
                          value={comp.name || ''}
                          onChange={(e) => updateCompField(idx, 'name', e.target.value)}
                          disabled={!isEditing}
                          className={`h-8 text-xs ${!isEditing ? 'bg-transparent border-transparent px-0 font-bold' : 'bg-background'}`}
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="mt-4 space-y-3">
                        <Label className="text-[10px] font-bold uppercase text-muted-foreground mb-1 block">Enlaces del Competidor</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {platforms.map((platform) => {
                            const PlatformIcon = platform.icon
                            return (
                              <div key={platform.key} className="grid gap-1">
                                <Label className="text-[9px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                  <PlatformIcon className="h-3 w-3 text-muted-foreground/80" />
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
                      </div>
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
                                className="text-blue-500 hover:underline truncate max-w-[200px]"
                              >
                                {url}
                              </a>
                              {getScrapingIndicator(comp.id, platform.key)}
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

      <Dialog open={isNewCompOpen} onOpenChange={setIsNewCompOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <Plus className="h-5 w-5" />
              <span>Nuevo Competidor</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Registra un nuevo competidor para rastrear y analizar su presencia digital.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-1.5">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Nombre del Competidor</Label>
              <Input
                placeholder="Ej. Competidor Local S.A."
                value={newCompData.name || ''}
                onChange={(e) => setNewCompData(p => ({ ...p, name: e.target.value }))}
                className="h-9 text-xs bg-background"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">selecciona plataforma... </Label>
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => {
                  const PlatformIcon = platform.icon
                  const isSelected = newCompPlatforms.includes(platform.key)
                  return (
                    <button
                      key={platform.key}
                      type="button"
                      onClick={() => toggleNewPlatform(platform.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-medium transition-all ${isSelected
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

            <div className="space-y-3 pt-2">
              {newCompPlatforms.map((platformKey) => {
                const platform = platforms.find(p => p.key === platformKey)
                if (!platform) return null
                const PlatformIcon = platform.icon
                return (
                  <div key={platform.key} className="grid gap-1.5">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                      <PlatformIcon className="h-2.5 w-2.5" />
                      Enlace de {platform.label}
                    </Label>
                    <Input
                      placeholder="https://..."
                      value={(newCompData as any)[platform.key] || ''}
                      onChange={(e) => setNewCompData(p => ({ ...p, [platform.key]: e.target.value }))}
                      className="h-9 text-xs bg-background"
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsNewCompOpen(false)} className="text-xs h-9">
              Cancelar
            </Button>
            <Button onClick={handleCreateCompetitor} disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs h-9">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
              Agregar Competidor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showNameAlert} onOpenChange={setShowNameAlert}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600 text-sm font-bold">
              <AlertTriangle className="h-4.5 w-4.5" />
              <span>Nombre Requerido</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Por favor, añade un nombre para el competidor antes de poder guardar los cambios.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowNameAlert(false)} className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs w-full h-9">
              Entendido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
