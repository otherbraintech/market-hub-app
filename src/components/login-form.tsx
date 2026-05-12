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
import { login } from "@/app/(auth)/login/actions"
import Link from "next/link";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [state, action, isPending] = useActionState(login, undefined);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <CardDescription>
            Ingresa tu usuario y contraseña para acceder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action}>
            <FieldGroup>
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
                  {isPending ? "Iniciando..." : "Iniciar sesión"}
                </Button>

                <div className="text-center text-sm">
                  ¿No tienes una cuenta?{" "}
                  <Link href="/register" className="underline underline-offset-4">
                    Regístrate
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
