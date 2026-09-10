import type { Metadata } from 'next';
import { CategoryListing, categoryMetadata } from '@/components/category-listing';

export const revalidate = 300;

export const metadata: Metadata = categoryMetadata('data');

export default function PaketDataPage() {
  return <CategoryListing categoryKey="data" />;
}
