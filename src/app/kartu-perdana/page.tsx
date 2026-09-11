import type { Metadata } from 'next';
import { CategoryListing, categoryMetadata } from '@/components/category-listing';

export const revalidate = 300;

export const metadata: Metadata = categoryMetadata('perdana');

export default function KartuPerdanaPage() {
  return <CategoryListing categoryKey="perdana" />;
}
