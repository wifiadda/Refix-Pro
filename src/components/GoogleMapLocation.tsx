import { useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
} from '@vis.gl/react-google-maps';
import { Navigation, MapPin } from 'lucide-react';
import { useApp } from '../context/AppContext';

const REFIX_PRO_COORDS = { lat: 28.4716, lng: 77.0436 };
const DIRECTIONS_URL =
  'https://www.google.com/maps/dir/?api=1&destination=SCF-92,+Sector+14+Main+Market,+Gurugram,+Haryana+122007,+India';

function RefixMarker({ address }: { address: string }) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(true);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={REFIX_PRO_COORDS}
        onClick={() => setOpen((prev) => !prev)}
        title="Refix Pro – MacBook Repair Gurugram"
      >
        <Pin background="#0066CC" borderColor="#003E7E" glyphColor="#FFFFFF" scale={1.15} />
      </AdvancedMarker>
      {open && marker && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)} maxWidth={260}>
          <div className="p-1 text-[#1D1D1F] space-y-1.5">
            <p className="text-sm font-bold">Refix Pro</p>
            <p className="text-xs text-[#424245] leading-snug">{address}</p>
            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0066CC] hover:underline"
            >
              <Navigation className="w-3 h-3" />
              Get Directions
            </a>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export function GoogleMapLocation({
  heightClass = 'h-[360px]',
  quotaExceeded = false,
}: {
  heightClass?: string;
  quotaExceeded?: boolean;
}) {
  const { settings } = useApp();
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  if (!apiKey || quotaExceeded) {
    const embedQuery = encodeURIComponent('SCF-92, Sector 14 Main Market, Gurugram, Haryana 122007');
    return (
      <div className={`relative w-full ${heightClass} rounded-xl overflow-hidden border border-[#E5E5EA] bg-[#F5F5F7]`}>
        <iframe
          title="Refix Pro Sector 14 Gurugram Location"
          src={`https://maps.google.com/maps?q=${embedQuery}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
          className="w-full h-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm border border-[#E5E5EA] rounded-lg px-3 py-2 shadow-sm flex items-center gap-3">
          <MapPin className="w-4 h-4 text-[#0066CC] shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-[#1D1D1F]">{settings.businessName}</p>
            <p className="text-[#6E6E73]">SCF-92, Sector 14 Main Market</p>
          </div>
          <a
            href={DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 px-2.5 py-1 text-xs font-semibold bg-[#0066CC] text-white rounded-md hover:bg-[#0052A3] whitespace-nowrap"
          >
            Directions
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${heightClass} rounded-xl overflow-hidden border border-[#E5E5EA] bg-[#F5F5F7]`}>
      <APIProvider apiKey={apiKey} libraries={['marker']} language="en" region="IN">
        <GoogleMap
          mapId="DEMO_MAP_ID"
          defaultCenter={REFIX_PRO_COORDS}
          defaultZoom={16}
          gestureHandling="cooperative"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          <RefixMarker address={settings.address} />
        </GoogleMap>
      </APIProvider>
    </div>
  );
}
