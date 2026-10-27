import React from 'react';

import { useLegacyAlertsRestriction } from 'hooks/useLegacyAlertsRestriction';

import { CenteredSpinner } from '../../../../../CenteredSpinner';
import { SectionContent } from '../../../ui/SectionContent';
import { FormTabContent, FormTabs } from '../../FormTabs';
import { GenericAlertingField } from '../../generic/GenericAlertingField';
import { GenericLegacyAlertingField } from '../../generic/GenericLegacyAlertingField';

export function GenericAlertingContent() {
  const { isRestricted, isLoading } = useLegacyAlertsRestriction();
  const isLegacyEnabled = !isRestricted && !isLoading;

  if (isLoading) {
    return <CenteredSpinner />;
  }

  return (
    <SectionContent>
      <FormTabs>
        <FormTabContent label="Per-check alerts">
          <GenericAlertingField field="alerts" />
        </FormTabContent>
        {isLegacyEnabled && (
          <FormTabContent label="Legacy alerts">
            <GenericLegacyAlertingField />
          </FormTabContent>
        )}
      </FormTabs>
    </SectionContent>
  );
}
