'use client';

import { useState, useRef, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  updateUserLimitAction, 
  createUserAction, 
  resetUserPasswordAction, 
  deleteUserAction 
} from "@/app/(dashboard)/settings/users/actions";
import { toast } from "sonner";
import { 
  Save, 
  User as UserIcon, 
  Shield, 
  Briefcase, 
  Users, 
  UserPlus, 
  Key, 
  Trash2, 
  Search,
  CheckCircle2,
  ShieldAlert,
  Loader2,
  Undo2,
  Pencil
} from "lucide-react";

interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  plan?: string;
  maxBusinesses: number;
  maxCompetitors: number;
  _count: { businesses: number; competitors: number };
}

const PLAN_PRESETS: Record<string, { label: string; maxBusinesses: number; maxCompetitors: number; badgeColor: string }> = {
  FREE: { label: "Gratuito (1 Neg / 3 Comp)", maxBusinesses: 1, maxCompetitors: 3, badgeColor: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-300" },
  profesional: { label: "Profesional (1 Neg / 3 Comp)", maxBusinesses: 1, maxCompetitors: 3, badgeColor: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  premium: { label: "Premium (1 Neg / 5 Comp)", maxBusinesses: 1, maxCompetitors: 5, badgeColor: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30" },
  agencia: { label: "Agencia (10 Neg / 20 Comp)", maxBusinesses: 10, maxCompetitors: 20, badgeColor: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  CUSTOM: { label: "Personalizado (Medida)", maxBusinesses: 0, maxCompetitors: 0, badgeColor: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30" }
};

interface UserManagementTableProps {
  initialUsers: any[];
  availablePlans?: any[];
}

export function UserManagementTable({ initialUsers, availablePlans = [] }: UserManagementTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  // Snapshot of the original server state — used to detect dirty rows
  const [originalUsers, setOriginalUsers] = useState<User[]>(initialUsers.map(u => ({ ...u })));
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Construir mapa y lista de planes dinámicos basados en la BD/planes activos (/plans)
  const planMap: Record<string, { label: string; name: string; maxBusinesses: number; maxCompetitors: number; price?: number }> = {
    FREE: { label: "Gratuito / Prueba (1N/3C)", name: "Gratuito", maxBusinesses: 1, maxCompetitors: 3, price: 0 }
  };

  if (availablePlans && availablePlans.length > 0) {
    availablePlans.forEach(p => {
      planMap[p.slug || p.id] = {
        label: `${p.name} ($${p.price}/${p.billingPeriod || "mes"} - ${p.maxBusinesses}N/${p.maxCompetitors}C)`,
        name: p.name,
        maxBusinesses: p.maxBusinesses,
        maxCompetitors: p.maxCompetitors,
        price: p.price
      };
    });
  } else {
    // Fallbacks si la BD aún no tiene los registros
    planMap["profesional"] = { label: "Profesional ($200/m - 1N/3C)", name: "Profesional", maxBusinesses: 1, maxCompetitors: 3, price: 200 };
    planMap["premium"] = { label: "Premium ($300/m - 1N/5C)", name: "Premium", maxBusinesses: 1, maxCompetitors: 5, price: 300 };
    planMap["agencia"] = { label: "Agencia ($1000/m - 10N/20C)", name: "Agencia", maxBusinesses: 10, maxCompetitors: 20, price: 1000 };
  }

  planMap["CUSTOM"] = { label: "Personalizado (Medida)", name: "Personalizado", maxBusinesses: 0, maxCompetitors: 0 };

  // Modal para Crear Usuario
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: "",
    name: "",
    password: "",
    role: "USER",
    plan: "FREE",
    maxBusinesses: 1,
    maxCompetitors: 3
  });
  const [isCreating, setIsCreating] = useState(false);

  // Modal para Restablecer Contraseña
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Modal para Eliminar Usuario
  const [deleteTargetUser, setDeleteTargetUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredUsers = users.filter((u) => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Detect which user rows have been modified
  const isDirty = (userId: string): boolean => {
    const current = users.find(u => u.id === userId);
    const original = originalUsers.find(u => u.id === userId);
    if (!current || !original) return false;
    return (
      current.name !== original.name ||
      current.role !== original.role ||
      current.plan !== original.plan ||
      current.maxBusinesses !== original.maxBusinesses ||
      current.maxCompetitors !== original.maxCompetitors
    );
  };

  const dirtyCount = useMemo(() => {
    return users.filter(u => isDirty(u.id)).length;
  }, [users, originalUsers]);

  const handleFieldChange = (userId: string, field: keyof User, value: any) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: value } : u));
  };

  const handlePlanChange = (userId: string, newPlan: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id !== userId) return u;
      const preset = planMap[newPlan];
      if (preset && newPlan !== "CUSTOM") {
        return {
          ...u,
          plan: newPlan,
          maxBusinesses: preset.maxBusinesses,
          maxCompetitors: preset.maxCompetitors
        };
      }
      return { ...u, plan: newPlan };
    }));
  };

  const handleCreatePlanChange = (newPlan: string) => {
    const preset = planMap[newPlan];
    if (preset && newPlan !== "CUSTOM") {
      setCreateForm(prev => ({
        ...prev,
        plan: newPlan,
        maxBusinesses: preset.maxBusinesses,
        maxCompetitors: preset.maxCompetitors
      }));
    } else {
      setCreateForm(prev => ({ ...prev, plan: newPlan }));
    }
  };

  const handleDiscardChanges = (userId: string) => {
    const original = originalUsers.find(u => u.id === userId);
    if (original) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...original } : u));
    }
  };

  const handleSaveUser = async (user: User) => {
    setLoadingId(user.id);
    try {
      const result = await updateUserLimitAction(
        user.id, 
        user.maxBusinesses, 
        user.maxCompetitors, 
        user.role, 
        user.name,
        user.plan || "FREE"
      );
      if (result.success) {
        toast.success(`Datos y plan actualizados para @${user.username}`);
        // Update the original snapshot so the row is no longer dirty
        setOriginalUsers(prev => prev.map(u => u.id === user.id ? { ...user } : u));
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Error al guardar cambios del usuario.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.username || !createForm.name || !createForm.password) {
      toast.error("Por favor completa los campos requeridos.");
      return;
    }

    setIsCreating(true);
    try {
      const res = await createUserAction(createForm);
      if (res.success && res.user) {
        toast.success(`Usuario @${res.user.username} creado exitosamente con plan ${createForm.plan}.`);
        const newUser = {
          ...res.user,
          _count: { businesses: 0, competitors: 0 }
        };
        setUsers(prev => [newUser, ...prev]);
        setOriginalUsers(prev => [{ ...newUser }, ...prev]);
        setIsCreateOpen(false);
        setCreateForm({
          username: "",
          name: "",
          password: "",
          role: "USER",
          plan: "FREE",
          maxBusinesses: 1,
          maxCompetitors: 3
        });
      } else {
        toast.error(res.error || "No se pudo crear el usuario.");
      }
    } catch (err) {
      toast.error("Error al procesar la creación.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetTargetUser || !newPassword) return;
    setIsResetting(true);
    try {
      const res = await resetUserPasswordAction(resetTargetUser.id, newPassword);
      if (res.success) {
        toast.success(`Contraseña de @${resetTargetUser.username} actualizada.`);
        setResetTargetUser(null);
        setNewPassword("");
      } else {
        toast.error(res.error || "No se pudo cambiar la contraseña.");
      }
    } catch (err) {
      toast.error("Error al procesar el cambio de contraseña.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTargetUser) return;
    setIsDeleting(true);
    try {
      const res = await deleteUserAction(deleteTargetUser.id);
      if (res.success) {
        toast.success(`Usuario @${deleteTargetUser.username} eliminado.`);
        setUsers(prev => prev.filter(u => u.id !== deleteTargetUser.id));
        setOriginalUsers(prev => prev.filter(u => u.id !== deleteTargetUser.id));
        setDeleteTargetUser(null);
      } else {
        toast.error(res.error || "No se pudo eliminar el usuario.");
      }
    } catch (err) {
      toast.error("Error al eliminar el usuario.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Plan badge color helper
  const getPlanBadge = (planKey: string) => {
    const preset = PLAN_PRESETS[planKey];
    if (preset) {
      return preset.badgeColor;
    }
    return "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-300";
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtro y Botón Nuevo Usuario */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por usuario o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 bg-card border-border/60"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {dirtyCount > 0 && (
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-bold gap-1 py-1.5 px-3 animate-in fade-in">
              <Pencil className="h-3 w-3" />
              {dirtyCount} {dirtyCount === 1 ? "usuario con cambios" : "usuarios con cambios"}
            </Badge>
          )}

          <Button 
            onClick={() => setIsCreateOpen(true)} 
            className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-500 text-white font-bold gap-2 shadow-md shadow-cyan-600/20"
          >
            <UserPlus className="h-4 w-4" /> Nuevo Usuario
          </Button>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[200px]">Usuario</TableHead>
              <TableHead className="w-[140px]">Rol de Acceso</TableHead>
              <TableHead className="w-[190px]">Plan de Suscripción</TableHead>
              <TableHead>Negocios</TableHead>
              <TableHead>Competidores</TableHead>
              <TableHead className="w-[95px]">Lím. Neg.</TableHead>
              <TableHead className="w-[95px]">Lím. Comp.</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No se encontraron usuarios con ese criterio.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => {
                const currentPlanKey = user.plan || "FREE";
                const rowIsDirty = isDirty(user.id);

                return (
                  <TableRow 
                    key={user.id} 
                    className={`transition-colors ${rowIsDirty ? "bg-cyan-500/5 border-l-2 border-l-cyan-500" : "hover:bg-muted/20"}`}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${rowIsDirty ? "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/40" : "bg-cyan-500/10 text-cyan-600 border-cyan-500/20"}`}>
                          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-foreground">{user.name}</span>
                          <span className="text-xs text-muted-foreground">@{user.username}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Rol Dropdown */}
                    <TableCell>
                      <select
                        value={user.role}
                        onChange={(e) => handleFieldChange(user.id, "role", e.target.value)}
                        className="h-8 px-2 rounded-lg bg-background border border-border/80 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        <option value="USER">USER (Cliente)</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </TableCell>

                    {/* Plan Dropdown */}
                    <TableCell>
                      <select
                        value={currentPlanKey}
                        onChange={(e) => handlePlanChange(user.id, e.target.value)}
                        className="h-8 px-2 rounded-lg bg-background border border-border/80 text-xs font-extrabold text-indigo-900 dark:text-indigo-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-xs"
                      >
                        <option value="FREE">Gratuito / Prueba (1N/3C)</option>
                        <option value="profesional">Profesional ($200/m - 1N/3C)</option>
                        <option value="premium">Premium ($300/m - 1N/5C)</option>
                        <option value="agencia">Agencia ($1000/m - 10N/20C)</option>
                        <option value="CUSTOM">Personalizado (Manual)</option>
                      </select>
                    </TableCell>

                    {/* Negocios creados */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{user._count.businesses} de {user.maxBusinesses}</span>
                      </div>
                    </TableCell>

                    {/* Competidores creados */}
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{user._count.competitors || 0} de {user.maxCompetitors}</span>
                      </div>
                    </TableCell>

                    {/* Límite Negocios */}
                    <TableCell>
                      <Input 
                        type="number" 
                        min="1"
                        value={user.maxBusinesses}
                        onChange={(e) => {
                          handleFieldChange(user.id, 'maxBusinesses', parseInt(e.target.value) || 1);
                          if (user.plan && user.plan !== "CUSTOM") {
                            handleFieldChange(user.id, 'plan', 'CUSTOM');
                          }
                        }}
                        className="h-8 w-16 font-bold text-xs bg-muted/30"
                      />
                    </TableCell>

                    {/* Límite Competidores */}
                    <TableCell>
                      <Input 
                        type="number" 
                        min="1"
                        value={user.maxCompetitors}
                        onChange={(e) => {
                          handleFieldChange(user.id, 'maxCompetitors', parseInt(e.target.value) || 1);
                          if (user.plan && user.plan !== "CUSTOM") {
                            handleFieldChange(user.id, 'plan', 'CUSTOM');
                          }
                        }}
                        className="h-8 w-16 font-bold text-xs bg-muted/30"
                      />
                    </TableCell>

                    {/* Acciones */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {rowIsDirty ? (
                          <>
                            <Button 
                              size="sm" 
                              title="Guardar Cambios"
                              onClick={() => handleSaveUser(user)}
                              disabled={loadingId === user.id}
                              className="h-7 px-2.5 text-[10.5px] font-bold gap-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg shadow-sm"
                            >
                              {loadingId === user.id 
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> 
                                : <Save className="h-3.5 w-3.5" />
                              }
                              <span>Guardar</span>
                            </Button>

                            <Button 
                              size="sm"
                              variant="ghost"
                              title="Descartar cambios"
                              onClick={() => handleDiscardChanges(user.id)}
                              className="h-7 px-2 text-[10px] font-bold gap-1 text-muted-foreground hover:text-foreground rounded-lg"
                            >
                              <Undo2 className="h-3.5 w-3.5" />
                              <span>Descartar</span>
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              title="Restablecer Contraseña"
                              onClick={() => setResetTargetUser(user)}
                              className="h-8 w-8 p-0 text-amber-600 hover:bg-amber-500/10"
                            >
                              <Key className="h-4 w-4" />
                            </Button>

                            <Button 
                              size="sm" 
                              variant="ghost"
                              title="Eliminar Usuario"
                              onClick={() => setDeleteTargetUser(user)}
                              className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* MODAL: Crear Usuario */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-cyan-500" /> Crear Nuevo Usuario
            </DialogTitle>
            <DialogDescription>
              Registra un nuevo usuario en la plataforma asignándole su plan de suscripción y límites.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre Completo</label>
              <Input 
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Ej: Juan Pérez"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre de Usuario (Login)</label>
              <Input 
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                placeholder="Ej: juanperez"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contraseña Inicial</label>
              <Input 
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Plan de Suscripción</label>
              <select
                value={createForm.plan}
                onChange={(e) => handleCreatePlanChange(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-background border border-border text-xs font-extrabold text-indigo-900 dark:text-indigo-200"
              >
                <option value="FREE">Gratuito / Prueba (1 Negocio, 3 Competidores)</option>
                <option value="profesional">Profesional ($200/mes - 1 Negocio, 3 Competidores)</option>
                <option value="premium">Premium ($300/mes - 1 Negocio, 5 Competidores)</option>
                <option value="agencia">Agencia ($1000/mes - 10 Negocios, 20 Competidores)</option>
                <option value="CUSTOM">Personalizado (Configurar manual)</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Rol</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full h-10 px-2 rounded-md bg-background border border-border text-xs font-bold"
                >
                  <option value="USER">USER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Límite Negocios</label>
                <Input 
                  type="number"
                  min="1"
                  value={createForm.maxBusinesses}
                  onChange={(e) => setCreateForm({ ...createForm, maxBusinesses: parseInt(e.target.value) || 1, plan: "CUSTOM" })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Límite Comp.</label>
                <Input 
                  type="number"
                  min="1"
                  value={createForm.maxCompetitors}
                  onChange={(e) => setCreateForm({ ...createForm, maxCompetitors: parseInt(e.target.value) || 3, plan: "CUSTOM" })}
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isCreating} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold">
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : "Crear Usuario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: Restablecer Contraseña */}
      <Dialog open={!!resetTargetUser} onOpenChange={(open) => !open && setResetTargetUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-500" /> Restablecer Contraseña
            </DialogTitle>
            <DialogDescription>
              Ingresa la nueva contraseña para el usuario <strong className="text-foreground">@{resetTargetUser?.username}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nueva Contraseña</label>
              <Input 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTargetUser(null)}>Cancelar</Button>
            <Button 
              onClick={handleResetPassword} 
              disabled={isResetting || newPassword.length < 6}
              className="bg-amber-600 hover:bg-amber-500 text-white font-bold"
            >
              {isResetting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : "Actualizar Contraseña"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: Eliminar Usuario */}
      <Dialog open={!!deleteTargetUser} onOpenChange={(open) => !open && setDeleteTargetUser(null)}>
        <DialogContent className="sm:max-w-md border-rose-500/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <ShieldAlert className="h-5 w-5" /> Eliminar Usuario
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar permanentemente a <strong className="text-foreground">{deleteTargetUser?.name} (@{deleteTargetUser?.username})</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTargetUser(null)}>Cancelar</Button>
            <Button 
              onClick={handleDeleteUser} 
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : "Sí, Eliminar Usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
