import React from 'react';
import { PRODUCT } from '@/constants/product';
import { PublicInfoPage, type InfoSection } from '@/components/PublicInfoPage';

const sections: InfoSection[] = [
  {
    title: 'How we can help',
    paragraphs: [
      'Soul Compass Support can help with setup, language settings, city search, natal-chart calculations and crystal-guide features. The app does not attach your profile to a support email.',
    ],
  },
  {
    title: 'Report a problem safely',
    bullets: [
      'Include your app version, phone model, iOS or Android version, the screen you were using and the steps that led to the issue.',
      'Include the exact error text if there is one.',
      'Before attaching a screenshot, hide your birth date, time, birthplace, current residence, chart and other private details.',
      'Do not email birth details, chart data or an unredacted profile screenshot. They are not needed for normal technical support.',
    ],
  },
  {
    title: 'Quick checks',
    bullets: [
      'Try reopening the app and repeat the action once.',
      'City search and a new natal-chart calculation need an internet connection.',
      'If chart permission was withdrawn, review it in Settings before requesting another calculation.',
      'Soul Compass has no cloud profile sync or full export/import today. If app data is cleared or the app is removed, a local profile may not be recoverable.',
    ],
  },
  {
    title: 'Privacy and data requests',
    paragraphs: [
      'The linked Privacy Policy is an unfinished draft, not a final policy or a public legal URL. A verified response process for formal privacy requests is still being prepared.',
    ],
  },
  {
    title: 'Languages',
    paragraphs: [
      'This support-page preview is currently in English only. Translations for publication need separate review.',
    ],
  },
];

export default function SupportPageDraft() {
  return (
    <PublicInfoPage
      title="Soul Compass Support"
      subtitle="For help with the app, email us without including private birth or chart details."
      sections={sections}
      actions={[
        { label: 'Email Soul Compass Support', icon: 'mail', href: `mailto:${PRODUCT.supportEmail}?subject=Soul%20Compass%20support` },
        { label: 'Read the Privacy Policy draft', icon: 'file-text', route: '/privacy' },
      ]}
    />
  );
}
