"use client";

import React, { useState, useEffect } from "react";
import { 
  Zap, 
  Crown, 
  Building2, 
  Check, 
  Sparkles, 
  Pencil, 
  ShieldCheck, 
  Loader2, 
  Plus, 
  Trash2, 
  Info,
  CreditCard,
  Layers
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getSubscriptionPlansAction, updateSubscriptionPlanAction, getUserSessionAction } from "@/actions/plans";

interface Plan {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  price: number;
  currency: string;
  billingPeriod: string;
  postsPerMonth: number;
  postsPerWeek: string | null;
  maxBusinesses: number;
  maxCompetitors: number;
  badge: string | null;
  isPopular: boolean;
  color: string;
  features: string[];
  order: number;
}

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sessionRole, setSessionRole] = useState<string | null>(null);

  // Modal para Editar Plan (Admin)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    tagline: string;
    price: number;
    postsPerMonth: number;
    postsPerWeek: string;
    maxBusinesses: number;
    maxCompetitors: number;
    badge: string;
    isPopular: boolean;
    features: string[];
  }>({
    name: "",
    tagline: "",
    price: 0,
    postsPerMonth: 16,
    postsPerWeek: "",
    maxBusinesses: 1,
    maxCompetitors: 3,
    badge: "",
    isPopular: false,
    features: []
  });
  const [newFeatureText, setNewFeatureText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [plansRes, sessionRes] = await Promise.all([
          getSubscriptionPlansAction(),
          getUserSessionAction()
        ]);

        if (plansRes?.plans && plansRes.plans.length > 0) {
          const parsedPlans = plansRes.plans.map((p: any) => ({
            ...p,
            id: p.id || p.slug,
            features: typeof p.features === "string" ? JSON.parse(p.features) : (Array.isArray(p.features) ? p.features : [])
          }));
          setPlans(parsedPlans);
        }

        const role = sessionRes?.user?.role || sessionRes?.role;
        if (role) {
          setSessionRole(role);
          if (role === "SUPER_ADMIN" || role === "ADMIN") {
            setIsAdmin(true);
          }
        }
      } catch (err) {
        console.error("Error loading plans data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const openEditModal = (plan: Plan) => {
    setEditingPlan(plan);
    setEditForm({
      name: plan.name,
      tagline: plan.tagline || "",
      price: plan.price,
      postsPerMonth: plan.postsPerMonth,
      postsPerWeek: plan.postsPerWeek || "",
      maxBusinesses: plan.maxBusinesses,
      maxCompetitors: plan.maxCompetitors,
      badge: plan.badge || "",
      isPopular: plan.isPopular,
      features: [...plan.features]
    });
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setEditForm(prev => ({
      ...prev,
      features: [...prev.features, newFeatureText.trim()]
    }));
    setNewFeatureText("");
  };

  const handleRemoveFeature = (index: number) => {
    setEditForm(prev => ({
      ...prev,
      features: prev.features.filter((_, idx) => idx !== index)
    }));
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;

    setIsSaving(true);
    try {
      const res = await updateSubscriptionPlanAction(editingPlan.id, {
        name: editForm.name,
        tagline: editForm.tagline,
        price: Number(editForm.price),
        postsPerMonth: Number(editForm.postsPerMonth),
        postsPerWeek: editForm.postsPerWeek,
        maxBusinesses: Number(editForm.maxBusinesses),
        maxCompetitors: Number(editForm.maxCompetitors),
        badge: editForm.badge.trim() || null,
        isPopular: editForm.isPopular,
        features: editForm.features
      });

      if (res.success && res.plan) {
        toast.success(`Plan "${editForm.name}" actualizado correctamente en la BDD.`);
        setPlans(prev => prev.map(p => p.id === editingPlan.id ? {
          ...p,
          ...res.plan,
          features: typeof res.plan.features === "string" ? JSON.parse(res.plan.features) : res.plan.features
        } : p));
        setEditingPlan(null);
      } else {
        toast.error(res.error || "No se pudo actualizar el plan.");
      }
    } catch (err) {
      toast.error("Error al guardar cambios del plan.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderIcon = (slug: string, index: number) => {
    if (slug === "premium" || index === 1) {
      return (
        <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4 shadow-sm">
          <Crown className="w-6 h-6" />
        </div>
      );
    }
    if (slug === "agencia" || index === 2) {
      return (
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 shadow-sm">
          <Building2 className="w-6 h-6" />
        </div>
      );
    }
    return (
      <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4 shadow-sm">
        <Zap className="w-6 h-6" />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12 space-y-10 animate-fade-in">
      {/* Header Central */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
          Planes de Suscripción
        </h1>
        <p className="text-muted-foreground text-base md:text-lg font-medium">
          Escala según el crecimiento de tu negocio
        </p>

        {/* Badge de Rol */}
        <div className="pt-2 flex justify-center">
          {isAdmin ? (
            <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30 px-3 py-1 text-xs font-bold gap-1.5 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5" /> Modo Administrador ({sessionRole}): Edición Habilitada
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border px-3 py-1 text-xs font-medium gap-1.5">
              <Info className="w-3.5 h-3.5" /> Vista Informativa de Planes
            </Badge>
          )}
        </div>
      </div>

      {/* Loader */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-purple-600 dark:text-purple-400" />
          <p className="text-sm text-muted-foreground font-medium">Cargando planes de suscripción desde PostgreSQL...</p>
        </div>
      )}

      {/* Grid de Cards de Planes */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((plan, index) => {
            const isHighlighted = plan.isPopular || plan.slug === "premium";

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl transition-all duration-300 flex flex-col justify-between ${
                  isHighlighted 
                    ? "bg-card border-2 border-purple-500 shadow-xl dark:shadow-purple-900/30 md:-translate-y-2" 
                    : "bg-card/80 backdrop-blur-xs border border-border/80 shadow-md hover:border-indigo-500/50"
                }`}
              >
                {/* Badge Superior "Más popular" */}
                {isHighlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3.5 py-1 rounded-full shadow-lg gap-1 border-0">
                      <Sparkles className="w-3 h-3 fill-current" /> {plan.badge || "Más popular"}
                    </Badge>
                  </div>
                )}

                <div className="p-8 space-y-6 flex-1">
                  {/* Icono del Plan */}
                  {renderIcon(plan.slug, index)}

                  {/* Título & Tagline */}
                  <div>
                    <h3 className="text-2xl font-black text-foreground tracking-tight">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 font-medium">{plan.tagline || "Para tu negocio"}</p>
                  </div>

                  {/* Precio */}
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl md:text-5xl font-black text-foreground">${plan.price}</span>
                    <span className="text-muted-foreground text-sm font-semibold">/{plan.billingPeriod || "mes"}</span>
                  </div>

                  {/* Límites y Posteos Clave */}
                  <div className="space-y-2 py-2 border-y border-border/60 text-sm font-medium">
                    <div className="flex items-center gap-2 text-foreground font-bold">
                      <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0"></span>
                      <span>{plan.postsPerMonth} posteos {plan.slug === "agencia" ? "por negocio" : "mensuales"}</span>
                    </div>
                    {plan.postsPerWeek && (
                      <div className="flex items-center gap-2 text-muted-foreground text-xs pl-4 font-semibold">
                        <span>•</span>
                        <span>{plan.postsPerWeek}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground text-xs pl-4 font-semibold">
                      <span>•</span>
                      <span>{plan.maxBusinesses} {plan.maxBusinesses === 1 ? "cuenta de negocio" : "negocios incluidos"}</span>
                    </div>
                  </div>

                  {/* Lista de Características */}
                  <div className="space-y-3 pt-1 text-sm text-foreground/90 font-medium">
                    {plan.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span className="leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer y Botón de Acción */}
                <div className="p-8 pt-0 space-y-3">
                  {isAdmin ? (
                    <Button
                      onClick={() => openEditModal(plan)}
                      className={`w-full py-6 font-bold rounded-2xl transition-all gap-2 ${
                        isHighlighted 
                          ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30" 
                          : "bg-muted/80 hover:bg-muted text-foreground border border-border"
                      }`}
                    >
                      <Pencil className="w-4 h-4" /> Editar Plan (Admin)
                    </Button>
                  ) : (
                    <Button
                      onClick={() => toast.info(`Has seleccionado el plan ${plan.name}. Un asesor se pondrá en contacto.`)}
                      className={`w-full py-6 font-bold rounded-2xl transition-all ${
                        isHighlighted 
                          ? "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/30" 
                          : "bg-primary hover:bg-primary/90 text-primary-foreground"
                      }`}
                    >
                      Seleccionar Plan
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE EDICIÓN PARA ADMINISTRADORES */}
      <Dialog open={!!editingPlan} onOpenChange={(open) => !open && setEditingPlan(null)}>
        <DialogContent className="sm:max-w-xl bg-card border-border text-card-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-foreground">
              <Pencil className="w-5 h-5 text-purple-600 dark:text-purple-400" /> Editar Configuración del Plan "{editingPlan?.name}"
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs font-medium">
              Los cambios realizados se guardarán en PostgreSQL y se actualizarán inmediatamente en la aplicación.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePlan} className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase tracking-wider">Nombre del Plan</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="bg-background border-border text-foreground font-semibold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase tracking-wider">Precio Mensual ($ USD)</label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                  className="bg-background border-border text-foreground font-bold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-muted-foreground uppercase tracking-wider">Subtítulo / Tagline</label>
              <Input
                value={editForm.tagline}
                onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })}
                placeholder="Ej: Para pymes y emprendimientos"
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase tracking-wider">Posteos / Mes</label>
                <Input
                  type="number"
                  min="1"
                  value={editForm.postsPerMonth}
                  onChange={(e) => setEditForm({ ...editForm, postsPerMonth: Number(e.target.value) })}
                  className="bg-background border-border text-foreground font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase tracking-wider">Negocios Max.</label>
                <Input
                  type="number"
                  min="1"
                  value={editForm.maxBusinesses}
                  onChange={(e) => setEditForm({ ...editForm, maxBusinesses: Number(e.target.value) })}
                  className="bg-background border-border text-foreground font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase tracking-wider">Competidores Max.</label>
                <Input
                  type="number"
                  min="1"
                  value={editForm.maxCompetitors}
                  onChange={(e) => setEditForm({ ...editForm, maxCompetitors: Number(e.target.value) })}
                  className="bg-background border-border text-foreground font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase tracking-wider">Publicaciones / Semana (Texto)</label>
                <Input
                  value={editForm.postsPerWeek}
                  onChange={(e) => setEditForm({ ...editForm, postsPerWeek: e.target.value })}
                  placeholder="Ej: 4 publicaciones/semana"
                  className="bg-background border-border text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-muted-foreground uppercase tracking-wider">Badge Superior (Opcional)</label>
                <Input
                  value={editForm.badge}
                  onChange={(e) => setEditForm({ ...editForm, badge: e.target.value, isPopular: !!e.target.value.trim() })}
                  placeholder="Ej: Más popular"
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>

            {/* Lista de Características / Features */}
            <div className="space-y-2 pt-2 border-t border-border">
              <label className="font-bold text-muted-foreground uppercase tracking-wider block">Características Incluidas ({editForm.features.length})</label>
              
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {editForm.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded bg-muted/40 border border-border">
                    <span className="text-foreground font-medium">{feat}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveFeature(idx)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <Input
                  value={newFeatureText}
                  onChange={(e) => setNewFeatureText(e.target.value)}
                  placeholder="Agregar nueva característica..."
                  className="bg-background border-border text-foreground text-xs"
                />
                <Button
                  type="button"
                  onClick={handleAddFeature}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-bold shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setEditingPlan(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-purple-600 hover:bg-purple-500 text-white font-bold">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : "Guardar Cambios del Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
