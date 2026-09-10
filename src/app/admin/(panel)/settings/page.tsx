import { supabaseAdmin } from '@/lib/supabase';
import { SettingsForm } from '@/components/admin/settings-form';
import { PaymentMethodsEditor } from '@/components/admin/payment-methods-editor';
import { getOrderSettings, getPricingConfig, getStoreSettings } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const [store, pricing, order, methods] = await Promise.all([
    getStoreSettings(),
    getPricingConfig(),
    getOrderSettings(),
    supabaseAdmin().from('payment_methods').select('*').order('sort_order', { ascending: true }),
  ]);

  return (
    <div className="space-y-4">
      <SettingsForm store={store} pricing={pricing} order={order} />
      <PaymentMethodsEditor methods={methods.data ?? []} />
    </div>
  );
}
