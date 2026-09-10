import type { Metadata } from 'next';
import { CategoryListing, categoryMetadata } from '@/components/category-listing';

export const revalidate = 300;

export const metadata: Metadata = categoryMetadata('hiburan');

export default function HiburanPage() {
  return <CategoryListing categoryKey="hiburan" />;
}
