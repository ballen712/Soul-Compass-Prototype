import React from 'react';
import { PublicInfoPage } from '@/components/PublicInfoPage';
import legalContent from '@/constants/legal-documents.json';
import { useAppText } from '@/localization';

export default function SupportPage() {
  const t = useAppText();
  return (
    <PublicInfoPage
      title={t('Support')}
      subtitle={t('The current published document is available on the Soul Compass website.')}
      updated={legalContent.updated}
      sections={[]}
      showDraftNotice={false}
      actions={[{ label: t('Open the Soul Compass website'), icon: 'help-circle', href: legalContent.publicUrls.support }]}
    />
  );
}
