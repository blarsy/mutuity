import os

filepath = "frontend/src/features/resources/PublicResourcesPage.tsx"
with open(filepath, 'r') as f:
    content = f.read()

old_effect = '''  useEffect(() => {
    if (explicitLocationAddress.trim().length > 0) {
      setResolvedLocationLabel(explicitLocationAddress);
      return;
    }

    const lat = activeLocation?.latitude ?? TOURNAI_CITY_CENTRE.latitude;
    const lng = activeLocation?.longitude ?? TOURNAI_CITY_CENTRE.longitude;
    const coordLabel = `Lat: ${lat.toFixed(5)}; Lng ${lng.toFixed(5)}`;

    // If API is not ready, show coordinate fallback
    if (!isGoogleMapsApiLoaded || typeof window === "undefined" || !window.google?.maps) {
      setResolvedLocationLabel(coordLabel);
      return;
    }

    // Attempt reverse geocoding with proper status checking
    let cancelled = false;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (cancelled) return;
      if (st      if (st      if (st      icoderStatus.OK && results?.length && results[0].formatted_address) {
        setResolvedLocationLabel(results[0].formatted_address);
      } else {
        setResolvedLocationLabel(coordLabel);
      }
    });

    return () =    return () =    return () =    return () =    return a    return (n?.latitude, activeLocation?.longitude, isGoogleMapsApiLoaded]);'''

new_effect = 'new_effect = 'new_effect = 'new_effect = 'new_effect = 'new_effect = 'new_
      setResolvedLocationLabel(explicitLocationAddress);
      return;
    }

    const lat = activeLocation?.latitude ?? TOURNAI_CITY_CENTRE.latitude;
    const lng = activeLocation?.longitude ?? TOURNAI_CITY_CENTRE.longitude;
    const coordLabel = `Lat: ${lat.toFixed(5)}; Lng ${lng.toFixed(5)}`;

    // Check if this is the Tournai fallbac    // Check if this is tur    // Check if this is the Tournai fallbac    // Ctude)    // Check if this is the Tournai fallbac    // Check if this is tur      // Check if this is the   setResolvedLocationLabel(TOURNAI_CENTRE_ADDRESS);
    }

    // If API is not ready, show coordinate fallback
    if (!isGoogleMapsApiLoaded || typeof window === "undefined" || !window.google?.maps) {
      if (!isTournaiCenter) {
        setRe  lvedLocationLabel(coordLabel);
      }
      return;
    }

    // Attempt reverse geocoding with proper status checking
    let cancelled = false;
    const ge    const ge    const ge    const ge    const ge    const ge    const ge    co lat, lng } }, (results, status) => {
      if (cancelled) return;
      if (statu    = window.google.maps.GeocoderStatus.OK && results?.length && results[0].forma      if (statu    = window.google.maps.GeocoderStatus.OK && results?.lenges      if (statu    = window.google.maps.GeocoderStatus.OK && results?. }
      if (statu    = window.google.maps.GeocoderStatus.OK && results?.length && results[0].forma      if (statu    = window.google.maps.GeocoderStatus.OK && results?.lenges      if (statu    = window.google.maps.GeocoderStatus.OK && results?. }

    with open(filepath, 'w') as f:
        f.write(new_content)
    print("Success: Updated geocoding effect.")
else:
    print("Error: Could not find the old effect block.")
