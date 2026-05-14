'use client'

import { useState } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { updateUserLimitAction } from "@/app/(dashboard)/settings/users/actions"
import { toast } from "sonner"
import { Save, User as UserIcon, Shield, Briefcase } from "lucide-react"

interface User {
  id: string
  username: string
  name: string
  role: string
  maxBusinesses: number
  maxCompetitors: number
  _count: { businesses: number }
}

interface UserManagementTableProps {
  initialUsers: any[]
}

export function UserManagementTable({ initialUsers }: UserManagementTableProps) {
  const [users, setUsers] = useState(initialUsers)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleLimitChange = (userId: string, field: 'maxBusinesses' | 'maxCompetitors', value: string) => {
    const numValue = parseInt(value) || 0
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, [field]: numValue } : u))
  }

  const handleSave = async (user: User) => {
    setLoadingId(user.id)
    try {
      const result = await updateUserLimitAction(user.id, user.maxBusinesses, user.maxCompetitors)
      if (result.success) {
        toast.success(`Límites actualizados para ${user.username}`)
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error("Error al guardar")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[200px]">Usuario</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Negocios</TableHead>
            <TableHead className="w-[120px]">Límite Neg.</TableHead>
            <TableHead className="w-[120px]">Límite Comp.</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-muted/20 transition-colors">
              <TableCell className="font-medium">
                {/* ... user info ... */}
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">{user.name}</span>
                    <span className="text-xs text-muted-foreground">@{user.username}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  {user.role}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="font-bold">{user._count.businesses}</span>
                </div>
              </TableCell>
              <TableCell>
                <Input 
                  type="number" 
                  min="1"
                  value={user.maxBusinesses}
                  onChange={(e) => handleLimitChange(user.id, 'maxBusinesses', e.target.value)}
                  className="h-8 w-20 font-bold bg-muted/30"
                />
              </TableCell>
              <TableCell>
                <Input 
                  type="number" 
                  min="1"
                  value={user.maxCompetitors}
                  onChange={(e) => handleLimitChange(user.id, 'maxCompetitors', e.target.value)}
                  className="h-8 w-20 font-bold bg-muted/30"
                />
              </TableCell>
              <TableCell className="text-right">
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => handleSave(user)}
                  disabled={loadingId === user.id}
                  className="hover:bg-primary hover:text-primary-foreground"
                >
                  <Save className={`h-4 w-4 ${loadingId === user.id ? 'animate-pulse' : ''}`} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
