import { getShippingConfig } from '@/lib/shipping-config';
import ShippingConfigForm from './ShippingConfigForm';

export default async function AdminEnviosPage() {
  const config = await getShippingConfig();
  return <ShippingConfigForm initial={config} />;
}
