import { getQuoterPricing } from '@/lib/quoter-config';
import QuoterConfigForm from './QuoterConfigForm';

export default async function AdminCotizadorPage() {
  const pricing = await getQuoterPricing();
  return <QuoterConfigForm initial={pricing} />;
}
