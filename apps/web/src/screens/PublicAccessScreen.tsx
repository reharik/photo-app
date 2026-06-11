import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BrandedLoading } from './public/BrandedLoading';
import { PublicUnavailable } from './public/PublicUnavailable';
import { PublicAlbumScreen } from './PublicAlbumScreen';

type HandshakeStatus = 'pending' | 'success' | 'failure';

const HANDSHAKE_MIN_DISPLAY_MS = 1000;

export const PublicAccessScreen = () => {
  const [status, setStatus] = useState<HandshakeStatus>('pending');
  const auth = useAuth();
  const { token } = useParams<{ token: string }>();

  useEffect(() => {
    if (!token) {
      setStatus('failure');
      return;
    }

    setStatus('pending');

    void (async () => {
      const [result] = await Promise.all([
        auth.publicAccess(token).catch(() => ({ success: false as const })),
        new Promise<void>((resolve) => {
          window.setTimeout(resolve, HANDSHAKE_MIN_DISPLAY_MS);
        }),
      ]);

      if (!result.success) {
        setStatus('failure');
        return;
      }

      setStatus('success');
    })();
  }, [auth, token]);

  if (status === 'failure') {
    return <PublicUnavailable />;
  }

  if (status === 'success') {
    return <PublicAlbumScreen />;
  }

  return <BrandedLoading />;
};
