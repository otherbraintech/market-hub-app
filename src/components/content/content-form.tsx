"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  ContentType, 
  ContentFormat, 
  SocialChannel, 
  ContentStatus 
} from "@prisma/client";
import { contentSchema, ContentFormValues } from "@/lib/schemas/content";

import { createContentAction, updateContentAction } from "@/actions/content";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ContentFormProps {
  businessId: string;
  campaigns: { id: string, name: string }[];
  products: { id: string, name: string }[];
  socialAccounts: { id: string, accountName: string, channel: SocialChannel }[];
  defaultValues?: Partial<ContentFormValues> & { id?: string };
  onSuccess?: () => void;
}

export function ContentForm({ 
  businessId, 
  campaigns, 
  products, 
  socialAccounts, 
  defaultValues, 
  onSuccess 
}: ContentFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<ContentFormValues>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      title: defaultValues?.title || "",
      type: defaultValues?.type || ContentType.POST,
      format: defaultValues?.format || ContentFormat.IMAGE,
      channel: defaultValues?.channel || undefined,
      campaignId: defaultValues?.campaignId || "",
      productId: defaultValues?.productId || "",
      socialAccountId: defaultValues?.socialAccountId || "",
      body: defaultValues?.body || "",
      caption: defaultValues?.caption || "",
      hashtags: defaultValues?.hashtags || [],
      scheduledAt: defaultValues?.scheduledAt ? new Date(defaultValues.scheduledAt) : null,
      status: defaultValues?.status || ContentStatus.IDEA,
      mediaUrl: defaultValues?.mediaUrl || "",
    },
  });

  async function onSubmit(values: ContentFormValues) {
    setLoading(true);
    try {
      let result;
      if (defaultValues?.id) {
        result = await updateContentAction(defaultValues.id, values, businessId);
      } else {
        result = await createContentAction({ ...values, businessId });
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto px-1">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título / Idea</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Beneficios de la IA en el marketing" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de contenido" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(ContentType).map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="format"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Formato</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Formato" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(ContentFormat).map((format) => (
                      <SelectItem key={format} value={format}>{format}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="channel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Red Social</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona red" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(SocialChannel).map((channel) => (
                      <SelectItem key={channel} value={channel}>{channel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="socialAccountId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cuenta Social</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona cuenta" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Ninguna</SelectItem>
                    {socialAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.accountName} ({account.channel})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="campaignId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Campaña</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Asociar a campaña" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Ninguna</SelectItem>
                    {campaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>{campaign.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="productId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Producto</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Asociar a producto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Ninguno</SelectItem>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>{product.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="scheduledAt"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Fecha Programada</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP", { locale: es })
                      ) : (
                        <span>Selecciona una fecha</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value || undefined}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="caption"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Copy / Caption (Opcional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Escritura persuasiva para redes sociales..." 
                  className="min-h-[100px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {defaultValues?.id ? "Actualizar Contenido" : "Crear Contenido"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
