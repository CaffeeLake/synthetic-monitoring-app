import React, { PropsWithChildren, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { CustomTransformOperator, dateTime, LoadingState, toDataFrame } from '@grafana/data';
import { SceneDataNode } from '@grafana/scenes';
import { SceneContextProvider, useDataTransformer } from '@grafana/scenes-react';
import { renderHook, waitFor } from '@testing-library/react';
import { map } from 'rxjs/operators';
import { CHECK_IN_PRODUCTION } from 'test/fixtures/folderChecks';
import { createWrapper } from 'test/render';
import { mockFeatureToggles } from 'test/utils';

import { FeatureName } from 'types';
import { useCheckFolderAccess } from 'hooks/useCheckFolderAccess';

import { filterChecksById } from './SummaryTableViz.utils';

// Use the app's router context for Scenes' legacy router import.
jest.mock('react-router-dom', () => jest.requireActual('react-router'));

const checks = [CHECK_IN_PRODUCTION];

it('settles the Overview table subscription when folders are disabled', async () => {
  mockFeatureToggles({ [FeatureName.Folders]: false });
  const AppWrapper = createWrapper().Wrapper;
  const onError = jest.fn();
  const Wrapper = ({ children }: PropsWithChildren) => (
    <AppWrapper>
        <ErrorBoundary fallback={<div>Table failed</div>} onError={onError}>
          <SceneContextProvider>{children}</SceneContextProvider>
        </ErrorBoundary>
    </AppWrapper>
  );
  let renders = 0;

  const { result, rerender } = renderHook(
    () => {
      // Bound the regression so an asynchronous transform loop fails instead of hanging Jest.
      if (++renders > 80) {
        throw new Error('Overview table did not settle');
      }
      const { visibleChecks } = useCheckFolderAccess(checks);
      const filter = useMemo<CustomTransformOperator>(() => {
        const ids = new Set(visibleChecks.map((check) => String(check.id)));
        return () => (source) => source.pipe(map((frames) => filterChecksById(frames, ids)));
      }, [visibleChecks]);
      const data = useMemo(
        () =>
          new SceneDataNode({
            data: {
              state: LoadingState.Done,
              series: [toDataFrame({ fields: [{ name: 'id', values: [CHECK_IN_PRODUCTION.id] }] })],
              timeRange: { from: dateTime(0), to: dateTime(1), raw: { from: dateTime(0), to: dateTime(1) } },
            },
          }),
        []
      );
      // Match the Overview's filter + transformed-data subscription, using real scene hooks.
      const transformer = useDataTransformer({ data, transformations: [filter] });
      return transformer.useState();
    },
    { wrapper: Wrapper }
  );

  await waitFor(() => expect(result.current?.data?.series[0]?.length).toBe(1));
  rerender();
  expect(result.current.data?.series[0].fields[0].values).toEqual([CHECK_IN_PRODUCTION.id]);
  expect(onError).not.toHaveBeenCalled();
  expect(renders).toBeLessThan(80);
});
