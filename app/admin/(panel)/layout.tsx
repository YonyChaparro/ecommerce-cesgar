import { getSession } from '@/lib/session';
import { logoutAction } from '../(auth)/login/actions';
import AdminShell from './AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <AdminShell session={session} logoutAction={logoutAction}>
      {children}
    </AdminShell>
  );
}
