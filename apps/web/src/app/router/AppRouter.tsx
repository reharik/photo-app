import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../../features/shell/AppShell';
import { AlbumScreen } from '../../screens/AlbumScreen';
import { AlbumsListScreen } from '../../screens/AlbumsListScreen';
import { ForgotPasswordScreen } from '../../screens/ForgotPasswordScreen';
import { HomeScreen } from '../../screens/HomeScreen';
import { LoggedOutScreen } from '../../screens/LoggedOutScreen';
import { MediaItemScreen } from '../../screens/MediaItemScreen';
import { NotFoundScreen } from '../../screens/NotFoundScreen';
import { PublicAccessScreen } from '../../screens/PublicAccessScreen';
import { PublicMediaItemScreen } from '../../screens/PublicMediaItemScreen';
import { SharedAlbumsListScreen } from '../../screens/SharedAlbumsListScreen';
import { SharedWithMeScreen } from '../../screens/SharedWithMeScreen';
import { PublicRouteShell } from '../PublicRouteShell';
import { RequireViewer } from '../RequireViewer';

export const AppRouter = () => {
  return (
    <Routes>
      <Route
        path="/shared/:token"
        element={
          <PublicRouteShell>
            <PublicAccessScreen />
          </PublicRouteShell>
        }
      />
      <Route
        path="/shared/:token/media/:mediaId"
        element={
          <PublicRouteShell>
            <PublicMediaItemScreen />
          </PublicRouteShell>
        }
      />
      <Route path="/login" element={<LoggedOutScreen />} />
      <Route path="/signup" element={<LoggedOutScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
      <Route element={<RequireViewer />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/media" element={<HomeScreen />} />
          <Route path="/media/:mediaId" element={<MediaItemScreen />} />
          <Route path="/albums" element={<AlbumsListScreen />} />
          <Route path="/albums/:albumId" element={<AlbumScreen />} />
          <Route path="/shared-with-me" element={<Navigate to="/shared/items" replace />} />
          <Route path="/shared/items" element={<SharedWithMeScreen />} />
          <Route path="/shared/albums" element={<SharedAlbumsListScreen />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundScreen />} />
    </Routes>
  );
};
