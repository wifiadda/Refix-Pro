import { useEffect } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useApp } from '../context/AppContext';
import type { GoogleLiveReview } from '../types';

const REFIX_CENTER = { lat: 28.4716, lng: 77.0436 };
const PLACE_FIELDS = ['id', 'displayName', 'rating', 'userRatingCount', 'reviews', 'googleMapsURI'];

function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err || '');
  return /quota|RESOURCE_EXHAUSTED|OVER_QUERY_LIMIT|rate.?limit|429/i.test(msg);
}

export function LiveGoogleReviewsSync() {
  const placesLib = useMapsLibrary('places');
  const {
    settings,
    googleSyncNonce,
    setGoogleLiveProfile,
  } = useApp();

  const placeIdSetting = (settings.googlePlaceId || '').trim();
  const businessName = (settings.businessName || 'Refix Pro').trim();

  useEffect(() => {
    if (!placesLib) return;
    let cancelled = false;

    const fetchProfile = async () => {
      setGoogleLiveProfile((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        type PlacesPlace = InstanceType<typeof placesLib.Place>;
        interface PlaceReviewLike {
          authorAttribution?: {
            displayName?: string | null;
            uri?: string | null;
            photoURI?: string | null;
          } | null;
          rating?: number | null;
          originalText?: string | null;
          text?: string | null;
          relativePublishTimeDescription?: string | null;
          googleMapsURI?: string | null;
        }

        let matchedPlace: PlacesPlace | null = null;

        if (placeIdSetting) {
          const place = new placesLib.Place({
            id: placeIdSetting,
            requestedLanguage: 'en',
          });
          await place.fetchFields({ fields: PLACE_FIELDS });
          matchedPlace = place;
        } else {
          const { places } = await placesLib.Place.searchByText({
            textQuery: `${businessName} SCF-92 Sector 14 Main Market Gurugram`,
            fields: PLACE_FIELDS,
            locationBias: {
              center: REFIX_CENTER,
              radius: 1500,
            },
            maxResultCount: 1,
          });
          matchedPlace = places?.[0] ?? null;
        }

        if (cancelled) return;

        if (!matchedPlace) {
          setGoogleLiveProfile((prev) => ({
            ...prev,
            loaded: true,
            loading: false,
            error: 'No matching Google Business Profile listing returned by Places Search.',
          }));
          return;
        }

        const placeIdValue: string | null = matchedPlace.id || null;
        const placeMapsUri: string | null = matchedPlace.googleMapsURI || null;
        const rawReviews: PlaceReviewLike[] = Array.isArray(matchedPlace.reviews)
          ? (matchedPlace.reviews as PlaceReviewLike[])
          : [];

        const liveReviews: GoogleLiveReview[] = rawReviews
          .filter((rev: PlaceReviewLike) => Boolean((rev.originalText || rev.text || '').trim()))
          .map((rev: PlaceReviewLike, idx: number) => ({
            id: `google-live-${placeIdValue || 'place'}-${idx}`,
            authorName: rev.authorAttribution?.displayName || 'Google Reviewer',
            authorUri: rev.authorAttribution?.uri || null,
            authorPhotoUri: rev.authorAttribution?.photoURI || null,
            rating: Number(rev.rating) || 5,
            text: (rev.text || rev.originalText || '').trim(),
            relativeTime: rev.relativePublishTimeDescription || 'Google Review',
            googleMapsUri: rev.googleMapsURI || placeMapsUri,
          }));

        setGoogleLiveProfile({
          loaded: true,
          loading: false,
          error: null,
          placeId: matchedPlace.id || null,
          displayName: matchedPlace.displayName || null,
          rating: typeof matchedPlace.rating === 'number' ? matchedPlace.rating : null,
          userRatingCount:
            typeof matchedPlace.userRatingCount === 'number'
              ? matchedPlace.userRatingCount
              : null,
          googleMapsUri: matchedPlace.googleMapsURI || null,
          reviews: liveReviews,
        });
      } catch (err) {
        if (cancelled) return;
        if (isQuotaError(err)) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        const message = err instanceof Error ? err.message : 'Unable to sync live Google reviews.';
        setGoogleLiveProfile((prev) => ({
          ...prev,
          loaded: true,
          loading: false,
          error: message,
        }));
      }
    };

    void fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [placesLib, placeIdSetting, businessName, googleSyncNonce, setGoogleLiveProfile]);

  return null;
}
