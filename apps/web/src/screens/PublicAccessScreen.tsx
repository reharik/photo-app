import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PublicAlbumScreen } from './PublicAlbumScreen';

export const PublicAccessScreen = () => {
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const { publicAccess } = useAuth();

  const { token } = useParams<{ token: string }>();
  useEffect(() => {
    if (!token) return;

    void Promise.all([
      publicAccess(token).then((result) => {
        if (!result.ok) {
          setError(result.message);
          return;
        }
        setIsValid(true);
      }),
      new Promise((resolve) => setTimeout(resolve, 800)),
    ]);
  }, [publicAccess, token]);

  if (isValid) {
    return <PublicAlbumScreen />;
  }
};
