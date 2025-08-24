import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { globalStyles, colors } from '../../styles/globalStyles';
import { translations } from '../../utils/translations';
import LanguageSelector from '../common/LanguageSelector';
import AkchabarLogo from '../common/AkchabarLogo';

const { width, height } = Dimensions.get('window');

const OnboardingFlow = ({ language, setLanguage, onComplete }) => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const t = translations[language];

  const onboardingData = [
    {
      id: 1,
      icon: 'analytics-outline',
      iconColor: '#7c3aed',
      title: {
        en: 'Track Your Spending',
        ru: 'Отслеживайте расходы',
        ky: 'Чыгымдарды көзөмөлдөө'
      },
      subtitle: {
        en: 'Get clear insights into where your money goes with smart categorization and beautiful visualizations.',
        ru: 'Получите четкое понимание того, куда уходят ваши деньги с умной категоризацией и красивой визуализацией.',
        ky: 'Акылдуу категоризация жана кооз визуализация менен акчаңыз кайда кетип жатканын так билип алыңыз.'
      },
      gradient: ['#667eea', '#764ba2']
    },
    {
      id: 2,
      icon: 'wallet-outline',
      iconColor: '#10b981',
      title: {
        en: 'Smart Budgets',
        ru: 'Умные бюджеты',
        ky: 'Акылдуу бюджеттер'
      },
      subtitle: {
        en: 'Set personalized budgets that adapt to your lifestyle. Get alerts before you overspend.',
        ru: 'Устанавливайте персональные бюджеты, которые адаптируются к вашему образу жизни. Получайте уведомления до превышения лимита.',
        ky: 'Жашоо образыңызга ылайыкташкан жеке бюджеттерди коюңуз. Ашыкча сарптоодон мурун эскертүүлөрдү алыңыз.'
      },
      gradient: ['#f093fb', '#f5576c']
    },
    {
      id: 3,
      icon: 'trophy-outline',
      iconColor: '#f59e0b',
      title: {
        en: 'Achieve Your Goals',
        ru: 'Достигайте целей',
        ky: 'Максатыңызга жетиңиз'
      },
      subtitle: {
        en: 'Set savings goals and track your progress. Build wealth systematically with our AI-powered recommendations.',
        ru: 'Ставьте цели по накоплениям и отслеживайте прогресс. Создавайте богатство систематически с нашими рекомендациями на основе ИИ.',
        ky: 'Топтоо максаттарын коюп, прогрессти көзөмөлдөңүз. Биздин AI негизиндеги сунуштар менен системалуу түрдө байлык түзүңүз.'
      },
      gradient: ['#4facfe', '#00f2fe']
    }
  ];

  const handleNext = () => {
    if (currentScreen < onboardingData.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentScreen(currentScreen + 1);
        scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handlePrevious = () => {
    if (currentScreen > 0) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentScreen(currentScreen - 1);
        scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const currentData = onboardingData[currentScreen];
  const isLastScreen = currentScreen === onboardingData.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7f8fb" />
      
      {/* Language Selector */}
      <View style={styles.header}>
        <LanguageSelector language={language} setLanguage={setLanguage} />
      </View>

      {/* Skip Button */}
      <View style={styles.topControls}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>
            {language === 'ru' ? 'Пропустить' : language === 'ky' ? 'Өткөрүп жиберүү' : 'Skip'}
          </Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Illustration Area */}
          <View style={[styles.illustrationContainer, { 
            background: `linear-gradient(135deg, ${currentData.gradient[0]}, ${currentData.gradient[1]})` 
          }]}>
            <View style={[styles.iconCircle, { backgroundColor: currentData.gradient[0] + '20' }]}>
              <Ionicons 
                name={currentData.icon} 
                size={80} 
                color={currentData.iconColor} 
              />
            </View>
            
            {/* Floating elements for visual interest */}
            <View style={[styles.floatingElement, styles.element1]} />
            <View style={[styles.floatingElement, styles.element2]} />
            <View style={[styles.floatingElement, styles.element3]} />
          </View>

          {/* Content */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              {currentData.title[language]}
            </Text>
            <Text style={styles.subtitle}>
              {currentData.subtitle[language]}
            </Text>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Bottom Controls */}
      <View style={styles.bottomContainer}>
        {/* Progress Dots */}
        <View style={styles.progressContainer}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentScreen && styles.progressDotActive
              ]}
            />
          ))}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {currentScreen > 0 && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handlePrevious}
            >
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
              <Text style={styles.backButtonText}>
                {language === 'ru' ? 'Назад' : language === 'ky' ? 'Артка' : 'Back'}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.nextButton, { flex: currentScreen === 0 ? 1 : 0.7 }]}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>
              {isLastScreen 
                ? (language === 'ru' ? 'Начать' : language === 'ky' ? 'Баштоо' : 'Get Started')
                : (language === 'ru' ? 'Далее' : language === 'ky' ? 'Кийинки' : 'Next')
              }
            </Text>
            <Ionicons 
              name={isLastScreen ? "checkmark" : "arrow-forward"} 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '',
  },
  header: {
    position: 'absolute',
    top: 30, // Moved down from 25
    left: 120, // Moved further left from 20
    zIndex: 1000,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  illustrationContainer: {
    height: height * 0.45,
    marginHorizontal: 20,
    borderRadius: 30,
    backgroundColor: '#667eea',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 40,
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  floatingElement: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
  },
  element1: {
    width: 60,
    height: 60,
    top: '15%',
    left: '10%',
  },
  element2: {
    width: 40,
    height: 40,
    top: '70%',
    right: '15%',
  },
  element3: {
    width: 80,
    height: 80,
    top: '25%',
    right: '8%',
  },
  textContainer: {
    paddingHorizontal: 30,
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 17,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '400',
  },
  bottomContainer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#d1d5db',
  },
  progressDotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
    flex: 0.3,
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    fontSize: 17,
    color: 'white',
    fontWeight: '700',
  },
};

export default OnboardingFlow;