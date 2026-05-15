import CitySearch from '@/components/CitySearch';
import StatsBar from '@/components/StatsBar';
import DealsGrid from '@/components/DealsGrid';

export default function Home() {
  return (
    <main className="flex-1">
      {/* Header */}
      <header className="border-b border-card-border bg-card-bg/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-blue/20 flex items-center justify-center">
              <span className="text-accent-blue font-bold text-sm">IR</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">
                Immo Radar
              </h1>
              <p className="text-xs text-muted">Arbitrage immobilier France</p>
            </div>
          </div>
          <div className="text-xs text-muted font-mono">
            LinkUp + DVF + Airbnb
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-6">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Trouvez les meilleures opportunités immobilières
        </h2>
        <p className="text-muted max-w-2xl mb-6">
          Entrez une ville pour lancer une analyse en temps réel : annonces vs
          prix DVF du marché, rendement Airbnb potentiel, contact vendeur. Chaque
          bien est scoré automatiquement. Données mises en cache 48h.
        </p>
        <CitySearch />
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4">
        <StatsBar />
      </section>

      {/* Deals */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <DealsGrid />
      </section>

      {/* Footer */}
      <footer className="border-t border-card-border py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-muted">
          Immo Radar &mdash; Données DVF (open data), estimations Airbnb, annonces
          via LinkUp. Les informations sont indicatives et ne constituent pas un
          conseil en investissement.
        </div>
      </footer>
    </main>
  );
}
