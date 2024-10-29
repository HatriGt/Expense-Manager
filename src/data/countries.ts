export interface Country {
  name: string;
  code: string;
  dial_code: string;
  flag: string;
}

export const countries: Country[] = [
  { name: 'United States', code: 'US', dial_code: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', dial_code: '+44', flag: '🇬🇧' },
  { name: 'India', code: 'IN', dial_code: '+91', flag: '🇮🇳' },
  { name: 'Afghanistan', code: 'AF', dial_code: '+93', flag: '🇦🇫' },
  { name: 'Albania', code: 'AL', dial_code: '+355', flag: '🇦🇱' },
  { name: 'Algeria', code: 'DZ', dial_code: '+213', flag: '🇩🇿' },
  { name: 'Argentina', code: 'AR', dial_code: '+54', flag: '🇦🇷' },
  { name: 'Australia', code: 'AU', dial_code: '+61', flag: '🇦🇺' },
  { name: 'Austria', code: 'AT', dial_code: '+43', flag: '🇦🇹' },
  { name: 'Bangladesh', code: 'BD', dial_code: '+880', flag: '🇧🇩' },
  { name: 'Belgium', code: 'BE', dial_code: '+32', flag: '🇧🇪' },
  { name: 'Brazil', code: 'BR', dial_code: '+55', flag: '🇧🇷' },
  { name: 'Canada', code: 'CA', dial_code: '+1', flag: '🇨🇦' },
  { name: 'China', code: 'CN', dial_code: '+86', flag: '🇨🇳' },
  { name: 'France', code: 'FR', dial_code: '+33', flag: '🇫🇷' },
  { name: 'Germany', code: 'DE', dial_code: '+49', flag: '🇩🇪' },
  { name: 'Italy', code: 'IT', dial_code: '+39', flag: '🇮🇹' },
  { name: 'Japan', code: 'JP', dial_code: '+81', flag: '🇯🇵' },
  { name: 'Mexico', code: 'MX', dial_code: '+52', flag: '🇲🇽' },
  { name: 'Netherlands', code: 'NL', dial_code: '+31', flag: '🇳🇱' },
  { name: 'New Zealand', code: 'NZ', dial_code: '+64', flag: '🇳🇿' },
  { name: 'Pakistan', code: 'PK', dial_code: '+92', flag: '🇵🇰' },
  { name: 'Russia', code: 'RU', dial_code: '+7', flag: '🇷🇺' },
  { name: 'Saudi Arabia', code: 'SA', dial_code: '+966', flag: '🇸🇦' },
  { name: 'Singapore', code: 'SG', dial_code: '+65', flag: '🇸🇬' },
  { name: 'South Africa', code: 'ZA', dial_code: '+27', flag: '🇿🇦' },
  { name: 'South Korea', code: 'KR', dial_code: '+82', flag: '🇰🇷' },
  { name: 'Spain', code: 'ES', dial_code: '+34', flag: '🇪🇸' },
  { name: 'Sweden', code: 'SE', dial_code: '+46', flag: '🇸🇪' },
  { name: 'Switzerland', code: 'CH', dial_code: '+41', flag: '🇨🇭' },
  // Add more countries as needed
];
