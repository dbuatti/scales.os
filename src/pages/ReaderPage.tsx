import React from 'react';
import RepertoirePanel from '@/components/RepertoirePanel';
import PageContainer from '@/components/PageContainer';
import PageHeader from '@/components/PageHeader';

const ReaderPage: React.FC = () => (
  <PageContainer aria-label="Practice reader">
    <PageHeader
      eyebrow="Library"
      title="Practice reader"
      description="Open a method book, map exercises, and keep your tempo work in one focused workspace."
    />
    <RepertoirePanel />
  </PageContainer>
);

export default ReaderPage;
