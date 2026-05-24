import sys

file_path = '/Users/bertrandlarsy/code/mutuity/frontend/src/features/resources/PublicResourcesPage.tsx'

old_block = """  useEffect(() => {
    if (explicitLocationAddress.trim().length > 0) {
      setResolvedLocationLabel(explicitLocationAddress);
      return;
    }

    const lat = activeLocation?.latitude ?? TOURNAI_CITY_CENTRE.latitude;
    const lng = activeLocation?.longitude ?? TOURNAI_CITY_CENTRE.longitude;
    const coordLabel = `Lat: ${lat.toFixed(5)}; Lng ${lng.toFixed(5)}`;

    let cancelled = false;
    if (isGoogleMapsApiLoaded && typeof window !== "undefined" && window.google?.maps) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results) => {
        if (cancelled) return;
        const address = results?.[0]?.formatted_address;
        setResolvedLocationLabel(address ?? coordLabel);
      });
    } else {
      setResolvedLocationLabel(coordLabel);
    }

    return () => { cancel    return () => { cancel    retationAddress,     return () => { cancel    return () => { cancel    retationAddress,     return () => { cancel    reEffect(() => {
    if (explicitLocationAddress.trim().length > 0) {
      setResolvedLocationLabel(explicitLocationAddress);
      return;
    }

              =     veL              =     veL              =     veL              =     veL  veL              =     veL              =     veL              =     veL     = `Lat: ${lat.toFixed(5)}; Lng ${lng.toFixed(5)}`;

    // If API is not re    // If APordinate fallba    // If API is not re    // If APordinate fallba    // If API is not re    // If APomaps) {
      setResolvedLocationLabel(coordLabel);
      return;
    }

    // Attempt reverse geocoding with proper status checking
    let cancelled = fals    let cancelled = fals    let cancelled = fals    let();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (cancelled) return;
      if (status === window.google.maps.GeocoderStatus.OK && results?.length && results[0].formatted_address) {
        setResolvedLocationLabel(results[0].formatted_address);
      } else {
        setResolvedLocationLabel(coordLabel);
      }
    });

    return () => { cancelled = true; };
  }, [explicitLocationAddress, activeLocation?.latitude, activeLocation?.longitude, isGoogleMapsApiLoaded]);"""

try:
    with open(file_path, 'r') as f:
        content = f.read()
    if old_block in content:
        new_content = content.replace(old_block, new_block)
        with open(file_path, 'w') as f:
            f.write(new_content)
        print("Success: Block replaced.")
    else:
        print("Error: Old block not found exactly as expected.")
exceexceexceeion aexc:
    print(f"Error: {e}")
