import CityPills from '@/components/CityPills';
import DealsGrid from '@/components/DealsGrid';

export const dynamic = 'force-dynamic';

type Params = Promise<{ city: string }>;

function capitalizeCity(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: { params: Params }) {
  const { city } = await params;
  const displayName = capitalizeCity(city);
  return {
    title: `${displayName} - Immo Radar`,
    description: `Meilleures opportunités immobilières à ${displayName}. Analyse prix vs marché DVF et rendement Airbnb.`,
  };
}

export default async function CityPage({ params }: { params: Params }) {
  const { city } = await params;
  const displayName = capitalizeCity(city);

  return (
    <main className="flex-1">
      {/* Header */}
      <header className="border-b border-card-border bg-card-bg/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-accent-blue/20 flex items-center justify-center">
                <span className="text-accent-blue font-bold text-sm">IR</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-tight">
                  Immo Radar
                </h1>
                <p className="text-xs text-muted">Arbitrage immobilier France</p>
              </div>
            </a>
          </div>
          <div className="text-xs text-muted font-mono">
            v1.0 &middot; LinkUp + DVF + Airbnb
          </div>
        </div>
      </header>

      {/* City header */}
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-6">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          {displayName}
        </h2>
        <p className="text-muted mb-6">
          Opportunités immobilières à {displayName} &mdash; décotes vs marché DVF
          et rendement Airbnb estimé.
        </p>
        <CityPills activeCity={city} />
      </section>

      {/* Deals */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <DealsGrid city={displayName} />
      </section>

      {/* Footer */}
      <footer className="border-t border-card-border py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-muted">
          Immo Radar &mdash; Données DVF (open data), estimations Airbnb, annonces
          via LinkUp.
        </div>
      </footer>
    </main>
  );
}
