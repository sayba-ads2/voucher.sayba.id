import type { Metadata } from 'next';
import { CategoryListing, categoryMetadata } from '@/components/category-listing';

export const revalidate = 300;

export const metadata: Metadata = categoryMetadata('pln');

export default function TokenListrikPage() {
  return <CategoryListing categoryKey="pln" />;
}
