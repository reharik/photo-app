import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { ThemeProvider } from 'styled-components';

import { MediaSelectionToolbar } from '../shared/components/gallery/selectionActions/MediaSelectionToolbar';
import { theme } from '../styles/theme';

const renderWithTheme = (ui: ReactElement): ReturnType<typeof render> => {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('MediaSelectionToolbar', () => {
  describe('When onDeleteFromLibrary is set', () => {
    it('should render an enabled Delete control', async () => {
      const onDelete = jest.fn();
      renderWithTheme(
        <MediaSelectionToolbar onAddToAlbum={() => {}} onDeleteFromLibrary={onDelete} />,
      );

      const deleteBtn = screen.getByRole('button', { name: 'Delete' });
      expect((deleteBtn as HTMLButtonElement).disabled).toBe(false);

      await userEvent.click(deleteBtn);
      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe('When onDeleteFromLibrary is not passed', () => {
    it('should render a disabled Delete control', () => {
      renderWithTheme(<MediaSelectionToolbar onAddToAlbum={() => {}} />);

      const deleteBtn = screen.getByRole('button', { name: 'Delete' });
      expect((deleteBtn as HTMLButtonElement).disabled).toBe(true);
    });
  });
});
