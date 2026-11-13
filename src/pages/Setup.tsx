import React from 'react';
import PageContainer from '@/components/PageContainer';
import PageHeader from '@/components/PageHeader';
import { SetupContent } from '@/components/SetupPanel';

const Setup: React.FC = () => (
  <PageContainer className="max-w-3xl">
    <PageHeader
      eyebrow="Setup"
      title="Give Scales.os Supabase access"
      description="Pick the least-privilege path. You can run the migration yourself, or hand me a temporary credential."
    />
    <div className="surface p-6 sm:p-8">
      <SetupContent />
    </div>
  </PageContainer>
);

export default Setup;