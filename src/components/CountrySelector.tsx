import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Country, countries } from '../data/countries';

interface CountrySelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function CountrySelector({ value, onChange, disabled }: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredCountries = countries.filter(country => 
    country.name.toLowerCase().includes(search.toLowerCase()) ||
    country.dial_code.includes(search) ||
    country.code.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCountry = countries.find(c => c.dial_code === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 border rounded-md ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-indigo-500'
        }`}
      >
        <span className="flex items-center">
          <span className="mr-2">{selectedCountry?.flag}</span>
          <span>{selectedCountry?.dial_code}</span>
        </span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-64 mt-1 bg-white rounded-md shadow-lg border"
          >
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-8 pr-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="Search countries..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    onChange(country.dial_code);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full flex items-center px-4 py-2 hover:bg-gray-100 ${
                    value === country.dial_code ? 'bg-indigo-50' : ''
                  }`}
                >
                  <span className="mr-3 text-xl">{country.flag}</span>
                  <span className="flex-1 text-left">{country.name}</span>
                  <span className="text-gray-400">{country.dial_code}</span>
                </button>
              ))}
              {filteredCountries.length === 0 && (
                <div className="px-4 py-2 text-gray-500 text-center">
                  No countries found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
