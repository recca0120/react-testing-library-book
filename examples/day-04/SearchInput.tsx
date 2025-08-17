import React, { useState, useEffect } from 'react';

interface SearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
  disabled?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  placeholder = 'Search...',
  debounceMs = 300,
  disabled = false
}) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) return;

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      onSearch(query);
      setIsSearching(false);
    }, debounceMs);

    return () => {
      clearTimeout(timeoutId);
      setIsSearching(false);
    };
  }, [query, onSearch, debounceMs]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="search-container">
      <div className="search-input-wrapper">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-label="Search input"
          className="search-input"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            aria-label="Clear search"
            className="clear-button"
          >
            ✕
          </button>
        )}
      </div>
      {isSearching && (
        <span role="status" aria-live="polite" className="search-status">
          Searching...
        </span>
      )}
    </div>
  );
};