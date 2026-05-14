/**
 * Lightweight i18n system — no external dependency.
 * Extend by adding keys to each locale object.
 * Usage: const t = useTranslations('en'); t('hero.title')
 */

export type Locale = 'en' | 'de' | 'fr' | 'nl';
export const SUPPORTED_LOCALES: Locale[] = ['en', 'de', 'fr', 'nl'];
export const DEFAULT_LOCALE: Locale = 'en';

type TranslationMap = Record<string, string>;

const translations: Record<Locale, TranslationMap> = {
  en: {
    'nav.tours': 'Tours',
    'nav.attractions': 'Attractions',
    'nav.plan': 'Plan a trip',
    'nav.assistant': 'AI assistant',
    'nav.enquire': 'Enquire',
    'hero.eyebrow': 'Cape Town Tour Platform',
    'hero.title': 'Plan a Cape Town trip that feels custom from the very first click.',
    'hero.lead': 'Private tours, AI itinerary planning, and a real consultant ready to turn your ideas into a polished trip.',
    'hero.cta.tours': 'Explore tours',
    'hero.cta.plan': 'Build itinerary',
    'hero.trust.ai': 'AI itinerary generation',
    'hero.trust.private': 'Private-first tours',
    'hero.trust.local': 'Local expert follow-up',
    'enquiry.title': 'Tell us about your trip',
    'enquiry.submit': 'Send enquiry',
    'enquiry.success': 'Thanks! We\'ll be in touch within 24 hours.',
    'booking.cta': 'Book this tour',
    'booking.enquire': 'Enquire instead',
    'common.loading': 'Loading…',
    'common.error': 'Something went wrong. Please try again.',
  },
  de: {
    'nav.tours': 'Touren',
    'nav.attractions': 'Sehenswürdigkeiten',
    'nav.plan': 'Reise planen',
    'nav.assistant': 'KI-Assistent',
    'nav.enquire': 'Anfragen',
    'hero.eyebrow': 'Kapstadt-Tourplattform',
    'hero.title': 'Planen Sie eine Kapstadt-Reise, die sich ab dem ersten Klick maßgeschneidert anfühlt.',
    'hero.lead': 'Private Touren, KI-Reiseplanung und ein echter Berater, der Ihre Ideen in eine perfekte Reise verwandelt.',
    'hero.cta.tours': 'Touren entdecken',
    'hero.cta.plan': 'Reiseroute erstellen',
    'hero.trust.ai': 'KI-Reiseroutenplanung',
    'hero.trust.private': 'Private Touren',
    'hero.trust.local': 'Lokale Expertenberatung',
    'enquiry.title': 'Erzählen Sie uns von Ihrer Reise',
    'enquiry.submit': 'Anfrage senden',
    'enquiry.success': 'Danke! Wir melden uns innerhalb von 24 Stunden.',
    'booking.cta': 'Tour buchen',
    'booking.enquire': 'Stattdessen anfragen',
    'common.loading': 'Lädt…',
    'common.error': 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut.',
  },
  fr: {
    'nav.tours': 'Circuits',
    'nav.attractions': 'Attractions',
    'nav.plan': 'Planifier un voyage',
    'nav.assistant': 'Assistant IA',
    'nav.enquire': 'Demander',
    'hero.eyebrow': 'Plateforme de circuits au Cap',
    'hero.title': 'Planifiez un voyage au Cap qui semble personnalisé dès le premier clic.',
    'hero.lead': 'Circuits privés, planification d\'itinéraire par IA et un vrai conseiller prêt à transformer vos idées en voyage parfait.',
    'hero.cta.tours': 'Explorer les circuits',
    'hero.cta.plan': 'Créer un itinéraire',
    'hero.trust.ai': 'Génération d\'itinéraire par IA',
    'hero.trust.private': 'Circuits privés',
    'hero.trust.local': 'Suivi par des experts locaux',
    'enquiry.title': 'Parlez-nous de votre voyage',
    'enquiry.submit': 'Envoyer la demande',
    'enquiry.success': 'Merci ! Nous vous contacterons dans les 24 heures.',
    'booking.cta': 'Réserver ce circuit',
    'booking.enquire': 'Faire une demande à la place',
    'common.loading': 'Chargement…',
    'common.error': 'Une erreur s\'est produite. Veuillez réessayer.',
  },
  nl: {
    'nav.tours': 'Rondleidingen',
    'nav.attractions': 'Attracties',
    'nav.plan': 'Reis plannen',
    'nav.assistant': 'AI-assistent',
    'nav.enquire': 'Informeer',
    'hero.eyebrow': 'Kaapstad Tourplatform',
    'hero.title': 'Plan een Kaapstad-reis die vanaf de eerste klik op maat aanvoelt.',
    'hero.lead': 'Privérondleidingen, AI-reisplanning en een echte consultant die uw ideeën omzet in een perfecte reis.',
    'hero.cta.tours': 'Rondleidingen verkennen',
    'hero.cta.plan': 'Reisroute maken',
    'hero.trust.ai': 'AI-reisroutegeneratie',
    'hero.trust.private': 'Privé-eerst rondleidingen',
    'hero.trust.local': 'Lokale expertopvolging',
    'enquiry.title': 'Vertel ons over uw reis',
    'enquiry.submit': 'Aanvraag versturen',
    'enquiry.success': 'Bedankt! We nemen binnen 24 uur contact op.',
    'booking.cta': 'Boek deze rondleiding',
    'booking.enquire': 'Liever informeren',
    'common.loading': 'Laden…',
    'common.error': 'Er is iets misgegaan. Probeer het opnieuw.',
  },
};

export function getTranslations(locale: Locale = DEFAULT_LOCALE) {
  const map = translations[locale] ?? translations[DEFAULT_LOCALE];
  return function t(key: string, fallback?: string): string {
    return map[key] ?? translations[DEFAULT_LOCALE][key] ?? fallback ?? key;
  };
}

export function detectLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const preferred = acceptLanguage.split(',')[0]?.split('-')[0]?.toLowerCase();
  return (SUPPORTED_LOCALES.includes(preferred as Locale) ? preferred : DEFAULT_LOCALE) as Locale;
}
