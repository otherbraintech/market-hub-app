import { listUsers } from "@/modules/users/services"
import { UserManagementTable } from "@/components/settings/user-management-table"
import { ShieldCheck } from "lucide-react"

export default async function UsersPage() {
  const users = await listUsers()

  return (
    <div className="flex flex-col h-full bg-background p-8 pt-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary" />
            Gestión de Usuarios
          </h2>
          <p className="text-muted-foreground mt-1">
            Administra los límites de negocios y roles de los usuarios del sistema.
          </p>
        </div>
      </div>

      <UserManagementTable initialUsers={users} />
    </div>
  )
}
