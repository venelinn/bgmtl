"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useGoogleMapsScript } from "@/hooks/useGoogleMapsScript";
import useLocalStorage from "@/hooks/useLocalStorage";
import { Icon } from "../Icon";
import { Dropdown } from "./Dropdown";
import styles from "./Search.module.scss";

type SearchProps = {
  onSearch?: (value: { label: string; lat: number; lng: number }) => void;
  initialValue?: string;
  lang?: string;
  showNavigationOnSearch?: boolean;
};

type SearchResult = {
  label: string;
  lat: number;
  lng: number;
};

type Prediction = {
  description: string;
  place_id: string;
};

export const Search = ({ onSearch, initialValue = "", lang = "en", showNavigationOnSearch = true }: SearchProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const router = useRouter();

  const [value, setValue] = useState(initialValue);
  const [searchData, setSearchData] = useState<SearchResult | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showRecent, setShowRecent] = useState(false);
  const [recentSearches, setRecentSearches] = useLocalStorage("recentSearches", []);
  const [currentLocation, setCurrentLocation] = useLocalStorage("userCurrentLocation", null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const isGoogleMapsLoaded = useGoogleMapsScript();

  // Initialize Google Places services
  useEffect(() => {
    setIsMounted(true);
    if (!isGoogleMapsLoaded || !window.google) return;

    autocompleteServiceRef.current = new google.maps.places.AutocompleteService();

    // PlacesService requires a DOM element
    const div = document.createElement("div");
    placesServiceRef.current = new google.maps.places.PlacesService(div);
  }, [isGoogleMapsLoaded]);

  // Fetch predictions when user types
  useEffect(() => {
    if (!value || !autocompleteServiceRef.current || value === initialValue) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    // Hide recent searches when user starts typing
    setShowRecent(false);

    const request = {
      input: value,
      types: ["(regions)"],
    };

    autocompleteServiceRef.current.getPlacePredictions(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        setPredictions(results);
        setShowDropdown(true);
        setSelectedIndex(-1);
      } else {
        setPredictions([]);
        setShowDropdown(false);
      }
    });
  }, [value, initialValue]);

  // Handle current location request
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationData = {
          lat: latitude,
          lng: longitude,
          timestamp: Date.now(),
        };
        setCurrentLocation(locationData);
        setIsGettingLocation(false);

        // Optionally show a success message or visual feedback
        if (inputRef.current) {
          inputRef.current.placeholder = "Current location set ✓";
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.placeholder = "Pick a destination for your boating trip";
            }
          }, 2000);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        let errorMessage = "Unable to get your location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      },
    );
  };

  // Handle prediction selection
  const handleSelectPrediction = (prediction: Prediction) => {
    if (!placesServiceRef.current) return;

    const request = {
      placeId: prediction.place_id,
      fields: ["geometry", "name", "formatted_address"],
    };

    placesServiceRef.current.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        // Extract just the main part before comma
        const label = prediction.description.split(",")[0];

        setValue(label);
        setShowDropdown(false);
        setPredictions([]);

        const searchResult = { label, lat, lng };
        setSearchData(searchResult);

        // Save to recent searches
        const recentSearch = {
          description: prediction.description,
          place_id: prediction.place_id,
        };
        const updatedRecent = [recentSearch, ...recentSearches.filter((s) => s.place_id !== prediction.place_id)].slice(
          0,
          5,
        );
        setRecentSearches(updatedRecent);

        if (onSearch) {
          onSearch(searchResult);
        }

        // Auto-submit after selecting from autocomplete
        if (showNavigationOnSearch) {
          const encodedLocation = encodeURIComponent(label);
          const params = new URLSearchParams({
            lat: lat.toString(),
            lng: lng.toString(),
          }).toString();

          const url =
            lang === "en" ? `/search/${encodedLocation}?${params}` : `/${lang}/search/${encodedLocation}?${params}`;

          setTimeout(() => {
            router.push(url);
          }, 300);
        }
      }
    });
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || predictions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev < predictions.length - 1 ? prev + 1 : prev));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && predictions[selectedIndex]) {
          handleSelectPrediction(predictions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setPredictions([]);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!showNavigationOnSearch || !searchData) return;

    const encodedLocation = encodeURIComponent(searchData.label);
    const params = new URLSearchParams({
      lat: searchData.lat.toString(),
      lng: searchData.lng.toString(),
    }).toString();

    const url = lang === "en" ? `/search/${encodedLocation}?${params}` : `/${lang}/search/${encodedLocation}?${params}`;
    router.push(url);
  };

  return (
    <form className={styles.search} onSubmit={handleSubmit}>
      <Icon name="MapPin" size="1.5em" className={styles.icon} />

      <div className={styles.autocompleteWrapper}>
        <input
          ref={inputRef}
          type="text"
          placeholder="Pick a destination for your boating trip"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (!value && recentSearches.length > 0) {
              setShowRecent(true);
              setPredictions(recentSearches);
              setShowDropdown(true);
            }
          }}
          className={styles.input}
          autoComplete="off"
        />

        <button
          type="button"
          onClick={handleGetCurrentLocation}
          className={styles.locationButton}
          title={isMounted && currentLocation ? "Update current location" : "Use current location"}
          disabled={isGettingLocation}
        >
          <Icon
            name={isGettingLocation ? "Loader2" : "Navigation"}
            size="1.25em"
            className={`${styles.locationIcon} ${isGettingLocation ? styles.spinning : ""} ${
              isMounted && currentLocation ? styles.active : ""
            }`}
          />
        </button>

        {showDropdown && predictions.length > 0 && (
          <Dropdown
            predictions={predictions}
            selectedIndex={selectedIndex}
            onSelectPrediction={handleSelectPrediction}
            onMouseEnter={setSelectedIndex}
            dropdownRef={dropdownRef as React.RefObject<HTMLDivElement>}
            isRecent={showRecent}
          />
        )}
      </div>

      <button type="submit" className={styles.button}>
        Search
      </button>
    </form>
  );
};
