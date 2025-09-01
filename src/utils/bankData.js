// src/utils/bankData.js
// Major banks configuration for supported countries

export const majorBanksByCountry = {
  // Kyrgyzstan (+996)
  'KG': {
    country: 'Kyrgyzstan',
    flag: '🇰🇬',
    code: '+996',
    banks: [
      { name: 'OJSC "Demir Kyrgyz International Bank"', shortName: 'DKIB', type: 'commercial' },
      { name: 'CJSC "Kyrgyzstan Commercial Bank"', shortName: 'KCB', type: 'commercial' },
      { name: 'OJSC "OptimaBanK"', shortName: 'OptimaBanK', type: 'commercial' },
      { name: 'CJSC "RSK Bank"', shortName: 'RSK Bank', type: 'commercial' },
      { name: 'CJSC "Kompanion Bank"', shortName: 'Kompanion', type: 'microfinance' },
      { name: 'OJSC "Aiyl Bank"', shortName: 'Aiyl Bank', type: 'development' },
      { name: 'CJSC "Bai-Tushum Bank"', shortName: 'Bai-Tushum', type: 'microfinance' },
      { name: 'OJSC "Halyk Bank Kyrgyzstan"', shortName: 'Halyk Bank', type: 'commercial' }
    ]
  },

  // Uzbekistan (+998)
  'UZ': {
    country: 'Uzbekistan',
    flag: '🇺🇿',
    code: '+998',
    banks: [
      { name: 'National Bank for Foreign Economic Activity', shortName: 'NBU', type: 'state' },
      { name: 'Uzpromstroybank', shortName: 'UzPSB', type: 'commercial' },
      { name: 'Asaka Bank', shortName: 'Asaka', type: 'commercial' },
      { name: 'Ipoteka Bank', shortName: 'Ipoteka', type: 'specialized' },
      { name: 'Hamkorbank', shortName: 'Hamkor', type: 'commercial' },
      { name: 'Mikrokreditbank', shortName: 'MKB', type: 'microfinance' },
      { name: 'Kapitalbank', shortName: 'Kapital', type: 'commercial' },
      { name: 'TuronBank', shortName: 'Turon', type: 'commercial' },
      { name: 'Uzagroexportbank', shortName: 'Uzagro', type: 'specialized' },
      { name: 'Aloqabank', shortName: 'Aloqa', type: 'commercial' }
    ]
  },

  // United States (+1)
  'US': {
    country: 'United States',
    flag: '🇺🇸',
    code: '+1',
    banks: [
      { name: 'JPMorgan Chase & Co.', shortName: 'Chase', type: 'commercial' },
      { name: 'Bank of America Corporation', shortName: 'Bank of America', type: 'commercial' },
      { name: 'Wells Fargo & Company', shortName: 'Wells Fargo', type: 'commercial' },
      { name: 'Citigroup Inc.', shortName: 'Citibank', type: 'commercial' },
      { name: 'U.S. Bancorp', shortName: 'US Bank', type: 'commercial' },
      { name: 'PNC Financial Services', shortName: 'PNC Bank', type: 'commercial' },
      { name: 'Goldman Sachs Group Inc.', shortName: 'Goldman Sachs', type: 'investment' },
      { name: 'Truist Financial Corporation', shortName: 'Truist', type: 'commercial' },
      { name: 'Capital One Financial Corp.', shortName: 'Capital One', type: 'commercial' },
      { name: 'TD Bank', shortName: 'TD Bank', type: 'commercial' }
    ]
  },

  // United Kingdom (+44)
  'GB': {
    country: 'United Kingdom',
    flag: '🇬🇧',
    code: '+44',
    banks: [
      { name: 'Lloyds Banking Group plc', shortName: 'Lloyds', type: 'commercial' },
      { name: 'Barclays plc', shortName: 'Barclays', type: 'commercial' },
      { name: 'HSBC Holdings plc', shortName: 'HSBC', type: 'commercial' },
      { name: 'NatWest Group plc', shortName: 'NatWest', type: 'commercial' },
      { name: 'Standard Chartered plc', shortName: 'Standard Chartered', type: 'commercial' },
      { name: 'Santander UK plc', shortName: 'Santander', type: 'commercial' },
      { name: 'Nationwide Building Society', shortName: 'Nationwide', type: 'building_society' },
      { name: 'TSB Bank plc', shortName: 'TSB', type: 'commercial' },
      { name: 'Virgin Money UK plc', shortName: 'Virgin Money', type: 'commercial' },
      { name: 'Metro Bank plc', shortName: 'Metro Bank', type: 'commercial' }
    ]
  },

  // Russia (+7)
  'RU': {
    country: 'Russia',
    flag: '🇷🇺',
    code: '+7',
    banks: [
      { name: 'Sberbank of Russia', shortName: 'Sberbank', type: 'state' },
      { name: 'VEB.RF', shortName: 'VEB', type: 'development' },
      { name: 'Gazprombank', shortName: 'Gazprombank', type: 'commercial' },
      { name: 'VTB Bank', shortName: 'VTB', type: 'state' },
      { name: 'Alfa-Bank', shortName: 'Alfa-Bank', type: 'commercial' },
      { name: 'Rosselkhozbank', shortName: 'Rosselkhoz', type: 'specialized' },
      { name: 'Promsvyazbank', shortName: 'PSB', type: 'commercial' },
      { name: 'FC Otkritie Bank', shortName: 'Otkritie', type: 'commercial' },
      { name: 'Sovcombank', shortName: 'Sovcom', type: 'commercial' },
      { name: 'Raiffeisenbank', shortName: 'Raiffeisen', type: 'commercial' }
    ]
  },

  // Kazakhstan (+7)
  'KZ': {
    country: 'Kazakhstan',
    flag: '🇰🇿',
    code: '+7',
    banks: [
      { name: 'Halyk Savings Bank of Kazakhstan', shortName: 'Halyk Bank', type: 'commercial' },
      { name: 'Kazkommertsbank', shortName: 'Kazkom', type: 'commercial' },
      { name: 'Sberbank Kazakhstan', shortName: 'Sberbank KZ', type: 'commercial' },
      { name: 'ForteBank', shortName: 'Forte', type: 'commercial' },
      { name: 'ATFBank', shortName: 'ATF', type: 'commercial' },
      { name: 'Bank CenterCredit', shortName: 'CenterCredit', type: 'commercial' },
      { name: 'Jusan Bank', shortName: 'Jusan', type: 'commercial' },
      { name: 'Tsesnabank', shortName: 'Tsesna', type: 'commercial' },
      { name: 'Home Credit Bank Kazakhstan', shortName: 'Home Credit', type: 'commercial' },
      { name: 'Development Bank of Kazakhstan', shortName: 'DBK', type: 'development' }
    ]
  },

  // Tajikistan (+992)
  'TJ': {
    country: 'Tajikistan',
    flag: '🇹🇯',
    code: '+992',
    banks: [
      { name: 'National Bank of Tajikistan', shortName: 'NBT', type: 'central' },
      { name: 'Amonatbonk', shortName: 'Amonat', type: 'state' },
      { name: 'Orienbank', shortName: 'Orien', type: 'commercial' },
      { name: 'Eskhata Bank', shortName: 'Eskhata', type: 'commercial' },
      { name: 'Spitamen Bank', shortName: 'Spitamen', type: 'commercial' },
      { name: 'International Bank of Tajikistan', shortName: 'IBT', type: 'commercial' },
      { name: 'Agroinvestbank', shortName: 'Agroinvest', type: 'specialized' },
      { name: 'Tojiksodirotbank', shortName: 'TSB', type: 'commercial' },
      { name: 'First MicroFinance Bank', shortName: 'FMFB', type: 'microfinance' },
      { name: 'DC Bank Tajikistan', shortName: 'DC Bank', type: 'commercial' }
    ]
  }
};

// Bank types for categorization
export const bankTypes = {
  commercial: 'Commercial Bank',
  state: 'State Bank', 
  development: 'Development Bank',
  investment: 'Investment Bank',
  microfinance: 'Microfinance Institution',
  specialized: 'Specialized Bank',
  building_society: 'Building Society',
  central: 'Central Bank'
};

// Helper function to get banks by country code
export const getBanksByCountryCode = (phoneCode) => {
  const countryMap = {
    '+996': 'KG',
    '+998': 'UZ', 
    '+1': 'US',
    '+44': 'GB',
    '+7': ['RU', 'KZ'], // Handle multiple countries with same code
    '+992': 'TJ'
  };
  
  const countryCode = countryMap[phoneCode];
  
  if (Array.isArray(countryCode)) {
    // Return both Russia and Kazakhstan banks for +7
    return countryCode.map(code => majorBanksByCountry[code]);
  }
  
  return countryCode ? majorBanksByCountry[countryCode] : null;
};

// Helper function to get all unique banks (for search/autocomplete)
export const getAllBanks = () => {
  const allBanks = [];
  Object.values(majorBanksByCountry).forEach(countryData => {
    countryData.banks.forEach(bank => {
      allBanks.push({
        ...bank,
        country: countryData.country,
        flag: countryData.flag,
        code: countryData.code
      });
    });
  });
  
  return allBanks.sort((a, b) => a.name.localeCompare(b.name));
};

// Helper function to search banks by name
export const searchBanks = (query, countryFilter = null) => {
  const allBanks = getAllBanks();
  const filtered = countryFilter 
    ? allBanks.filter(bank => bank.code === countryFilter)
    : allBanks;
    
  return filtered.filter(bank => 
    bank.name.toLowerCase().includes(query.toLowerCase()) ||
    bank.shortName.toLowerCase().includes(query.toLowerCase())
  );
};

export default majorBanksByCountry;