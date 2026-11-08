import React from 'react';
import { PublicInfoPage, type InfoSection } from '@/components/PublicInfoPage';
import legalContent from '@/constants/legal-documents.json';

const page = legalContent.pages.support;

export default function SupportPageDraft() {
  return (
    <PublicInfoPage
      title={page.title}
      subtitle={page.subtitle}
      updated={legalContent.updated}
      sections={page.sections as InfoSection[]}
      actions={page.actions as Array<{ label: string; icon: 'mail' | 'file-text' | 'help-circle'; route?: './privacy' | './terms' | './support'; href?: string }>}
    />
  );
}
