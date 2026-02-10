"use client";

import { useActionState } from "react";
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { signup } from "@/app/(auth)/login/actions"
import Link from "next/link";

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, action, isPending] = useActionState(signup, undefined);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Crea una cuenta</CardTitle>
          <CardDescription>
            Completa tus datos para empezar a planificar con IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="name">Nombre</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Tu nombre completo"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="username">Usuario</FieldLabel>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="nombreusuario"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <Input id="password" name="password" type="password" required />
              </Field>
              
              {state?.error && (
                <p className="text-sm text-destructive font-medium">{state.error}</p>
              )}

              <Field>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Registrando..." : "Crear cuenta"}
                </Button>
                <div className="text-center text-sm">
                  ¿Ya tienes una cuenta?{" "}
                  <Link href="/login" className="underline underline-offset-4">
                    Inicia sesión
                  </Link>
                </div>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
