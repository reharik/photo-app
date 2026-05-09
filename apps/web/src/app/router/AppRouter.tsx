import { Route, Routes } from 'react-router-dom';
import { AppShell } from '../../features/shell/AppShell';
import { AlbumScreen } from '../../screens/AlbumScreen';
import { AlbumsListScreen } from '../../screens/AlbumsListScreen';
import { HomeScreen } from '../../screens/HomeScreen';
import { LoggedOutScreen } from '../../screens/LoggedOutScreen';
import { MediaItemScreen } from '../../screens/MediaItemScreen';
import { PublicAccessScreen } from '../../screens/PublicAccessScreen';
import { PublicMediaItemScreen } from '../../screens/PublicMediaItemScreen';
import { SharedWithMeScreen } from '../../screens/SharedWithMeScreen';
import { RequireViewer } from '../RequireViewer';

export const AppRouter = () => {
  return (
    <Routes>
      <Route path="/shared/:token" element={<PublicAccessScreen />} />
      <Route path="/shared/:token/media/:mediaId" element={<PublicMediaItemScreen />} />
      <Route path="/login" element={<LoggedOutScreen />} />
      <Route element={<RequireViewer />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/media" element={<HomeScreen />} />
          <Route path="/media/:mediaId" element={<MediaItemScreen />} />
          <Route path="/albums" element={<AlbumsListScreen />} />
          <Route path="/albums/:albumId" element={<AlbumScreen />} />
          <Route path="/shared-with-me" element={<SharedWithMeScreen />} />
        </Route>
      </Route>
    </Routes>
  );
};
