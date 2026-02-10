"use client";

import { useState } from "react";
import { SocialAccount, SocialChannel } from "@prisma/client";
import { deleteSocialAccountAction } from "@/actions/social-account";
import { SocialAccountForm } from "./social-account-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Youtube, 
  MoreHorizontal, 
  Trash, 
  Edit, 
  Plus, 
  Globe, 
  ExternalLink 
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SocialAccountsListProps {
  businessId: string;
  accounts: SocialAccount[];
}

const channelIcons: Record<string, any> = {
  INSTAGRAM: Instagram,
  FACEBOOK: Facebook,
  TWITTER: Twitter,
  LINKEDIN: Linkedin,
  YOUTUBE: Youtube,
  TIKTOK: Globe, // Fallback icon
  PINTEREST: Globe,
  THREADS: Globe,
};

export function SocialAccountsList({ businessId, accounts }: SocialAccountsListProps) {
  const [editingAccount, setEditingAccount] = useState<SocialAccount | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  async function handleDelete(id: string) {
    if (confirm("¿Estás seguro de eliminar esta cuenta? Perderás la conexión con esta red social.")) {
      const result = await deleteSocialAccountAction(id, businessId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.error);
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Cuentas Sociales Vinculadas</h3>
        <Button onClick={() => {
          setEditingAccount(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Vincular Cuenta
        </Button>
      </div>

      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] border rounded-lg bg-muted/20 border-dashed p-8 text-center">
          <div className="p-4 rounded-full bg-background mb-4 shadow-sm">
            <Globe className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">No hay redes sociales vinculadas</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Vincula tus cuentas para que la IA pueda publicar automáticamente o programar contenido por ti.
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
             <Plus className="mr-2 h-4 w-4" /> Vincular mi primera cuenta
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => {
            const Icon = channelIcons[account.channel] || Globe;
            return (
              <Card key={account.id} className="hover:shadow-sm transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={account.avatar || ""} />
                      <AvatarFallback className="bg-primary/5">
                        <Icon className="h-5 w-5 text-primary" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <CardTitle className="text-sm font-bold">
                        {account.accountName}
                      </CardTitle>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        @{account.accountId}
                        {account.accountUrl && (
                          <a href={account.accountUrl} target="_blank" rel="noreferrer" className="hover:text-primary">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => {
                        setEditingAccount(account);
                        setIsDialogOpen(true);
                      }}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(account.id)}
                      >
                        <Trash className="mr-2 h-4 w-4" /> Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={account.isActive ? "success" : "secondary"} className="text-[10px] h-5 px-1">
                      {account.isActive ? "Conectado" : "Inactivo"}
                    </Badge>
                    {account.followers !== null && (
                      <span className="text-xs font-medium text-muted-foreground">
                        {account.followers.toLocaleString()} seguidores
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingAccount(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAccount ? "Editar Cuenta Social" : "Vincular Nueva Cuenta"}</DialogTitle>
            <DialogDescription>
              Configura el acceso para que la IA pueda gestionar tu presencia en redes.
            </DialogDescription>
          </DialogHeader>
          <SocialAccountForm 
            businessId={businessId}
            defaultValues={editingAccount ? {
              id: editingAccount.id,
              channel: editingAccount.channel,
              accountName: editingAccount.accountName,
              accountId: editingAccount.accountId,
              accountUrl: editingAccount.accountUrl || "",
              avatar: editingAccount.avatar || "",
              isActive: editingAccount.isActive,
            } : undefined} 
            onSuccess={() => setIsDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
