import type { Metadata } from 'next';
import { CategoryListing, categoryMetadata } from '@/components/category-listing';

export const revalidate = 300;

export const metadata: Metadata = categoryMetadata('lainnya');

export default function LainnyaPage() {
  return <CategoryListing categoryKey="lainnya" />;
}
