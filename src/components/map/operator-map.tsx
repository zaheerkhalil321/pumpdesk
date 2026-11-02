import { MapPin } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

/** The Warren, ME yard. */
const YARD_CENTER = '44.1217,-69.2514';

/**
 * Google's Maps Embed API key. It is meant to be public, so lock it to this site's domains and to the
 * Maps Embed API in the Google Cloud console. Without a key the map falls back to OpenStreetMap.
 */
const GOOGLE_MAPS_EMBED_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;

const MAP_SRC = GOOGLE_MAPS_EMBED_KEY
  ? `https://www.google.com/maps/embed/v1/view?key=${encodeURIComponent(GOOGLE_MAPS_EMBED_KEY)}&center=${YARD_CENTER}&zoom=9`
  : 'https://www.openstreetmap.org/export/embed.html?bbox=-69.55%2C43.95%2C-68.95%2C44.30&layer=mapnik';

/**
 * Where the operators are. The PumpDesk mobile app that reports each operator's location is not
 * built yet, so for now this is a plain map with nothing on it.
 */
export function OperatorMap() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 w-full">
      <PageHeader title="Map" description="See where your operators are." />

      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs h-[calc(100dvh-16rem)] min-h-[360px]">
        <iframe
          title="Operator locations map"
          src={MAP_SRC}
          loading="lazy"
          className="h-full w-full border-0"
        />

        <div className="absolute left-3 right-3 bottom-9 sm:left-4 sm:right-auto sm:bottom-9 sm:max-w-sm rounded-xl border border-slate-200/90 bg-white/95 p-3.5 shadow-md backdrop-blur-sm flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-brand-light text-brand flex items-center justify-center shrink-0">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">No operators on the map yet</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Operators will show up here once they share their location from the PumpDesk mobile app.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
