import React from 'react';
import { PRODUCT } from '@/constants/product';
import { PublicInfoPage, type InfoSection } from '@/components/PublicInfoPage';

const sections: InfoSection[] = [
  {
    title: 'Who we are',
    paragraphs: [
      'Soul Compass is a registration-free, local-first app for daily reflections, crystal guidance and optional natal-chart exploration. The operator identity, public address, applicable legal roles and privacy request process are still being verified.',
    ],
  },
  {
    title: 'Information kept on your device',
    paragraphs: [
      'The app stores your birth details, selected current residence, language, preferences, daily feeling, crystal collection, hidden stones, chart-permission choice and a saved chart on this device. The app uses local storage that is not encrypted by Soul Compass at the application layer. Your operating-system backup may include app data.',
      'There is no active account registration or profile synchronization in the mobile interface. A full export/import feature is not available.',
    ],
  },
  {
    title: 'Daily readings and crystal guidance',
    paragraphs: [
      'Daily readings and crystal suggestions are worked out in the app using the saved profile, current planetary positions, local date and any feeling you chose. The app does not send your collection, language, feeling or current residence as part of the natal-chart request.',
    ],
  },
  {
    title: 'City search',
    paragraphs: [
      'When you tap Search, the city text you entered goes through the Soul Compass API to Geoapify so the app can show matching places, coordinates and time zones. The app does not use device GPS for this search, and the saved birth profile is not included. Geoapify receives normal connection metadata from the server.',
    ],
  },
  {
    title: 'Optional natal-chart calculation',
    paragraphs: [
      'If you grant and keep chart permission enabled, Soul Compass may send your birth date, whether your birth time is known (and the time you entered, if known), and birthplace coordinates and time zone to the Soul Compass API to calculate a chart. The app loads a matching saved chart first; it requests a new calculation when needed, such as when no matching chart is cached or birth details change. The result is saved on this device.',
      'You can withdraw permission in Settings. That blocks future requests and cancels or discards an active result when possible, but cannot undo a request already sent. Failed requests are not queued for later.',
    ],
  },
  {
    title: 'Service providers, logs and retention',
    paragraphs: [
      'Replit hosts the Soul Compass API and operational quota database. Geoapify provides city-search results. The inspected application logger records request method, path and response status, not request bodies; operational quota records are separate from user profiles. Replit infrastructure logs, provider retention, data regions, backups and account agreements still require verification.',
      'Protected Supabase profile routes and related modules remain in the repository, although the active mobile interface does not use them. Their production configuration and any existing records must be checked before a final policy can describe the service as having no cloud-profile processing.',
    ],
  },
  {
    title: 'Your choices and requests',
    paragraphs: [
      'You can withdraw chart permission and delete your local profile in Settings. Deleting the local profile returns the app to setup, but does not erase operating-system backups or technical records kept by service providers. The process for handling formal privacy-rights requests has not yet been established.',
    ],
  },
  {
    title: 'Items still to verify before publication',
    bullets: [
      'Operator identity, postal address, applicable supervisory authority and governing jurisdiction.',
      'Legal bases, user-rights response process, children/age wording and required translations.',
      'Replit and Geoapify processing roles, agreements, regions, logs, backups and retention.',
      'Live Supabase configuration, production API access model and whether any cloud records exist.',
      'Stable public Privacy Policy URL and qualified legal review.',
    ],
  },
  {
    title: 'Privacy contact',
    paragraphs: [
      `${PRODUCT.supportName} can be reached at ${PRODUCT.supportEmail}. Please do not include birth details, a chart or an unredacted profile screenshot in an ordinary email.`,
    ],
  },
];

export default function PrivacyPageDraft() {
  return (
    <PublicInfoPage
      title="Privacy Policy"
      subtitle="A plain-language preview of how the current app handles information."
      sections={sections}
      actions={[
        { label: 'Contact Soul Compass Support', icon: 'mail', href: `mailto:${PRODUCT.supportEmail}?subject=Privacy%20question` },
        { label: 'Open the support page draft', icon: 'help-circle', route: '/support' },
      ]}
    />
  );
}
