'use client';

import { ErrorDialog as ErrorDialogPrimitive } from '@videojs/react';
import '../styles/audio/theme.css';
import '../styles/base.css';
import '../styles/dialog.css';
import '../styles/video/captions.css';
import '../styles/video/theme.css';

import { Button } from './button';

export function ErrorDialog() {
  return (
    <ErrorDialogPrimitive.Root>
      <ErrorDialogPrimitive.Backdrop className={'media-dialog-backdrop'} />
      <ErrorDialogPrimitive.Popup className={'media-dialog-popup'}>
        <div className={'media-dialog-content'}>
          <ErrorDialogPrimitive.Title className={'media-dialog-title'} />
          <ErrorDialogPrimitive.Description className={'media-dialog-description'} />
        </div>
        <div className={'media-dialog-actions'}>
          <ErrorDialogPrimitive.Close render={<Button />} className={'media-dialog-close'} />
        </div>
      </ErrorDialogPrimitive.Popup>
    </ErrorDialogPrimitive.Root>
  );
}
