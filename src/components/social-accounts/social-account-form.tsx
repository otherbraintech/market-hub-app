"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { socialAccountSchema, SocialAccountFormValues } from "@/lib/schemas/social-account";
import { createSocialAccountAction, updateSocialAccountAction } from "../../actions/social-account";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SocialAccountFormProps {
  businessId: string;
  defaultValues?: SocialAccountFormValues & { id: string };
  onSuccess?: () => void;
}

export function SocialAccountForm({ businessId, defaultValues, onSuccess }: SocialAccountFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<SocialAccountFormValues>({
    resolver: zodResolver(socialAccountSchema) as any,
    defaultValues: {
      channel: defaultValues?.channel || "INSTAGRAM",
      accountName: defaultValues?.accountName || "",
      accountId: defaultValues?.accountId || "",
      accountUrl: defaultValues?.accountUrl || "",
      avatar: defaultValues?.avatar || "",
      isActive: defaultValues?.isActive ?? true,
    },
  });

  async function onSubmit(values: SocialAccountFormValues) {
    setLoading(true);
    try {
      let result;
      if (defaultValues?.id) {
        result = await updateSocialAccountAction(defaultValues.id, values, businessId);
      } else {
        result = await createSocialAccountAction({ ...values, businessId });
      }

      if (result.success) {
        toast.success(result.message);
        form.reset();
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
        <FormField
          control={form.control}
          name="channel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Canal Social</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una red social" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {(["FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN", "YOUTUBE"] as any[]).map((channel) => (
                    <SelectItem key={channel} value={channel}>
                      {channel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="accountName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la Cuenta</FormLabel>
                <FormControl>
                  <Input placeholder="ej: Mi Marca Oficial" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="accountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID de la Cuenta / Username</FormLabel>
                <FormControl>
                  <Input placeholder="ej: mimarca_ok" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="accountUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL del Perfil (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="https://instagram.com/mimarca" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="avatar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL del Avatar (Opcional)</FormLabel>
              <FormControl>
                <Input placeholder="https://..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Estado</FormLabel>
                <FormDescription>
                  Activa o desactiva la cuenta para publicación
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {defaultValues ? "Actualizar Cuenta" : "Vincular Cuenta"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
