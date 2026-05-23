import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PublicAlbumScreen } from './PublicAlbumScreen';

export const PublicAccessScreen = () => {
  const [error, setError] = useState<string | undefined>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const auth = useAuth();
  const { token } = useParams<{ token: string }>();

  useEffect(() => {
    if (!token) return;

    void Promise.all([
      auth
        .publicAccess(token)
        .then((result) => {
          if (!result.success) {
            setError(result.error);
            return;
          }
          setIsAuthenticated(true);
        })
        .catch((error) => {
          setError(error instanceof Error ? error.message : 'Public access failed');
        }),
      new Promise((resolve) => setTimeout(resolve, 800)),
    ]);
  }, [auth, token]);

  if (error != undefined) {
    return <p role="alert">{error}</p>;
  }

  if (isAuthenticated) {
    return <PublicAlbumScreen />;
  }

  return null;
};
