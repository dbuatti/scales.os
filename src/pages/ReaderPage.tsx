import React from 'react';
import RepertoirePanel from '@/components/RepertoirePanel';
import PageContainer from '@/components/PageContainer';

const ReaderPage: React.FC = () => (
  <PageContainer className="space-y-6">
    <RepertoirePanel />
  </PageContainer>
);

export default ReaderPage;
