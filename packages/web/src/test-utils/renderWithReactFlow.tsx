import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { ReactFlowProvider } from '@xyflow/react';

function renderWithReactFlow(ui: React.ReactElement, options?: RenderOptions) {
  const result = render(<ReactFlowProvider>{ui}</ReactFlowProvider>, options);
  return {
    ...result,
    rerender: (newUi: React.ReactElement) =>
      result.rerender(<ReactFlowProvider>{newUi}</ReactFlowProvider>),
  };
}

export { renderWithReactFlow };
