// src/components/auth/FinancialOnboarding.js - Complete Version with Currency Selection
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, responsive, globalStyles } from '../../styles/globalStyles';
import LanguageSelector from '../common/LanguageSelector';
import { getBanksByCountryCode, searchBanks, bankTypes } from '../../utils/bankData';

// Currency data for supported countries only
const currencies = {
  popular: [
    { code: 'KGS', name: 'Kyrgyzstani Som', symbol: 'сом', flag: '🇰🇬' },
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
  ],
  all: [
    { code: 'KGS', name: 'Kyrgyzstani Som', symbol: 'сом', flag: '🇰🇬' },
    { code: 'UZS', name: 'Uzbekistani Som', symbol: 'сўм', flag: '🇺🇿' },
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽', flag: '🇷🇺' },
    { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', flag: '🇰🇿' },
    { code: 'TJS', name: 'Tajikistani Somoni', symbol: 'ЅМ', flag: '🇹🇯' },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  ]
};

// Complete translation object with currency translations
const translations = {
  en: {
    setupFinances: 'Set Up Your Finances',
    chooseMethod: 'Choose how you\'d like to get started',
    selectCurrency: 'Select Currency',
    chooseCurrency: 'Choose your preferred currency',
    currencyDescription: 'This will be used throughout the app for displaying amounts',
    searchCurrencies: 'Search currencies...',
    popularCurrencies: 'Popular Currencies',
    allCurrencies: 'All Currencies',
    currency: 'Currency',
    uploadBankStatements: 'Upload Bank Statements',
    uploadDescription: '• Upload PDFs or take photos\n• Automatic transaction extraction\n• Personalized budget creation\n• Most accurate setup',
    recommended: 'Recommended',
    manualEntry: 'Manual Entry',
    manualDescription: '• Enter transactions manually\n• Quick setup with presets\n• Add more details later\n• Perfect for getting started',
    supportedFormats: 'Supported Formats:',
    formatsList: 'PDF • CSV • Photos • Documents',
    secureProcessing: 'All data processed securely on your device',
    uploadDocuments: 'Upload Documents',
    addBankStatements: 'Add your bank statements or financial documents',
    tapToAdd: 'Tap to add files',
    fileTypes: 'Photos, PDFs, CSV files',
    processFiles: 'Process Files',
    skipToManual: 'Manual Entry Instead',
    addTransactions: 'Add Your Transactions',
    enterIncomeExpenses: 'Enter your income and expenses',
    quickAddCategory: 'Quick Add by Category:',
    tapCategoryHint: 'Tap a category to add your own amount',
    customTransaction: 'Add Custom Transaction:',
    description: 'Description',
    descriptionPlaceholder: 'e.g., Grocery shopping',
    amount: 'Amount',
    category: 'Category',
    addTransaction: 'Add Transaction',
    addedTransactions: 'Added Transactions',
    continueWith: 'Continue with transactions',
    income: 'Income',
    salary: 'Salary/Income',
    additionalIncome: 'Additional Income',
    food: 'Food',
    foodGroceries: 'Food & Groceries',
    transportation: 'Transportation',
    transportGas: 'Transport/Gas',
    housing: 'Housing',
    rentHousing: 'Rent/Housing',
    utilities: 'Utilities',
    billsUtilities: 'Bills/Utilities',
    shopping: 'Shopping',
    entertainment: 'Entertainment',
    healthcare: 'Healthcare',
    healthMedical: 'Health/Medical',
    other: 'Other',
    enterIncome: 'Enter your income',
    enterAdditionalIncome: 'Freelance, side business, etc.',
    foodExpenses: 'Food expenses',
    transportExpenses: 'Transport costs',
    housingExpenses: 'Housing costs',
    utilityBills: 'Utility bills',
    shoppingExpenses: 'Shopping expenses',
    funActivities: 'Fun activities',
    medicalExpenses: 'Medical expenses',
    processingData: 'Processing Your Data',
    uploadingFiles: 'Uploading files...',
    processingDocuments: 'Processing documents...',
    analyzingTransactions: 'Analyzing transactions...',
    creatingBudget: 'Creating budget...',
    generatingRecommendations: 'Generating recommendations...',
    complete: 'Complete!',
    files: 'Files',
    transactions: 'Transactions',
    setupComplete: 'Setup Complete!',
    profileReady: 'Your financial profile is ready',
    monthlyOverview: 'Monthly Overview',
    incomeLabel: 'Income:',
    expensesLabel: 'Expenses:',
    availableForSavings: 'Available for Savings:',
    whatsNext: 'What\'s Next?',
    setBudgets: '✓ Set up budgets for each category',
    createGoals: '✓ Create savings goals',
    trackHabits: '✓ Track your spending habits',
    getInsights: '✓ Get personalized insights',
    startUsing: 'Start Using Akchabar',
    enterAmount: 'Enter amount',
    tapToEnterAmount: 'Tap to enter amount',
    cancel: 'Cancel',
    connectBank: 'Connect Bank Account',
    bankDescription: '• Secure bank API connection\n• Automatic transaction sync\n• Real-time updates\n• Most convenient setup',
    workingOnIt: 'We\'re working on this feature',
    comingSoon: 'Coming Soon',
    step: 'Step',
    of: 'of',
    noFiles: 'No Files',
    addAtLeastOne: 'Please add at least one file',
    noTransactions: 'No Transactions',
    missingInfo: 'Missing Information',
    enterDescAmount: 'Please enter description and amount',
    invalidAmount: 'Invalid Amount',
    enterValidNumber: 'Please enter a valid number',
    saveFailed: 'Save Failed',
    couldNotSave: 'Could not save transactions. Please try again.',
    processingFailed: 'Processing Failed',
    remove: 'Remove',
    unknownSize: 'Unknown size',
    addCustomTransaction: 'Add Custom Transaction',
    commercialBank: 'Commercial Bank',
    stateBank: 'State Bank',
    developmentBank: 'Development Bank',
    investmentBank: 'Investment Bank',
    microfinanceInstitution: 'Microfinance Institution',
    specializedBank: 'Specialized Bank',
    buildingSociety: 'Building Society',
    centralBank: 'Central Bank',
  },
  ru: {
    connectBank: 'Подключить банковский счет',
    bankDescription: '• Безопасное подключение через API банка\n• Автоматическая синхронизация транзакций\n• Обновления в реальном времени\n• Наиболее удобная настройка',
    workingOnIt: 'Мы работаем над этой функцией',
    comingSoon: 'Скоро будет доступно',
    selectCurrency: 'Выберите валюту',
    chooseCurrency: 'Выберите предпочитаемую валюту',
    currencyDescription: 'Эта валюта будет использоваться в приложении для отображения сумм',
    searchCurrencies: 'Поиск валют...',
    popularCurrencies: 'Популярные валюты',
    allCurrencies: 'Все валюты',
    currency: 'Валюта',
    setupFinances: 'Настройка ваших финансов',
    chooseMethod: 'Выберите наиболее подходящий вариант',
    uploadBankStatements: 'Загрузить банковские выписки',
    uploadDescription: '• Загрузите PDF или сделайте фото\n• Автоматическое извлечение транзакций\n• Персонализированное создание бюджета\n• Наиболее точная настройка',
    recommended: 'Рекомендуется',
    manualEntry: 'Ручной ввод',
    manualDescription: '• Вводите транзакции вручную\n• Быстрая настройка с шаблонами\n• Добавляйте детали позже\n• Идеально для начала работы',
    supportedFormats: 'Поддерживаемые форматы:',
    formatsList: 'PDF • CSV • Фото • Документы',
    secureProcessing: 'Все данные обрабатываются безопасно на вашем устройстве',
    uploadDocuments: 'Загрузить документы',
    addBankStatements: 'Добавьте банковские выписки или финансовые документы',
    tapToAdd: 'Нажмите для добавления файлов',
    fileTypes: 'Фото, PDF, CSV файлы',
    processFiles: 'Обработать файлы',
    skipToManual: 'Пропустить - Ручной ввод',
    addTransactions: 'Добавить транзакции',
    enterIncomeExpenses: 'Введите ваши доходы и расходы',
    quickAddCategory: 'Быстрое добавление по категориям:',
    tapCategoryHint: 'Нажмите на категорию, чтобы ввести сумму',
    customTransaction: 'Добавить пользовательскую транзакцию:',
    description: 'Описание',
    descriptionPlaceholder: 'напр., покупка продуктов',
    amount: 'Сумма',
    category: 'Категория',
    addTransaction: 'Добавить транзакцию',
    addedTransactions: 'Добавленные транзакции',
    continueWith: 'Продолжить с транзакциями',
    income: 'Доход',
    salary: 'Зарплата/Доход',
    food: 'Еда',
    foodGroceries: 'Еда и продукты',
    transportation: 'Транспорт',
    transportGas: 'Транспорт/Бензин',
    housing: 'Жилье',
    rentHousing: 'Аренда/Жилье',
    utilities: 'Услуги',
    billsUtilities: 'Счета/Коммуналка',
    shopping: 'Покупки',
    entertainment: 'Развлечения',
    healthcare: 'Здоровье',
    healthMedical: 'Здоровье/Медицина',
    other: 'Другое',
    enterIncome: 'Введите ваш доход',
    foodExpenses: 'Расходы на еду',
    transportExpenses: 'Транспортные расходы',
    housingExpenses: 'Расходы на жилье',
    utilityBills: 'Коммунальные счета',
    shoppingExpenses: 'Расходы на покупки',
    funActivities: 'Развлекательные мероприятия',
    medicalExpenses: 'Медицинские расходы',
    processingData: 'Обработка ваших данных',
    uploadingFiles: 'Загрузка файлов...',
    processingDocuments: 'Обработка документов...',
    analyzingTransactions: 'Анализ транзакций...',
    creatingBudget: 'Создание бюджета...',
    generatingRecommendations: 'Создание рекомендаций...',
    complete: 'Готово!',
    files: 'Файлы',
    transactions: 'Транзакции',
    setupComplete: 'Настройка завершена!',
    profileReady: 'Ваш финансовый профиль готов',
    monthlyOverview: 'Месячный обзор',
    incomeLabel: 'Доход:',
    expensesLabel: 'Расходы:',
    availableForSavings: 'Доступно для сбережений:',
    whatsNext: 'Что дальше?',
    setBudgets: '✓ Настроить бюджеты для каждой категории',
    createGoals: '✓ Создать цели сбережений',
    trackHabits: '✓ Отслеживать привычки трат',
    getInsights: '✓ Получать персонализированные советы',
    startUsing: 'Начать использовать Akchabar',
    enterAmount: 'Введите сумму',
    tapToEnterAmount: 'Нажмите для ввода суммы',
    cancel: 'Отмена',
    step: 'Шаг',
    of: 'из',
    noFiles: 'Нет файлов',
    addAtLeastOne: 'Пожалуйста, добавьте хотя бы один файл',
    noTransactions: 'Нет транзакций',
    missingInfo: 'Недостающая информация',
    enterDescAmount: 'Пожалуйста, введите описание и сумму',
    invalidAmount: 'Неверная сумма',
    enterValidNumber: 'Пожалуйста, введите действительное число',
    saveFailed: 'Сохранение не удалось',
    couldNotSave: 'Не удалось сохранить транзакции. Попробуйте еще раз.',
    processingFailed: 'Обработка не удалась',
    remove: 'Удалить',
    unknownSize: 'Неизвестный размер',
    addCustomTransaction: 'Добавить пользовательскую транзакцию',
    commercialBank: 'Коммерческий банк',
    stateBank: 'Государственный банк',
    developmentBank: 'Банк развития',
    investmentBank: 'Инвестиционный банк',
    microfinanceInstitution: 'Микрофинансовая организация',
    specializedBank: 'Специализированный банк',
    buildingSociety: 'Строительное общество',
    centralBank: 'Центральный банк',
  },
  ky: {
    connectBank: 'Банк эсебин туташтыруу',
    bankDescription: '• Банктын API аркылуу коопсуз туташуу\n• Автоматтык транзакция синхрондоо\n• Реалдуу убакытта жаңылануулар\n• Эң ыңгайлуу орнотуу',
    workingOnIt: 'Биз бул функция боюнча иштеп жатабыз',
    comingSoon: 'Жакында жеткиликтүү болот',
    selectCurrency: 'Валютаны тандоо',
    chooseCurrency: 'Сиздин валютаңызды тандаңыз',
    currencyDescription: 'Бул валюта колдонмодо сумманы көрсөтүү үчүн колдонулат',
    searchCurrencies: 'Валюталарды издөө...',
    popularCurrencies: 'Популярдуу валюталар',
    allCurrencies: 'Бардык валюталар',
    currency: 'Валюта',
    setupFinances: 'Каржыңызды орнотуу',
    chooseMethod: 'Өзүңүзгө эң ылайыктуу вариантты тандаңыз',
    uploadBankStatements: 'Банк отчеттарын жүктөө',
    uploadDescription: '• PDF жүктөңүз же сүрөт тартыңыз\n• Автоматтык транзакция алуу\n• Жекелештирилген бюджет түзүү\n• Эң так туураноо',
    recommended: 'Сунушталат',
    manualEntry: 'Кол менен киргизүү',
    manualDescription: '• Транзакцияларды кол менен киргизиңиз\n• Үлгүлөр менен тез орнотуу\n• Кийинчерээк деталдарды кошуңуз\n• Баштоо үчүн эң жакшы',
    supportedFormats: 'Колдоого алынган форматтар:',
    formatsList: 'PDF • CSV • Сүрөттөр • Документтер',
    secureProcessing: 'Бардык маалыматтарыңыз түзмөгүңүздө коопсуз иштетилет',
    uploadDocuments: 'Документтерди жүктөө',
    addBankStatements: 'Банк отчёттарын же каржы документтерин кошуңуз',
    tapToAdd: 'Файлдарды кошуу үчүн басыңыз',
    fileTypes: 'Сүрөттөр, PDF, CSV файлдар',
    processFiles: 'Файлдарды иштетүү',
    skipToManual: 'Өткөрүп жиберүү - Кол менен киргизүү',
    addTransactions: 'Транзакцияларды кошуу',
    enterIncomeExpenses: 'Киреше жана чыгашаларыңызды киргизиңиз',
    quickAddCategory: 'Категория боюнча тез кошуу:',
    tapCategoryHint: 'Сумманы киргизүү үчүн категорияны басыңыз',
    customTransaction: 'Жеке транзакция кошуу:',
    description: 'Сүрөттөө',
    descriptionPlaceholder: 'мис., азык-түлүк сатып алуу',
    amount: 'Сумма',
    category: 'Категория',
    addTransaction: 'Транзакция кошуу',
    addedTransactions: 'Кошулган транзакциялар',
    continueWith: 'Транзакциялар менен улантуу',
    income: 'Киреше',
    salary: 'Айлык/Киреше',
    food: 'Тамак',
    foodGroceries: 'Тамак-аш жана продукттар',
    transportation: 'Транспорт',
    transportGas: 'Транспорт/Бензин',
    housing: 'Турак жай',
    rentHousing: 'Ижара/Турак жай',
    utilities: 'Кызматтар',
    billsUtilities: 'Эсептер/Коммуналдык',
    shopping: 'Соода',
    entertainment: 'Көңүл ачуу',
    healthcare: 'Саламаттык',
    healthMedical: 'Саламаттык/Медицина',
    other: 'Башкалар',
    enterIncome: 'Кирешеңиздин киргизиңиз',
    foodExpenses: 'Тамакка чыгашалар',
    transportExpenses: 'Транспорт чыгашалары',
    housingExpenses: 'Турак жайга чыгашалар',
    utilityBills: 'Коммуналдык эсептер',
    shoppingExpenses: 'Соооодага чыгашалар',
    funActivities: 'Көңүл ачуучу иш-чаралар',
    medicalExpenses: 'Медициналык чыгашалар',
    processingData: 'Маалыматтарыңызды иштетүү',
    uploadingFiles: 'Файлдарды жүктөө...',
    processingDocuments: 'Документтерди иштетүү...',
    analyzingTransactions: 'Транзакцияларды талдоо...',
    creatingBudget: 'Бюджет түзүү...',
    generatingRecommendations: 'Сунуштарды түзүү...',
    complete: 'Даяр!',
    files: 'Файлдар',
    transactions: 'Транзакциялар',
    setupComplete: 'Орнотуу аякталды!',
    profileReady: 'Каржы профилиңиз даяр',
    monthlyOverview: 'Айлык карап чыгуу',
    incomeLabel: 'Киреше:',
    expensesLabel: 'Чыгашалар:',
    availableForSavings: 'Топтоо үчүн жеткиликтүү:',
    whatsNext: 'Кийинки кадам эмне?',
    setBudgets: '✓ Ар бир категория үчүн бюджет орнотуу',
    createGoals: '✓ Топтоо максаттарын түзүү',
    trackHabits: '✓ Чыгым адаттарын көзөмөлдөө',
    getInsights: '✓ Жекелештирилген кеңештерди алуу',
    startUsing: 'Akchabar колдонууну баштоо',
    enterAmount: 'Сумманы киргизиңиз',
    tapToEnterAmount: 'Сумманы киргизүү үчүн басыңыз',
    cancel: 'Жокко чыгаруу',
    step: 'кадам',
    of: 'дөн',
    noFiles: 'Файлдар жок',
    addAtLeastOne: 'Жок дегенде бир файл кошуңуз',
    noTransactions: 'Транзакциялар жок',
    missingInfo: 'Жетишпеген маалымат',
    enterDescAmount: 'Сүрөттөө жана сумманы киргизиңиз',
    invalidAmount: 'Туура эмес сумма',
    enterValidNumber: 'Туура санды киргизиңиз',
    saveFailed: 'Сактоо ишке ашкан жок',
    couldNotSave: 'Транзакцияларды сактоо мүмкүн эмес. Дагы аракет кылыңыз.',
    processingFailed: 'Иштетүү ишке ашкан жок',
    remove: 'Өчүрүү',
    unknownSize: 'Белгисиз өлчөм',
    addCustomTransaction: 'Жеке транзакция кошуу',
    commercialBank: 'Коммерциялык банк',
    stateBank: 'Мамлекеттик банк',
    developmentBank: 'Өнүктүрүү банкы',
    investmentBank: 'Инвестициялык банк',
    microfinanceInstitution: 'Микрокаржы уюму',
    specializedBank: 'Адистештирилген банк',
    buildingSociety: 'Курулуш коому',
    centralBank: 'Борбордук банк',
  }
};

const FinancialOnboarding = ({ navigation, user = null, completeAuth, language = 'en', setLanguage, authData = {} }) => {
  // Get translations for current language
  const t = translations[language] || translations.en;
  
  // State
  const [currentStep, setCurrentStep] = useState(0); // Start at 0 for currency selection
  const [slideAnim] = useState(new Animated.Value(0));
  const [progressAnim] = useState(new Animated.Value(0));
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [budget, setBudget] = useState(null);
  const [manualTransactions, setManualTransactions] = useState([]);
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    category: 'food',
    date: new Date().toISOString().split('T')[0]
  });
  const [quickEntryModal, setQuickEntryModal] = useState(null);
  const [quickAmount, setQuickAmount] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationType, setConfirmationType] = useState(null);
  const [confirmationData, setConfirmationData] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [showBankSearch, setShowBankSearch] = useState(false);
  const [detectedCountry, setDetectedCountry] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [financialGoals, setFinancialGoals] = useState([]);
  const [newGoal, setNewGoal] = useState({
    title: '',
    targetAmount: '',
    deadline: '',
    category: 'emergency_fund'
  });
  
  // Currency state
  const [selectedCurrency, setSelectedCurrency] = useState(null); // Start with null to force selection
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [currencySearchQuery, setCurrencySearchQuery] = useState('');
  
  // Get user profile from authData
  const userProfile = authData || {};
  const [selectedPlan] = useState(authData?.selectedPlan || 'basic');

  // Refs
  const descriptionInputRef = useRef(null);
  const amountInputRef = useRef(null);
  const quickAmountInputRef = useRef(null);

  const API_BASE = 'http://localhost:3000/api';

  // Country list from phone codes
  const supportedCountries = [
    { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬', phoneCode: '+996' },
    { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', phoneCode: '+998' },
    { code: 'US', name: 'United States', flag: '🇺🇸', phoneCode: '+1' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', phoneCode: '+44' },
    { code: 'RU', name: 'Russia', flag: '🇷🇺', phoneCode: '+7' },
    { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', phoneCode: '+7' },
    { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯', phoneCode: '+992' },
  ];

  // Plan limits configuration
  const PLAN_LIMITS = {
    basic: {
      transactions: -1,
      accounts: 1,
      budgets: -1,
      goals: -1,
      categories: -1,
      hasAI: false,
      canConnectBank: true
    },
    plus: {
      transactions: -1,
      accounts: 3,
      budgets: -1,
      goals: -1,
      categories: -1,
      hasAI: true,
      canConnectBank: true
    },
    pro: {
      transactions: -1,
      accounts: 5,
      budgets: -1,
      goals: -1,
      categories: -1,
      hasAI: true,
      canConnectBank: true
    }
  };

  const getCurrentPlanLimits = () => PLAN_LIMITS[selectedPlan] || PLAN_LIMITS.basic;

  const checkPlanLimits = (type, currentCount = 0, additionalCount = 1) => {
    return true;
  };

  const validateFileUpload = () => {
    return true;
  };

  // Currency helper functions
  const detectCurrencyFromCountry = (countryCode) => {
    const currencyMap = {
      'KG': 'KGS',
      'US': 'USD',
      'GB': 'GBP',
      'RU': 'RUB',
      'KZ': 'KZT',
      'UZ': 'UZS',
      'TJ': 'TJS',
    };
    return currencyMap[countryCode] || 'KGS';
  };

  const formatAmount = (amount, showSymbol = true) => {
    const currencyData = currencies.all.find(c => c.code === selectedCurrency);
    const symbol = currencyData?.symbol || '';
    const formattedAmount = Math.abs(amount).toLocaleString();
    
    if (showSymbol) {
      if (['KGS', 'RUB', 'UZS', 'TJS'].includes(selectedCurrency)) {
        return `${formattedAmount} ${symbol}`;
      }
      return `${symbol}${formattedAmount}`;
    }
    
    return formattedAmount;
  };

  const getFilteredCurrencies = (showAll = false) => {
    const currenciesToShow = showAll ? currencies.all : currencies.popular;
    
    if (!currencySearchQuery || !currencySearchQuery.trim()) {
      return currenciesToShow;
    }
    
    const query = currencySearchQuery.toLowerCase().trim();
    return currenciesToShow.filter(currency =>
      currency.name.toLowerCase().includes(query) ||
      currency.code.toLowerCase().includes(query) ||
      currency.symbol.toLowerCase().includes(query)
    );
  };

  const translateBankType = (bankType) => {
    const translations = {
      commercial: language === 'ru' ? t.commercialBank : language === 'ky' ? t.commercialBank : 'Commercial Bank',
      state: language === 'ru' ? t.stateBank : language === 'ky' ? t.stateBank : 'State Bank',
      development: language === 'ru' ? t.developmentBank : language === 'ky' ? t.developmentBank : 'Development Bank',
      investment: language === 'ru' ? t.investmentBank : language === 'ky' ? t.investmentBank : 'Investment Bank',
      microfinance: language === 'ru' ? t.microfinanceInstitution : language === 'ky' ? t.microfinanceInstitution : 'Microfinance Institution',
      specialized: language === 'ru' ? t.specializedBank : language === 'ky' ? t.specializedBank : 'Specialized Bank',
      building_society: language === 'ru' ? t.buildingSociety : language === 'ky' ? t.buildingSociety : 'Building Society',
      central: language === 'ru' ? t.centralBank : language === 'ky' ? t.centralBank : 'Central Bank'
    };
    return translations[bankType] || bankType;
  };

  useEffect(() => {
    requestPermissions();
    animateStep();
    
    // Try to detect country and currency from user profile or phone number
    let countryDetected = false;
    
    if (authData?.phoneNumber) {
      const phoneCode = authData.phoneNumber.match(/^\+\d{1,3}/)?.[0];
      if (phoneCode) {
        const countryBanks = getBanksByCountryCode(phoneCode);
        if (countryBanks) {
          setDetectedCountry(countryBanks);
          countryDetected = true;
          
          // Detect currency based on phone code
          const countryCode = supportedCountries.find(c => c.phoneCode === phoneCode)?.code;
          if (countryCode) {
            const detectedCurrency = detectCurrencyFromCountry(countryCode);
            setSelectedCurrency(detectedCurrency);
          }
        }
      }
    }
    
    if (!countryDetected) {
      setDetectedCountry(getBanksByCountryCode('+996'));
      setSelectedCurrency('KGS');
    }
  }, [currentStep, authData]);

  const requestPermissions = async () => {
    try {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
      await ImagePicker.requestCameraPermissionsAsync();
    } catch (error) {
      console.log('Permission request failed:', error);
    }
  };

  const animateStep = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: currentStep - 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: currentStep / 7,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const getAuthToken = async () => {
    try {
      return await AsyncStorage.getItem('userToken');
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  };

  const apiCall = async (endpoint, method = 'GET', data = null) => {
    try {
      const token = await getAuthToken();
      const config = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      };

      if (data && method !== 'GET') {
        config.body = JSON.stringify(data);
      }

      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  const pickFiles = async () => {
    Alert.alert(
      t.addCustomTransaction,
      t.chooseMethod,
      [
        { text: 'Take Photo', onPress: captureWithCamera },
        { text: 'Select Files', onPress: selectDocuments },
        { text: t.manualEntry, onPress: () => setCurrentStep(4) },
        { text: t.cancel, style: 'cancel' }
      ]
    );
  };

  const captureWithCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        addFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const selectDocuments = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'text/csv'],
        multiple: true,
        copyToCacheDirectory: true
      });

      if (!result.canceled) {
        const files = result.assets || [result];
        files.forEach(addFile);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select files');
    }
  };

  const addFile = (asset) => {
    const fileData = {
      id: Date.now() + Math.random(),
      name: asset.fileName || asset.name || `file_${Date.now()}`,
      uri: asset.uri,
      type: asset.mimeType || asset.type || 'unknown',
      size: asset.size || 0
    };

    setUploadedFiles(prev => [...prev, fileData]);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const processFiles = async () => {
    if (uploadedFiles.length === 0) {
      Alert.alert(t.noFiles, t.addAtLeastOne);
      return;
    }

    if (!validateFileUpload()) {
      return;
    }

    setConfirmationType('fileUpload');
    setConfirmationData({
      files: uploadedFiles,
      estimatedTransactions: uploadedFiles.length * 5,
      planLimit: getCurrentPlanLimits().transactions,
      currentPlan: selectedPlan
    });
    setShowConfirmation(true);
  };

  const confirmFileProcessing = async () => {
    setShowConfirmation(false);
    setCurrentStep(5);
  };

  const getQuickCategories = () => [
    {
      category: 'income',
      icon: '💰',
      name: t.salary,
      placeholder: t.enterIncome
    },
    {
      category: 'additional_income',
      icon: '💼',
      name: t.additionalIncome || 'Additional Income',
      placeholder: t.enterAdditionalIncome || 'Freelance, side business, etc.'
    },
    {
      category: 'food',
      icon: '🛒',
      name: t.foodGroceries,
      placeholder: t.foodExpenses
    },
    {
      category: 'transportation',
      icon: '⛽',
      name: t.transportGas,
      placeholder: t.transportExpenses
    },
    {
      category: 'housing',
      icon: '🏠',
      name: t.rentHousing,
      placeholder: t.housingExpenses
    },
    {
      category: 'utilities',
      icon: '💡',
      name: t.billsUtilities,
      placeholder: t.utilityBills
    },
    {
      category: 'shopping',
      icon: '🛍️',
      name: t.shopping,
      placeholder: t.shoppingExpenses
    },
    {
      category: 'entertainment',
      icon: '🎬',
      name: t.entertainment,
      placeholder: t.funActivities
    },
    {
      category: 'healthcare',
      icon: '🏥',
      name: t.healthMedical,
      placeholder: t.medicalExpenses
    }
  ];

  const getRegularCategories = () => [
    { key: 'income', icon: '💰', name: t.income },
    { key: 'additional_income', icon: '💼', name: t.additionalIncome || 'Additional Income' },
    { key: 'food', icon: '🛒', name: t.food },
    { key: 'transportation', icon: '⛽', name: t.transportation },
    { key: 'housing', icon: '🏠', name: t.housing },
    { key: 'shopping', icon: '🛍️', name: t.shopping },
    { key: 'entertainment', icon: '🎬', name: t.entertainment },
    { key: 'healthcare', icon: '🏥', name: t.healthcare },
    { key: 'utilities', icon: '💡', name: t.utilities },
    { key: 'other', icon: '💳', name: t.other }
  ];

  const handleDescriptionChange = useCallback((text) => {
    setNewTransaction(prev => ({
      ...prev,
      description: text
    }));
  }, []);

  const handleAmountChange = useCallback((text) => {
    const numericValue = text.replace(/[^0-9.]/g, '');
    setNewTransaction(prev => ({
      ...prev,
      amount: numericValue
    }));
  }, []);

  const handleQuickAmountChange = useCallback((text) => {
    const numericValue = text.replace(/[^0-9.]/g, '');
    setQuickAmount(numericValue);
  }, []);

  const handleCategorySelect = useCallback((categoryKey) => {
    setNewTransaction(prev => ({...prev, category: categoryKey}));
  }, []);

  const addManualTransaction = useCallback(() => {
    if (!newTransaction.description || !newTransaction.amount) {
      Alert.alert(t.missingInfo, t.enterDescAmount);
      return;
    }

    const amount = parseFloat(newTransaction.amount);
    if (isNaN(amount)) {
      Alert.alert(t.invalidAmount, t.enterValidNumber);
      return;
    }

    const transaction = {
      id: Date.now(),
      date: newTransaction.date,
      amount: (newTransaction.category === 'income' || newTransaction.category === 'additional_income') ? Math.abs(amount) : -Math.abs(amount),
      description: newTransaction.description,
      category: newTransaction.category,
      type: (newTransaction.category === 'income' || newTransaction.category === 'additional_income') ? 'income' : 'expense',
      confidence: 1.0
    };

    setManualTransactions(prev => [transaction, ...prev]);
    setNewTransaction({
      description: '',
      amount: '',
      category: 'food',
      date: new Date().toISOString().split('T')[0]
    });
  }, [newTransaction, t]);

  const removeManualTransaction = (id) => {
    setManualTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleCountrySelect = (countryCode) => {
    const countryData = getBanksByCountryCode(supportedCountries.find(c => c.code === countryCode)?.phoneCode);
    setSelectedCountry(countryData);
    setSelectedBank(null);
    setShowCountryModal(false);
    
    // Auto-update currency when country changes
    const detectedCurrency = detectCurrencyFromCountry(countryCode);
    if (!selectedCurrency) { // Only auto-set if no currency selected yet
      setSelectedCurrency(detectedCurrency);
    }
  };

  const getCurrentCountryName = () => {
    const countryToUse = selectedCountry || detectedCountry;
    if (countryToUse) {
      if (Array.isArray(countryToUse)) {
        return 'Russia & Kazakhstan';
      } else {
        return countryToUse.country;
      }
    }
    return 'Select Country';
  };

  const getAvailableBanks = () => {
    const countryToUse = selectedCountry || detectedCountry;
    
    if (countryToUse) {
      if (Array.isArray(countryToUse)) {
        return countryToUse.flatMap(country => country.banks.map(bank => ({
          ...bank,
          country: country.country,
          flag: country.flag
        })));
      } else {
        return countryToUse.banks.map(bank => ({
          ...bank,
          country: countryToUse.country,
          flag: countryToUse.flag
        }));
      }
    }
    
    return [];
  };

  const getFilteredBanks = () => {
    const banks = getAvailableBanks();
    if (!bankSearchQuery || !bankSearchQuery.trim()) return banks.slice(0, 8);
    
    const query = bankSearchQuery.toLowerCase().trim();
    return banks.filter(bank =>
      (bank.name && bank.name.toLowerCase().includes(query)) ||
      (bank.shortName && bank.shortName.toLowerCase().includes(query))
    );
  };

  const simulateBankConnection = async (bankData = null) => {
    const bank = bankData || selectedBank;
    
    Alert.alert(
      t.comingSoon,
      language === 'ru' 
        ? `Подключение к ${bank?.shortName || 'банку'} скоро будет доступно. Мы работаем над безопасной интеграцией с банками Кыргызстана.`
        : language === 'ky'
        ? `${bank?.shortName || 'Банкка'} туташуу жакында жеткиликтүү болот. Биз Кыргызстандын банктары менен коопсуз интеграция боюнча иштеп жатабыз.`
        : `Connection to ${bank?.shortName || 'this bank'} is coming soon. We're working on secure integration with Kyrgyzstan banks.`,
      [
        { 
          text: t.cancel, 
          style: 'cancel' 
        },
        { 
          text: language === 'ru' ? 'Попробовать позже' : language === 'ky' ? 'Кийинчерээк аракет кылыңыз' : 'Try Later',
          onPress: () => setCurrentStep(4)
        }
      ]
    );
  };

  const completeManualEntry = async () => {
    if (manualTransactions.length === 0) {
      Alert.alert(t.noTransactions, t.addAtLeastOne);
      return;
    }

    setConfirmationType('manualEntry');
    setConfirmationData({
      transactions: manualTransactions,
      totalCount: manualTransactions.length,
      planLimit: getCurrentPlanLimits().transactions,
      currentPlan: selectedPlan
    });
    setShowConfirmation(true);
  };

  const confirmManualEntry = async () => {
    setShowConfirmation(false);
    setCurrentStep(5);
  };

  const generateBudgetFromTransactions = (transactions) => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const categorySpending = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + Math.abs(t.amount);
      });

    return {
      monthlyIncome: income,
      totalExpenses: expenses,
      savingsCapacity: income - expenses,
      categories: categorySpending
    };
  };

  const completeOnboarding = async () => {
    try {
      await apiCall('/financial/complete-onboarding', 'POST', {
        transactionsCount: transactions.length,
        hasUploadedFiles: uploadedFiles.length > 0,
        selectedCurrency: selectedCurrency,
        completedAt: new Date().toISOString()
      });

      if (completeAuth) {
        completeAuth();
      } else if (navigation) {
        navigation.navigate('MainApp');
      }
    } catch (error) {
      console.error('Complete onboarding error:', error);
      if (completeAuth) {
        completeAuth();
      } else if (navigation) {
        navigation.navigate('MainApp');
      }
    }
  };

  const addQuickTransaction = (categoryData) => {
    setQuickEntryModal(categoryData);
    setQuickAmount('');
  };

  const confirmQuickTransaction = () => {
    if (!quickAmount || isNaN(parseFloat(quickAmount))) {
      Alert.alert(t.invalidAmount, t.enterValidNumber);
      return;
    }
    
    const transaction = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      amount: (quickEntryModal.category === 'income' || quickEntryModal.category === 'additional_income') ? 
        Math.abs(parseFloat(quickAmount)) : -Math.abs(parseFloat(quickAmount)),
      description: quickEntryModal.name,
      category: quickEntryModal.category,
      type: (quickEntryModal.category === 'income' || quickEntryModal.category === 'additional_income') ? 'income' : 'expense',
      confidence: 1.0
    };
    
    setManualTransactions(prev => [transaction, ...prev]);
    setQuickEntryModal(null);
    setQuickAmount('');
  };

  // Currency selector component
  const renderCurrencySelector = () => {
    const selectedCurrencyData = currencies.all.find(c => c.code === selectedCurrency);
    
    return (
      <TouchableOpacity
        style={styles.currencySelector}
        onPress={() => setShowCurrencyModal(true)}
      >
        <View style={styles.currencySelectorContent}>
          <Text style={styles.currencySelectorLabel}>{t.currency}:</Text>
          <View style={styles.currencySelectorValue}>
            <Text style={styles.currencyFlag}>{selectedCurrencyData?.flag || '💰'}</Text>
            <Text style={styles.currencyCode}>{selectedCurrency}</Text>
            <Text style={styles.currencySymbol}>({selectedCurrencyData?.symbol || ''})</Text>
            <Ionicons name="chevron-down" size={20} color={colors.textDim} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Currency modal component
  const renderCurrencyModal = () => {
    const popularCurrencies = getFilteredCurrencies(false);
    const allCurrencies = getFilteredCurrencies(true);
    const showingFiltered = currencySearchQuery.trim().length > 0;
    
    return (
      <Modal visible={showCurrencyModal} transparent animationType="slide">
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.currencyModalContainer}>
            <View style={styles.currencyModalHeader}>
              <Text style={styles.currencyModalTitle}>
                {t.selectCurrency}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowCurrencyModal(false);
                  setCurrencySearchQuery('');
                }}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.currencyModalContent}>
              <Text style={styles.currencyModalSubtitle}>
                {t.currencyDescription}
              </Text>
              
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder={t.searchCurrencies}
                  placeholderTextColor={colors.textDim}
                  value={currencySearchQuery}
                  onChangeText={setCurrencySearchQuery}
                  returnKeyType="search"
                />
                <Ionicons name="search" size={20} color={colors.textDim} style={styles.searchIcon} />
              </View>
              
              <ScrollView style={styles.currencyList} showsVerticalScrollIndicator={false}>
                {!showingFiltered && (
                  <>
                    <Text style={styles.currencySectionTitle}>
                      {t.popularCurrencies}
                    </Text>
                    {popularCurrencies.map((currency) => (
                      <TouchableOpacity
                        key={`popular-${currency.code}`}
                        style={[
                          styles.currencyOption,
                          selectedCurrency === currency.code && styles.currencyOptionSelected
                        ]}
                        onPress={() => {
                          setSelectedCurrency(currency.code);
                          setShowCurrencyModal(false);
                          setCurrencySearchQuery('');
                        }}
                      >
                        <Text style={styles.currencyFlag}>{currency.flag}</Text>
                        <View style={styles.currencyInfo}>
                          <Text style={styles.currencyOptionName}>{currency.name}</Text>
                          <Text style={styles.currencyOptionCode}>{currency.code} • {currency.symbol}</Text>
                        </View>
                        {selectedCurrency === currency.code && (
                          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                    
                    <Text style={[styles.currencySectionTitle, { marginTop: responsive.spacing.lg }]}>
                      {t.allCurrencies}
                    </Text>
                  </>
                )}
                
                {(showingFiltered ? allCurrencies : currencies.all).map((currency) => {
                  if (!showingFiltered && popularCurrencies.find(p => p.code === currency.code)) {
                    return null;
                  }
                  
                  return (
                    <TouchableOpacity
                      key={`all-${currency.code}`}
                      style={[
                        styles.currencyOption,
                        selectedCurrency === currency.code && styles.currencyOptionSelected
                      ]}
                      onPress={() => {
                        setSelectedCurrency(currency.code);
                        setShowCurrencyModal(false);
                        setCurrencySearchQuery('');
                      }}
                    >
                      <Text style={styles.currencyFlag}>{currency.flag}</Text>
                      <View style={styles.currencyInfo}>
                        <Text style={styles.currencyOptionName}>{currency.name}</Text>
                        <Text style={styles.currencyOptionCode}>{currency.code} • {currency.symbol}</Text>
                      </View>
                      {selectedCurrency === currency.code && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
                
                {allCurrencies.length === 0 && (
                  <View style={styles.noCurrenciesFound}>
                    <Text style={styles.noCurrenciesText}>
                      No currencies found matching your search
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  const renderGoalsSetupScreen = () => {
    const goalCategories = [
      { 
        key: 'emergency_fund',
        icon: '🛡️',
        name: language === 'en' ? 'Emergency Fund' : language === 'ru' ? 'Чрезвычайный фонд' : 'Өзгөчө кырдаалдар фонду',
        description: language === 'en' ? '3-6 months expenses' : language === 'ru' ? 'Расходы на 3-6 месяцев' : '3-6 айлык чыгашалар'
      },
      { 
        key: 'vacation',
        icon: '✈️',
        name: language === 'en' ? 'Vacation' : language === 'ru' ? 'Отпуск' : 'Эс алуу',
        description: language === 'en' ? 'Travel and leisure' : language === 'ru' ? 'Путешествия и отдых' : 'Саякат жана эс алуу'
      },
      { 
        key: 'house',
        icon: '🏡',
        name: language === 'en' ? 'House/Car' : language === 'ru' ? 'Дом/Машина' : 'Үй/Унаа',
        description: language === 'en' ? 'Big purchases' : language === 'ru' ? 'Крупные покупки' : 'Чоң сатып алуулар'
      },
      { 
        key: 'education',
        icon: '🎓',
        name: language === 'en' ? 'Education' : language === 'ru' ? 'Образование' : 'Билим берүү',
        description: language === 'en' ? 'Learning and courses' : language === 'ru' ? 'Обучение и курсы' : 'Окуу жана курстар'
      },
      { 
        key: 'business',
        icon: '💼',
        name: language === 'en' ? 'Business' : language === 'ru' ? 'Бизнес' : 'Бизнес',
        description: language === 'en' ? 'Start or grow business' : language === 'ru' ? 'Начать или развить бизнес' : 'Бизнес баштоо же өнүктүрүү'
      },
      { 
        key: 'other',
        icon: '🎯',
        name: language === 'en' ? 'Other Goal' : language === 'ru' ? 'Другая цель' : 'Башка максат',
        description: language === 'en' ? 'Custom savings goal' : language === 'ru' ? 'Своя цель сбережений' : 'Өзүңүздүн максатыңыз'
      }
    ];

    return (
      <ScrollView style={styles.stepContainer}>
        <Text style={[globalStyles.authTitle, styles.centerText]}>
          {language === 'en' ? 'Set Your Goals' : language === 'ru' ? 'Установите цели' : 'Максаттарыңызды коюңуз'}
        </Text>
        <Text style={[globalStyles.authSubtitle, styles.centerText]}>
          {language === 'en' 
            ? 'What are you saving for?' 
            : language === 'ru' 
            ? 'Для чего вы копите?' 
            : 'Эмне үчүн топтоп жатасыз?'
          }
        </Text>

        <View style={styles.goalsSection}>
          <View style={styles.goalCategoriesGrid}>
            {goalCategories.map((goal) => (
              <TouchableOpacity 
                key={goal.key}
                style={[
                  styles.goalCategoryCard,
                  newGoal.category === goal.key && styles.goalCategoryCardSelected
                ]}
                onPress={() => setNewGoal(prev => ({...prev, category: goal.key}))}
              >
                <Text style={styles.goalCategoryIcon}>{goal.icon}</Text>
                <Text style={styles.goalCategoryName}>{goal.name}</Text>
                <Text style={styles.goalCategoryDesc}>{goal.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {newGoal.category && (
          <View style={styles.goalFormSection}>
            <Text style={globalStyles.formLabel}>
              {language === 'en' ? 'Goal Name' : language === 'ru' ? 'Название цели' : 'Максаттын аталышы'}
            </Text>
            <TextInput
              style={globalStyles.formInput}
              placeholder={language === 'en' ? 'e.g., Dream vacation to Europe' : language === 'ru' ? 'напр., Отпуск мечты в Европе' : 'мис., Европага кыялдагы эс алуу'}
              placeholderTextColor={colors.textDim}
              value={newGoal.title}
              onChangeText={(text) => setNewGoal(prev => ({...prev, title: text}))}
            />

            <Text style={globalStyles.formLabel}>
              {language === 'en' ? `Target Amount (${selectedCurrency})` : language === 'ru' ? `Целевая сумма (${selectedCurrency})` : `Максаттуу сумма (${selectedCurrency})`}
            </Text>
            <TextInput
              style={globalStyles.formInput}
              placeholder="100000"
              placeholderTextColor={colors.textDim}
              value={newGoal.targetAmount}
              onChangeText={(text) => setNewGoal(prev => ({...prev, targetAmount: text.replace(/[^0-9]/g, '')}))}
              keyboardType="numeric"
            />

            <Text style={globalStyles.formLabel}>
              {language === 'en' ? 'Target Date' : language === 'ru' ? 'Целевая дата' : 'Максаттуу дата'}
            </Text>
            <TextInput
              style={globalStyles.formInput}
              placeholder={language === 'en' ? 'YYYY-MM-DD' : language === 'ru' ? 'ГГГГ-ММ-ДД' : 'ЖЖЖЖ-АА-КК'}
              placeholderTextColor={colors.textDim}
              value={newGoal.deadline}
              onChangeText={(text) => setNewGoal(prev => ({...prev, deadline: text}))}
            />

            <TouchableOpacity 
              style={[globalStyles.pill, globalStyles.pillPrimary]} 
              onPress={() => {
                if (newGoal.title && newGoal.targetAmount) {
                  const goal = {
                    id: Date.now(),
                    ...newGoal,
                    targetAmount: parseInt(newGoal.targetAmount)
                  };
                  setFinancialGoals(prev => [...prev, goal]);
                  setNewGoal({
                    title: '',
                    targetAmount: '',
                    deadline: '',
                    category: 'emergency_fund'
                  });
                }
              }}
            >
              <Text style={globalStyles.pillTextPrimary}>
                {language === 'en' ? 'Add Goal' : language === 'ru' ? 'Добавить цель' : 'Максат кошуу'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {financialGoals.length > 0 && (
          <View style={styles.goalsListSection}>
            <Text style={styles.sectionTitle}>
              {language === 'en' ? `Your Goals (${financialGoals.length})` : language === 'ru' ? `Ваши цели (${financialGoals.length})` : `Максаттарыңыз (${financialGoals.length})`}
            </Text>
            
            {financialGoals.map(goal => {
              const categoryInfo = goalCategories.find(c => c.key === goal.category);
              return (
                <View key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalCardLeft}>
                    <Text style={styles.goalIcon}>{categoryInfo?.icon || '🎯'}</Text>
                    <View style={styles.goalDetails}>
                      <Text style={styles.goalTitle}>{goal.title}</Text>
                      <Text style={styles.goalAmount}>{formatAmount(goal.targetAmount)}</Text>
                      {goal.deadline && (
                        <Text style={styles.goalDeadline}>
                          {language === 'en' ? 'by' : language === 'ru' ? 'до' : 'чейин'} {goal.deadline}
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setFinancialGoals(prev => prev.filter(g => g.id !== goal.id))}
                    style={styles.removeGoalButton}
                  >
                    <Text style={styles.removeGoalText}>×</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity 
          style={[globalStyles.pill, globalStyles.pillPrimary, { marginTop: responsive.spacing.xl, marginBottom: responsive.spacing.xl }]}
          onPress={() => {
            if (manualTransactions.length > 0) {
              const generatedBudget = generateBudgetFromTransactions(manualTransactions);
              setBudget(generatedBudget);
            }
            setCurrentStep(6);
          }}
        >
          <Text style={globalStyles.pillTextPrimary}>
            {language === 'en' ? 'Continue to Summary' : language === 'ru' ? 'Перейти к сводке' : 'Жыйынтыкка өтүү'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  // Add currency selection screen as step 0
  const renderCurrencySelectionScreen = () => (
    <View style={styles.stepContainer}>
      <Text style={[globalStyles.authTitle, styles.centerText, { color: colors.text }]}>
        {t.selectCurrency}
      </Text>
      <Text style={[globalStyles.authSubtitle, styles.centerText, { color: colors.textDim }]}>
        {t.chooseCurrency}
      </Text>
      <Text style={[styles.currencyHelpText, styles.centerText]}>
        {t.currencyDescription}
      </Text>

      <View style={styles.currencySelectionGrid}>
        {currencies.popular.map((currency) => (
          <TouchableOpacity
            key={currency.code}
            style={[
              styles.currencySelectionCard,
              selectedCurrency === currency.code && styles.currencySelectionCardSelected
            ]}
            onPress={() => setSelectedCurrency(currency.code)}
          >
            <Text style={styles.currencySelectionFlag}>{currency.flag}</Text>
            <Text style={styles.currencySelectionCode}>{currency.code}</Text>
            <Text style={styles.currencySelectionName}>{currency.name}</Text>
            <Text style={styles.currencySelectionSymbol}>{currency.symbol}</Text>
            {selectedCurrency === currency.code && (
              <View style={styles.currencySelectionCheck}>
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity 
        style={[styles.moreOptionsButton]}
        onPress={() => setShowCurrencyModal(true)}
      >
        <Text style={styles.moreOptionsText}>
          {language === 'en' ? 'More Currency Options' : language === 'ru' ? 'Больше валют' : 'Көбүрөөк валюталар'}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </TouchableOpacity>

      {selectedCurrency && (
        <TouchableOpacity 
          style={[globalStyles.pill, globalStyles.pillPrimary, { marginTop: responsive.spacing.xl }]}
          onPress={() => setCurrentStep(1)}
        >
          <Text style={globalStyles.pillTextPrimary}>
            {language === 'en' ? `Continue with ${selectedCurrency}` : language === 'ru' ? `Продолжить с ${selectedCurrency}` : `${selectedCurrency} менен улантуу`}
          </Text>
        </TouchableOpacity>
      )}

      {!selectedCurrency && (
        <View style={styles.currencyRequiredNotice}>
          <Ionicons name="information-circle" size={20} color={colors.warning} />
          <Text style={styles.currencyRequiredText}>
            {language === 'en' ? 'Please select a currency to continue' : language === 'ru' ? 'Пожалуйста, выберите валюту для продолжения' : 'Улантуу үчүн валютаны тандаңыз'}
          </Text>
        </View>
      )}
    </View>
  );

  // Update choice screen to show selected currency info
  const renderChoiceScreen = () => (
    <View style={styles.stepContainer}>
      <Text style={[globalStyles.authTitle, styles.centerText, { color: colors.text }]}>
        {t.setupFinances}
      </Text>
      <Text style={[globalStyles.authSubtitle, styles.centerText, { color: colors.textDim }]}>
        {t.chooseMethod}
      </Text>
      
      {/* Show selected currency info */}
      <View style={styles.selectedCurrencyInfo}>
        <View style={styles.selectedCurrencyRow}>
          <Text style={styles.selectedCurrencyLabel}>{t.currency}:</Text>
          <View style={styles.selectedCurrencyValue}>
            <Text style={styles.currencyFlag}>{currencies.all.find(c => c.code === selectedCurrency)?.flag}</Text>
            <Text style={styles.selectedCurrencyText}>{selectedCurrency}</Text>
            <TouchableOpacity 
              style={styles.changeCurrencyButton}
              onPress={() => setCurrentStep(0)}
            >
              <Text style={styles.changeCurrencyText}>
                {language === 'en' ? 'Change' : language === 'ru' ? 'Изменить' : 'Өзгөртүү'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      <TouchableOpacity style={styles.choiceCard} onPress={() => setCurrentStep(2)}>
        <LinearGradient colors={[colors.primary, '#7bc496']} style={styles.choiceGradient}>
          <View style={styles.choiceHeader}>
            <Text style={[styles.choiceTitle, { color: '#ffffff' }]}>
              {t.connectBank}
            </Text>
          </View>
          <Text style={[styles.choiceDescription, { color: 'rgba(255, 255, 255, 0.8)' }]}>
            {t.bankDescription}
          </Text>
          <Text style={[styles.choiceRecommended, { color: '#ffffff' }]}>
            {t.recommended}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={styles.choiceCard} onPress={() => setCurrentStep(3)}>
        <View style={styles.choiceCardContent}>
          <Text style={styles.choiceTitleSecondary}>{t.uploadBankStatements}</Text>
          <Text style={styles.choiceDescriptionSecondary}>{t.uploadDescription}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.choiceCard} onPress={() => setCurrentStep(4)}>
        <View style={styles.choiceCardContent}>
          <Text style={styles.choiceTitleSecondary}>{t.manualEntry}</Text>
          <Text style={styles.choiceDescriptionSecondary}>{t.manualDescription}</Text>
        </View>
      </TouchableOpacity>

      <View style={styles.supportInfo}>
        <Text style={styles.supportTitle}>{t.supportedFormats}</Text>
        <Text style={styles.supportText}>{t.formatsList}</Text>
        <Text style={styles.securityText}>{t.secureProcessing}</Text>
      </View>
    </View>
  );

  const renderBankConnectionScreen = () => {
    const availableBanks = getFilteredBanks();
    const countryName = getCurrentCountryName();

    return (
      <View style={styles.stepContainer}>
        <Text style={[globalStyles.authTitle, styles.centerText]}>
          {t.connectBank}
        </Text>
        <Text style={[globalStyles.authSubtitle, styles.centerText]}>
          Select your country and bank to connect
        </Text>

        <View style={styles.bankSelectionContainer}>
          <TouchableOpacity
            style={styles.countrySelector}
            onPress={() => setShowCountryModal(true)}
          >
            <View style={styles.countrySelectorContent}>
              <Text style={styles.countrySelectorLabel}>Country:</Text>
              <View style={styles.countrySelectorValue}>
                <Text style={styles.countryName}>{countryName}</Text>
                <Ionicons name="chevron-down" size={20} color={colors.textDim} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search banks..."
              placeholderTextColor={colors.textDim}
              value={bankSearchQuery}
              onChangeText={setBankSearchQuery}
              returnKeyType="search"
            />
            <Ionicons name="search" size={20} color={colors.textDim} style={styles.searchIcon} />
          </View>

          <ScrollView 
            style={styles.bankList} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.bankListContent}
          >
            {availableBanks.length > 0 ? (
              availableBanks.map((bank, index) => (
                <TouchableOpacity
                  key={`${bank.shortName}-${index}`}
                  style={[
                    styles.bankItem,
                    selectedBank?.shortName === bank.shortName && styles.bankItemSelected
                  ]}
                  onPress={() => setSelectedBank(bank)}
                >
                  <View style={styles.bankItemContent}>
                    <View style={styles.bankInfo}>
                      <Text style={styles.bankName}>{bank.shortName}</Text>
                      <Text style={styles.bankFullName} numberOfLines={1}>
                        {bank.name}
                      </Text>
                      <View style={styles.bankMeta}>
                        <Text style={styles.bankType}>{translateBankType(bank.type)}</Text>
                        {bank.country && bank.flag && (
                          <Text style={styles.bankCountry}>
                            {bank.flag} {bank.country}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.bankActions}>
                      {selectedBank?.shortName === bank.shortName ? (
                        <View style={styles.selectedIndicator}>
                          <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                        </View>
                      ) : (
                        <View style={styles.connectButton}>
                          <Text style={styles.connectButtonText}>Select</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noBanksFound}>
                <Text style={styles.noBanksText}>
                  {countryName === 'Select Country' 
                    ? 'Please select a country to view banks'
                    : 'No banks found matching your search'
                  }
                </Text>
              </View>
            )}
          </ScrollView>

          {selectedBank && (
            <TouchableOpacity 
              style={[globalStyles.pill, globalStyles.pillPrimary, { marginTop: responsive.spacing.lg }]} 
              onPress={() => simulateBankConnection(selectedBank)}
            >
              <Text style={globalStyles.pillTextPrimary}>
                Connect to {selectedBank.shortName}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.comingSoonNotice}>
            <Text style={styles.comingSoonNoticeText}>
              Bank connections are in development. Try our demo connection to see how it works.
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[globalStyles.pill, globalStyles.pillSecondary]} 
            onPress={() => setCurrentStep(3)}
          >
            <Text style={globalStyles.pillTextSecondary}>{t.uploadBankStatements}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[globalStyles.pill, globalStyles.pillSecondary]} 
            onPress={() => setCurrentStep(4)}
          >
            <Text style={globalStyles.pillTextSecondary}>{t.manualEntry}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderFileUploadScreen = () => (
    <View style={styles.stepContainer}>
      <Text style={[globalStyles.authTitle, styles.centerText]}>
        {t.uploadDocuments}
      </Text>
      <Text style={[globalStyles.authSubtitle, styles.centerText]}>
        {t.addBankStatements}
      </Text>

      <TouchableOpacity style={styles.uploadZone} onPress={pickFiles}>
        <LinearGradient colors={[colors.cardBackground, colors.secondary]} style={styles.uploadZoneGradient}>
          <Text style={styles.uploadIcon}>📱</Text>
          <Text style={styles.uploadText}>{t.tapToAdd}</Text>
          <Text style={styles.uploadSubtext}>{t.fileTypes}</Text>
        </LinearGradient>
      </TouchableOpacity>

      {uploadedFiles.length > 0 && (
        <FlatList
          data={uploadedFiles}
          keyExtractor={item => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.fileCard}>
              <View style={styles.fileInfo}>
                <Text style={styles.fileName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.fileSize}>
                  {item.size ? `${(item.size / 1024 / 1024).toFixed(1)} MB` : t.unknownSize}
                </Text>
              </View>
              <TouchableOpacity onPress={() => removeFile(item.id)} style={styles.removeBtn}>
                <Text style={styles.removeText}>×</Text>
              </TouchableOpacity>
            </View>
          )}
          style={styles.fileList}
        />
      )}

      <View style={styles.buttonContainer}>
        {uploadedFiles.length > 0 && (
          <TouchableOpacity style={[globalStyles.pill, globalStyles.pillPrimary]} onPress={processFiles}>
            <Text style={globalStyles.pillTextPrimary}>
              {t.processFiles} ({uploadedFiles.length})
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[globalStyles.pill, globalStyles.pillSecondary]} 
          onPress={() => setCurrentStep(4)}
        >
          <Text style={globalStyles.pillTextSecondary}>{t.skipToManual}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderManualEntryScreen = () => (
    <View style={styles.stepContainer}>
      <Text style={[globalStyles.authTitle, styles.centerText]}>
        {t.addTransactions}
      </Text>
      <Text style={[globalStyles.authSubtitle, styles.centerText]}>
        {t.enterIncomeExpenses}
      </Text>

      <View style={styles.quickAddSection}>
        <Text style={styles.sectionTitle}>{t.quickAddCategory}</Text>
        <Text style={styles.quickAddSubtitle}>{t.tapCategoryHint}</Text>
        <View style={styles.quickButtonsGrid}>
          {getQuickCategories().map((categoryInfo, index) => (
            <TouchableOpacity 
              key={`quick-${index}`}
              style={styles.quickButtonImproved}
              onPress={() => addQuickTransaction(categoryInfo)}
            >
              <View style={styles.quickButtonContent}>
                <Text style={styles.quickButtonIcon}>{categoryInfo.icon}</Text>
                <Text style={styles.quickButtonText}>{categoryInfo.name}</Text>
                <Text style={styles.quickButtonHint}>{t.tapToEnterAmount}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.customTransactionSection}>
        <Text style={styles.sectionTitle}>{t.customTransaction}</Text>
        
        <View style={styles.formColumn}>
          <Text style={globalStyles.formLabel}>{t.description}</Text>
          <TextInput
            ref={descriptionInputRef}
            style={globalStyles.formInput}
            placeholder={t.descriptionPlaceholder}
            placeholderTextColor={colors.textDim}
            value={newTransaction.description}
            onChangeText={handleDescriptionChange}
            multiline={false}
            returnKeyType="next"
            onSubmitEditing={() => {
              amountInputRef.current?.focus();
            }}
            autoCorrect={false}
            autoCapitalize="sentences"
            enablesReturnKeyAutomatically={true}
            blurOnSubmit={false}
          />
        </View>
        
        <View style={styles.formColumn}>
          <Text style={globalStyles.formLabel}>{t.amount} ({selectedCurrency})</Text>
          <TextInput
            ref={amountInputRef}
            style={globalStyles.formInput}
            placeholder="0"
            placeholderTextColor={colors.textDim}
            value={newTransaction.amount}
            onChangeText={handleAmountChange}
            keyboardType="numeric"
            returnKeyType="done"
            autoCorrect={false}
            enablesReturnKeyAutomatically={true}
            onSubmitEditing={() => {
              amountInputRef.current?.blur();
            }}
            blurOnSubmit={false}
          />
        </View>

        <Text style={globalStyles.formLabel}>{t.category}:</Text>
        <View style={styles.categoryGrid}>
          {getRegularCategories().map(cat => (
            <TouchableOpacity 
              key={cat.key}
              style={[
                styles.categoryChipImproved, 
                newTransaction.category === cat.key && styles.categoryChipActive
              ]}
              onPress={() => handleCategorySelect(cat.key)}
            >
              <Text style={[
                styles.categoryChipText,
                newTransaction.category === cat.key && styles.categoryChipTextActive
              ]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[globalStyles.pill, globalStyles.pillPrimary]} 
          onPress={addManualTransaction}
        >
          <Text style={globalStyles.pillTextPrimary}>+ {t.addTransaction}</Text>
        </TouchableOpacity>
      </View>

      {manualTransactions.length > 0 && (
        <View style={styles.transactionListSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t.addedTransactions} ({manualTransactions.length})
            </Text>
            {manualTransactions.length > 3 && (
              <Text style={styles.showingText}>Showing recent 3</Text>
            )}
          </View>
          
          {manualTransactions.slice(0, 3).map(item => {
            const categoryObj = getRegularCategories().find(c => c.key === item.category);
            return (
              <View key={item.id} style={styles.transactionCardImproved}>
                <View style={styles.transactionLeft}>
                  <Text style={styles.transactionIcon}>
                    {categoryObj?.icon || '💳'}
                  </Text>
                  <View style={styles.transactionDetails}>
                    <Text style={styles.transactionDesc}>{item.description}</Text>
                    <Text style={styles.transactionCategory}>{categoryObj?.name || item.category}</Text>
                  </View>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={[
                    styles.transactionAmountText,
                    { color: item.amount > 0 ? colors.success : colors.danger }
                  ]}>
                    {item.amount > 0 ? '+' : ''}{formatAmount(item.amount)}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => removeManualTransaction(item.id)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>{t.remove}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
          
          {manualTransactions.length > 3 && (
            <Text style={styles.moreTransactions}>
              +{manualTransactions.length - 3} more transactions added
            </Text>
          )}
        </View>
      )}

      <TouchableOpacity 
        style={[
          globalStyles.pill, 
          manualTransactions.length > 0 ? globalStyles.pillPrimary : globalStyles.pillDisabled,
          { marginTop: responsive.spacing.xl, marginBottom: responsive.spacing.xl }
        ]}
        onPress={completeManualEntry}
        disabled={manualTransactions.length === 0}
      >
        <Text style={globalStyles.pillTextPrimary}>
          {t.continueWith} ({manualTransactions.length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderProcessingScreen = () => (
    <View style={styles.stepContainer}>
      <Text style={[globalStyles.authTitle, styles.centerText]}>
        {t.processingData}
      </Text>
      <Text style={[globalStyles.authSubtitle, styles.centerText]}>
        Processing your data ({uploadedFiles.length || transactions.length})
      </Text>

      <View style={styles.processingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.processingStep}>{processingStep}</Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${processingProgress}%` }]} />
          </View>
          <Text style={styles.progressText}>{processingProgress}%</Text>
        </View>

        <View style={styles.processingStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{uploadedFiles.length}</Text>
            <Text style={styles.statLabel}>{t.files}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{transactions.length}</Text>
            <Text style={styles.statLabel}>{t.transactions}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderSummaryScreen = () => (
    <ScrollView style={styles.stepContainer}>
      <Text style={[globalStyles.authTitle, styles.centerText]}>
        {t.setupComplete}
      </Text>
      <Text style={[globalStyles.authSubtitle, styles.centerText]}>
        {t.profileReady}
      </Text>

      {budget && (
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t.monthlyOverview}</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t.incomeLabel}</Text>
            <Text style={styles.summaryIncome}>
              {formatAmount(budget.monthlyIncome)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t.expensesLabel}</Text>
            <Text style={styles.summaryExpense}>
              {formatAmount(budget.totalExpenses)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t.availableForSavings}</Text>
            <Text style={[
              styles.summaryBalance, 
              { color: (budget.savingsCapacity || 0) > 0 ? colors.success : colors.danger }
            ]}>
              {formatAmount(budget.savingsCapacity || 0)}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{t.whatsNext}</Text>
        <View style={styles.nextStepItem}>
          <Text style={styles.nextStepText}>{t.setBudgets}</Text>
        </View>
        <View style={styles.nextStepItem}>
          <Text style={styles.nextStepText}>{t.createGoals}</Text>
        </View>
        <View style={styles.nextStepItem}>
          <Text style={styles.nextStepText}>{t.trackHabits}</Text>
        </View>
        <View style={styles.nextStepItem}>
          <Text style={styles.nextStepText}>{t.getInsights}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[globalStyles.pill, globalStyles.pillPrimary]}
        onPress={completeOnboarding}
      >
        <Text style={globalStyles.pillTextPrimary}>{t.startUsing}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderFileUploadConfirmation = () => {
    if (!confirmationData) return null;
    
    const { files, estimatedTransactions, planLimit } = confirmationData;
    return (
      <View style={styles.confirmationContainer}>
        <Text style={styles.confirmationTitle}>Review Files to Process</Text>
        
        <View style={styles.confirmationCard}>
          <Text style={styles.confirmationSubtitle}>Files Selected ({files.length})</Text>
          {files.slice(0, 3).map((file, index) => (
            <View key={index} style={styles.confirmationFileItem}>
              <Text style={styles.confirmationFileName}>{file.name}</Text>
              <Text style={styles.confirmationFileSize}>
                {file.size ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
              </Text>
            </View>
          ))}
          {files.length > 3 && (
            <Text style={styles.confirmationMoreFiles}>+{files.length - 3} more files</Text>
          )}
        </View>

        <View style={styles.confirmationCard}>
          <Text style={styles.confirmationSubtitle}>Processing Summary</Text>
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Estimated transactions:</Text>
            <Text style={styles.confirmationValue}>{estimatedTransactions}</Text>
          </View>
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Files to process:</Text>
            <Text style={styles.confirmationValue}>{files.length}</Text>
          </View>
        </View>

        <View style={styles.confirmationButtons}>
          <TouchableOpacity 
            style={[styles.confirmationButton, styles.confirmationButtonSecondary]}
            onPress={() => setShowConfirmation(false)}
          >
            <Text style={styles.confirmationButtonTextSecondary}>Review Files</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.confirmationButton, styles.confirmationButtonPrimary]}
            onPress={confirmFileProcessing}
          >
            <Text style={styles.confirmationButtonTextPrimary}>Process Files</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderManualEntryConfirmation = () => {
    if (!confirmationData) return null;
    
    const { transactions, totalCount } = confirmationData;
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return (
      <View style={styles.confirmationContainer}>
        <Text style={styles.confirmationTitle}>Review Your Transactions</Text>
        
        <View style={styles.confirmationCard}>
          <Text style={styles.confirmationSubtitle}>Transaction Summary</Text>
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Total transactions:</Text>
            <Text style={styles.confirmationValue}>{totalCount}</Text>
          </View>
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Total income:</Text>
            <Text style={[styles.confirmationValue, { color: colors.success }]}>
              +{formatAmount(income)}
            </Text>
          </View>
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Total expenses:</Text>
            <Text style={[styles.confirmationValue, { color: colors.danger }]}>
              -{formatAmount(expenses)}
            </Text>
          </View>
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Net balance:</Text>
            <Text style={[styles.confirmationValue, { color: income - expenses > 0 ? colors.success : colors.danger }]}>
              {formatAmount(income - expenses)}
            </Text>
          </View>
        </View>

        <View style={styles.confirmationCard}>
          <Text style={styles.confirmationSubtitle}>Setup Summary</Text>
          <View style={styles.confirmationRow}>
            <Text style={styles.confirmationLabel}>Total transactions:</Text>
            <Text style={styles.confirmationValue}>{totalCount}</Text>
          </View>
        </View>

        <View style={styles.confirmationButtons}>
          <TouchableOpacity 
            style={[styles.confirmationButton, styles.confirmationButtonSecondary]}
            onPress={() => setShowConfirmation(false)}
          >
            <Text style={styles.confirmationButtonTextSecondary}>Edit Transactions</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.confirmationButton, styles.confirmationButtonPrimary]}
            onPress={confirmManualEntry}
          >
            <Text style={styles.confirmationButtonTextPrimary}>Save & Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0: return renderCurrencySelectionScreen();
      case 1: return renderChoiceScreen();
      case 2: return renderBankConnectionScreen();
      case 3: return renderFileUploadScreen();
      case 4: return renderManualEntryScreen();
      case 5: return renderGoalsSetupScreen();
      case 6: return renderProcessingScreen();
      case 7: return renderSummaryScreen();
      default: return renderCurrencySelectionScreen();
    }
  };

  return (
    <SafeAreaView style={globalStyles.authContainer}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <LanguageSelector language={language} setLanguage={setLanguage} />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={globalStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {currentStep > 0 && currentStep < 7 && !isProcessing && (
            <TouchableOpacity
              style={globalStyles.backButton}
              onPress={() => {
                if (currentStep === 1) {
                  setCurrentStep(0); // Go back to currency selection
                } else if (currentStep === 4 || currentStep === 3 || currentStep === 2) {
                  setCurrentStep(1); // Go back to choice screen
                } else if (currentStep === 5) {
                  setCurrentStep(4); // Go back to manual entry from goals
                } else {
                  setCurrentStep(currentStep - 1);
                }
              }}
            >
              <Ionicons name="arrow-back" size={22} color="white" />
            </TouchableOpacity>
          )}
          
          {renderCurrentStep()}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={!!quickEntryModal} transparent animationType="fade">
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.quickEntryModal}>
            <Text style={styles.modalTitle}>
              {quickEntryModal && `Add ${quickEntryModal.name}`}
            </Text>
            <Text style={styles.modalSubtitle}>
              {quickEntryModal && quickEntryModal.placeholder}
            </Text>
            
            <TextInput
              ref={quickAmountInputRef}
              style={styles.modalInput}
              placeholder={`${t.enterAmount} (${selectedCurrency})`}
              placeholderTextColor={colors.textDim}
              value={quickAmount}
              onChangeText={handleQuickAmountChange}
              keyboardType="numeric"
              autoFocus={true}
              returnKeyType="done"
              onSubmitEditing={confirmQuickTransaction}
              enablesReturnKeyAutomatically={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setQuickEntryModal(null)}
              >
                <Text style={styles.modalButtonTextCancel}>{t.cancel}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmQuickTransaction}
              >
                <Text style={styles.modalButtonTextConfirm}>{t.addTransaction}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showConfirmation} transparent animationType="slide">
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.confirmationModalContainer}>
            {confirmationType === 'fileUpload' && renderFileUploadConfirmation()}
            {confirmationType === 'manualEntry' && renderManualEntryConfirmation()}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showCountryModal} transparent animationType="slide">
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.countryModalContainer}>
            <View style={styles.countryModalHeader}>
              <Text style={styles.countryModalTitle}>Select Country</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCountryModal(false)}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.countryList} showsVerticalScrollIndicator={false}>
              {supportedCountries.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={[
                    styles.countryOption,
                    getCurrentCountryName().includes(country.name) && styles.countryOptionSelected
                  ]}
                  onPress={() => handleCountrySelect(country.code)}
                >
                  <Text style={styles.countryFlag}>{country.flag}</Text>
                  <View style={styles.countryInfo}>
                    <Text style={styles.countryOptionName}>{country.name}</Text>
                  </View>
                  {getCurrentCountryName().includes(country.name) && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Currency Selection Modal */}
      {renderCurrencyModal()}
    </SafeAreaView>
  );
};

// Complete styles with currency styles added
const styles = StyleSheet.create({
  stepContainer: {
    flex: 1,
    padding: responsive.spacing.md,
  },
  centerText: {
    textAlign: 'center',
  },
  currencySelector: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: responsive.spacing.md,
    marginBottom: responsive.spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencySelectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currencySelectorLabel: {
    fontSize: responsive.typography.body,
    color: colors.textDim,
    fontWeight: '600',
  },
  currencySelectorValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive.spacing.xs,
  },
  currencyFlag: {
    fontSize: 20,
  },
  currencyCode: {
    fontSize: responsive.typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  currencySymbol: {
    fontSize: responsive.typography.body,
    color: colors.textDim,
  },
  currencyModalContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    margin: responsive.spacing.lg,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  currencyModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: responsive.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  currencyModalTitle: {
    fontSize: responsive.typography.title,
    fontWeight: 'bold',
    color: colors.text,
  },
  currencyModalContent: {
    padding: responsive.spacing.lg,
    flex: 1,
  },
  currencyModalSubtitle: {
    fontSize: responsive.typography.body,
    color: colors.textDim,
    textAlign: 'center',
    marginBottom: responsive.spacing.lg,
    lineHeight: responsive.typography.body * 1.4,
  },
  currencyList: {
    flex: 1,
  },
  currencySectionTitle: {
    fontSize: responsive.typography.subtitle,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: responsive.spacing.md,
    marginTop: responsive.spacing.sm,
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsive.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  currencyOptionSelected: {
    backgroundColor: colors.primary + '10',
  },
  currencyInfo: {
    flex: 1,
    marginLeft: responsive.spacing.sm,
  },
  currencyOptionName: {
    fontSize: responsive.typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  currencyOptionCode: {
    fontSize: responsive.typography.small,
    color: colors.textDim,
  },
  noCurrenciesFound: {
    padding: responsive.spacing.xl,
    alignItems: 'center',
  },
  noCurrenciesText: {
    fontSize: responsive.typography.body,
    color: colors.textDim,
    textAlign: 'center',
  },
  // New currency selection screen styles
  currencyHelpText: {
    fontSize: responsive.typography.body,
    color: colors.textDim,
    marginBottom: responsive.spacing.xl,
    lineHeight: responsive.typography.body * 1.4,
  },
  currencySelectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: responsive.spacing.md,
    marginBottom: responsive.spacing.xl,
  },
  currencySelectionCard: {
    width: '100%',
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: responsive.spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  currencySelectionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  currencySelectionFlag: {
    fontSize: 32,
    marginBottom: responsive.spacing.sm,
  },
  currencySelectionCode: {
    fontSize: responsive.typography.title,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: responsive.spacing.xs,
  },
  currencySelectionName: {
    fontSize: responsive.typography.small,
    color: colors.textDim,
    textAlign: 'center',
    marginBottom: responsive.spacing.xs,
  },
  currencySelectionSymbol: {
    fontSize: responsive.typography.body,
    color: colors.primary,
    fontWeight: 'bold',
  },
  currencySelectionCheck: {
    position: 'absolute',
    top: responsive.spacing.sm,
    right: responsive.spacing.sm,
  },
  moreOptionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: responsive.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: responsive.spacing.lg,
  },
  moreOptionsText: {
    fontSize: responsive.typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginRight: responsive.spacing.sm,
  },
  currencyRequiredNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning + '10',
    borderRadius: 8,
    padding: responsive.spacing.md,
    borderWidth: 1,
    borderColor: colors.warning + '30',
    marginTop: responsive.spacing.xl,
  },
  currencyRequiredText: {
    fontSize: responsive.typography.body,
    color: colors.warning,
    marginLeft: responsive.spacing.sm,
    textAlign: 'center',
  },
  selectedCurrencyInfo: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: responsive.spacing.md,
    marginBottom: responsive.spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedCurrencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedCurrencyLabel: {
    fontSize: responsive.typography.body,
    color: colors.textDim,
    fontWeight: '600',
  },
  selectedCurrencyValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive.spacing.sm,
  },
  selectedCurrencyText: {
    fontSize: responsive.typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  changeCurrencyButton: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: responsive.spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  changeCurrencyText: {
    fontSize: responsive.typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  choiceCard: {
    marginBottom: responsive.spacing.md,
    borderRadius: responsive.isTablet ? 24 : 16,
    overflow: 'hidden',
  },
  choiceGradient: {
    padding: responsive.spacing.lg,
  },
  choiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: responsive.spacing.sm,
  },
  choiceCardContent: {
    padding: responsive.spacing.lg,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: responsive.isTablet ? 24 : 16,
  },
  choiceTitle: {
    fontSize: responsive.typography.title,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: responsive.spacing.sm,
  },
  choiceTitleSecondary: {
    fontSize: responsive.typography.title,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: responsive.spacing.sm,
  },
  choiceDescription: {
    fontSize: responsive.typography.body,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: responsive.typography.body * 1.4,
    marginBottom: responsive.spacing.sm,
  },
  choiceDescriptionSecondary: {
    fontSize: responsive.typography.body,
    color: colors.textDim,
    lineHeight: responsive.typography.body * 1.4,
  },
  choiceRecommended: {
    fontSize: responsive.typography.small,
    color: colors.background,
    fontWeight: 'bold',
    backgroundColor: 'rgba(5, 33, 42, 0.2)',
    paddingHorizontal: responsive.spacing.sm,
    paddingVertical: responsive.spacing.xs,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  supportInfo: {
    marginTop: responsive.spacing.xl,
    padding: responsive.spacing.md,
    backgroundColor: colors.cardBackground,
    borderRadius: responsive.isTablet ? 24 : 16,
  },
  supportTitle: {
    fontSize: responsive.typography.body,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: responsive.spacing.xs,
  },
  supportText: {
    fontSize: responsive.typography.body,
    color: colors.textDim,
    marginBottom: responsive.spacing.xs,
  },
  securityText: {
    fontSize: responsive.typography.small,
    color: colors.success,
    fontStyle: 'italic',
  },
  bankSelectionContainer: {
    flex: 1,
    marginBottom: responsive.spacing.lg,
  },
  countrySelector: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: responsive.spacing.md,
    marginBottom: responsive.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  countrySelectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countrySelectorLabel: {
    fontSize: responsive.typography.body,
    color: colors.textDim,
    fontWeight: '600',
  },
  countrySelectorValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsive.spacing.sm,
  },
  countryName: {
    fontSize: responsive.typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  searchContainer: {
    position: 'relative',
    marginBottom: responsive.spacing.lg,
  },
  searchInput: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: responsive.spacing.md,
    paddingRight: 40,
    fontSize: responsive.typography.body,
    color: colors.text,
  },
  searchIcon: {
    position: 'absolute',
    right: responsive.spacing.md,
    top: responsive.spacing.md,
  },
  bankList: {
    maxHeight: 400,
  },
  bankListContent: {
    alignItems: 'center',
  },
  bankItem: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    marginBottom: responsive.spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
  },
  bankItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  bankItemContent: {
    flexDirection: 'row',
    padding: responsive.spacing.md,
    alignItems: 'center',
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: responsive.typography.subtitle,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  bankFullName: {
    fontSize: responsive.typography.small,
    color: colors.textDim,
    marginBottom: responsive.spacing.xs,
  },
  bankMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankType: {
    fontSize: responsive.typography.small,
    color: colors.primary,
    fontWeight: '500',
  },
  bankCountry: {
    fontSize: responsive.typography.small,
    color: colors.textDim,
  },
  bankActions: {
    marginLeft: responsive.spacing.sm,
  },
  selectedIndicator: {
    padding: responsive.spacing.sm,
  },
  connectButton: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: responsive.spacing.md,
    paddingVertical: responsive.spacing.sm,
    borderRadius: 8,
  },
  connectButtonText: {
    fontSize: responsive.typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  comingSoonNotice: {
    backgroundColor: colors.warning + '10',
    borderRadius: 8,
    padding: responsive.spacing.md,
    marginTop: responsive.spacing.md,
    borderWidth: 1,
    borderColor: colors.warning + '30',
  },
  comingSoonNoticeText: {
    fontSize: responsive.typography.small,
    color: colors.warning,
    textAlign: 'center',
    lineHeight: responsive.typography.small * 1.4,
  },
  uploadZone: {
    marginBottom: responsive.spacing.lg,
    borderRadius: responsive.isTablet ? 24 : 16,
    overflow: 'hidden',
  },
  uploadZoneGradient: {
    padding: responsive.spacing.xxl,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: responsive.isTablet ? 24 : 16,
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: responsive.spacing.md,
  },
  uploadText: {
    fontSize: responsive.typography.subtitle,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: responsive.spacing.xs,
  },
  uploadSubtext: {
    fontSize: responsive.typography.body,
    color: colors.textDim,
  },
  fileList: {
    maxHeight: 200,
    marginBottom: responsive.spacing.lg,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsive.spacing.md,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    marginBottom: responsive.spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: responsive.typography.body,
    fontWeight: 'bold',
    color: colors.text,
  },
  fileSize: {
    fontSize: responsive.typography.small,
    color: colors.textDim,
    marginTop: 2,
  },
  removeBtn: {
    padding: responsive.spacing.sm,
  },
  removeText: {
    fontSize: 18,
    color: colors.danger,
    fontWeight: 'bold',
  },
  buttonContainer: {
    marginTop: responsive.spacing.lg,
    gap: responsive.spacing.sm,
  },
  sectionTitle: {
    fontSize: responsive.typography.title,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: responsive.spacing.md,
    marginTop: responsive.spacing.lg,
  },
  quickAddSection: {
    marginBottom: responsive.spacing.xl,
  },
  quickAddSubtitle: {
    fontSize: responsive.typography.body,
    color: colors.textDim,
    textAlign: 'center',
    marginBottom: responsive.spacing.md,
    fontStyle: 'italic',
  },
  quickButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: responsive.spacing.sm,
  },
  quickButtonImproved: {
    width: '48%',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: responsive.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: responsive.spacing.sm,
  },
  quickButtonContent: {
    alignItems: 'center',
  },
  quickButtonIcon: {
    fontSize: 24,
    marginBottom: responsive.spacing.xs,
  },
  quickButtonText: {
    fontSize: responsive.typography.body,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: responsive.spacing.xs,
    textAlign: 'center',
  },
  quickButtonHint: {
    fontSize: responsive.typography.small,
    color: colors.textDim,
    textAlign: 'center',
  },
  customTransactionSection: {
    marginBottom: responsive.spacing.xl,
  },
  formColumn: {
    marginBottom: responsive.spacing.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: responsive.spacing.sm,
    marginBottom: responsive.spacing.lg,
  },
  categoryChipImproved: {
    paddingHorizontal: responsive.spacing.md,
    paddingVertical: responsive.spacing.sm,
    backgroundColor: colors.border,
    borderRadius: 20,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
  },
  categoryChipText: {
    fontSize: responsive.typography.body,
    color: colors.textDim,
  },
  categoryChipTextActive: {
    color: colors.background,
  },
  transactionListSection: {
    marginBottom: responsive.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsive.spacing.md,
  },
  showingText: {
    fontSize: responsive.typography.small,
    color: colors.textDim,
  },
  transactionCardImproved: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: responsive.spacing.md,
    marginBottom: responsive.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    fontSize: 20,
    marginRight: responsive.spacing.sm,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: responsive.typography.body,
    fontWeight: 'bold',
    color: colors.text,
  },
  transactionCategory: {
    fontSize: responsive.typography.small,
    color: colors.textDim,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmountText: {
    fontSize: responsive.typography.body,
    fontWeight: 'bold',
  },
  removeButton: {
    marginTop: responsive.spacing.xs,
    backgroundColor: colors.danger,
    paddingHorizontal: responsive.spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  removeButtonText: {
    fontSize: responsive.typography.small,
    color: colors.text,
    fontWeight: '600',
  },
  moreTransactions: {
    fontSize: responsive.typography.body,
    color: colors.textDim,
    textAlign: 'center',
    marginTop: responsive.spacing.sm,
    fontStyle: 'italic',
  },
  goalsSection: {
    marginBottom: responsive.spacing.xl,
  },
  goalCategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: responsive.spacing.sm,
  },
  goalCategoryCard: {
    width: '48%',
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: responsive.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: responsive.spacing.sm,
    alignItems: 'center',
  },
  goalCategoryCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  goalCategoryIcon: {
    fontSize: 24,
    marginBottom: responsive.spacing.xs,
  },
  goalCategoryName: {
    fontSize: responsive.typography.body,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  goalCategoryDesc: {
    fontSize: responsive.typography.small,
    color: colors.textDim,
    textAlign: 'center',
  },
  goalFormSection: {
    marginBottom: responsive.spacing.xl,
  },
  goalsListSection: {
    marginBottom: responsive.spacing.xl,
  },
  goalCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: responsive.spacing.md,
    marginBottom: responsive.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  goalCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  goalIcon: {
    fontSize: 20,
    marginRight: responsive.spacing.sm,
  },
  goalDetails: {
    flex: 1,
  },
  goalTitle: {
    fontSize: responsive.typography.body,
    fontWeight: 'bold',
    color: colors.text,
  },
  goalAmount: {
    fontSize: responsive.typography.small,
    color: colors.primary,
    marginTop: 2,
  },
  goalDeadline: {
    fontSize: responsive.typography.small,
    color: colors.textDim,
    marginTop: 2,
  },
  removeGoalButton: {
    padding: responsive.spacing.sm,
    backgroundColor: colors.danger,
    borderRadius: 6,
  },
  removeGoalText: {
    fontSize: responsive.typography.body,
    color: colors.text,
    fontWeight: 'bold',
  },
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingStep: {
    fontSize: responsive.typography.subtitle,
    color: colors.text,
    marginTop: responsive.spacing.lg,
    marginBottom: responsive.spacing.lg,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    marginBottom: responsive.spacing.xl,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: responsive.spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: responsive.typography.title,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  processingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: responsive.typography.display,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: responsive.typography.small,
    color: colors.textDim,
  },
  summaryCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: responsive.isTablet ? 24 : 16,
    padding: responsive.spacing.lg,
    marginBottom: responsive.spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: {
    fontSize: responsive.typography.title,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: responsive.spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsive.spacing.md,
  },
  summaryLabel: {
    fontSize: responsive.typography.subtitle,
    color: colors.textDim,
  },
  summaryIncome: {
    fontSize: responsive.typography.subtitle,
    fontWeight: 'bold',
    color: colors.success,
  },
  summaryExpense: {
    fontSize: responsive.typography.subtitle,
    fontWeight: 'bold',
    color: colors.danger,
  },
  summaryBalance: {
    fontSize: responsive.typography.subtitle,
    fontWeight: 'bold',
  },
  nextStepItem: {
    marginBottom: responsive.spacing.sm,
  },
  nextStepText: {
    fontSize: responsive.typography.body,
    color: colors.textDim,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickEntryModal: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: responsive.spacing.lg,
    margin: responsive.spacing.lg,
    minWidth: responsive.containerWidth * 0.8,
    maxWidth: responsive.containerWidth,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: responsive.typography.title,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: responsive.spacing.sm,
  },
  modalSubtitle: {
    fontSize: responsive.typography.body,
    color: colors.textDim,
    textAlign: 'center',
    marginBottom: responsive.spacing.lg,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: responsive.spacing.md,
    fontSize: responsive.typography.subtitle,
    color: colors.text,
    textAlign: 'center',
    marginBottom: responsive.spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: responsive.spacing.md,
  },
  modalButton: {
    flex: 1,
    padding: responsive.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.secondary,
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonTextCancel: {
    fontSize: responsive.typography.subtitle,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalButtonTextConfirm: {
    fontSize: responsive.typography.subtitle,
    fontWeight: 'bold',
    color: colors.background,
  },
  confirmationModalContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    margin: responsive.spacing.lg,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmationContainer: {
    padding: responsive.spacing.lg,
  },
  confirmationTitle: {
    fontSize: responsive.typography.title,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: responsive.spacing.lg,
  },
  confirmationCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: responsive.spacing.md,
    marginBottom: responsive.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confirmationSubtitle: {
    fontSize: responsive.typography.subtitle,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: responsive.spacing.sm,
  },
  confirmationFileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  confirmationFileName: {
    fontSize: responsive.typography.body,
    color: colors.text,
    flex: 1,
    marginRight: responsive.spacing.sm,
  },
  confirmationFileSize: {
    fontSize: responsive.typography.small,
    color: colors.textDim,
  },
  confirmationMoreFiles: {
    fontSize: responsive.typography.small,
    color: colors.textDim,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: responsive.spacing.sm,
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  confirmationLabel: {
    fontSize: responsive.typography.body,
    color: colors.textDim,
  },
  confirmationValue: {
    fontSize: responsive.typography.body,
    fontWeight: 'bold',
    color: colors.text,
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: responsive.spacing.md,
    marginTop: responsive.spacing.lg,
  },
  confirmationButton: {
    flex: 1,
    padding: responsive.spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmationButtonSecondary: {
    backgroundColor: colors.secondary,
  },
  confirmationButtonPrimary: {
    backgroundColor: colors.primary,
  },
  confirmationButtonTextSecondary: {
    fontSize: responsive.typography.subtitle,
    fontWeight: 'bold',
    color: colors.text,
  },
  confirmationButtonTextPrimary: {
    fontSize: responsive.typography.subtitle,
    fontWeight: 'bold',
    color: colors.background,
  },
  countryModalContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    margin: responsive.spacing.lg,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  countryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: responsive.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  countryModalTitle: {
    fontSize: responsive.typography.title,
    fontWeight: 'bold',
    color: colors.text,
  },
  closeButton: {
    padding: responsive.spacing.sm,
  },
  countryList: {
    maxHeight: 400,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: responsive.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  countryOptionSelected: {
    backgroundColor: colors.primary + '10',
  },
  countryInfo: {
    flex: 1,
  },
  countryOptionName: {
    fontSize: responsive.typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  noBanksFound: {
    padding: responsive.spacing.xl,
    alignItems: 'center',
  },
  noBanksText: {
    fontSize: responsive.typography.body,
    color: colors.textDim,
    textAlign: 'center',
  },
});

export default FinancialOnboarding;