import { notFound } from 'next/navigation';
import { getCompanyByTicker } from '@/lib/edgar';
import { WorkbenchSidebar } from '@/components/workbench-sidebar';

export const revalidate = 3600;

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { symbol: string };
}) {
  const symbol = params.symbol.toUpperCase();
  const company = await getCompanyByTicker(symbol).catch(() => null);
  if (!company) notFound();

  return (
    <div className="min-h-screen lg:flex">
      <WorkbenchSidebar symbol={symbol} companyName={company.name} />
      <div className="flex-1 min-w-0">
        <main className="mx-auto max-w-5xl px-6 py-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
