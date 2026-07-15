import { getSession } from "@/lib/auth";
import { SessionWatcher } from "@/components/auth/session-watcher";
import { RoleAccessGuard } from "@/components/auth/role-access-guard";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <>
      <SessionWatcher initialExpired={!session} />
      <main className="min-h-screen bg-background">
        {session ? (
          <RoleAccessGuard role={session.user?.role}>
            {children}
          </RoleAccessGuard>
        ) : null}
      </main>
    </>
  );
}
