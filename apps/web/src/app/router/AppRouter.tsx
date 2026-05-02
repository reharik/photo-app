import { Route, Routes } from 'react-router-dom';
import { AlbumScreen } from '../../screens/AlbumScreen';
import { AlbumsListScreen } from '../../screens/AlbumsListScreen';
import { HomeScreen } from '../../screens/HomeScreen';
import { MediaItemScreen } from '../../screens/MediaItemScreen';
// import { PublicAlbumScreen } from '../../screens/PublicAlbumScreen';
import { SharedWithMeScreen } from '../../screens/SharedWithMeScreen';
import { AppShell } from '../../shared/components/AppShell';

interface AppRouterProps {
  viewer: { id: string; displayName: string };
}

export const AppRouter = ({ viewer }: AppRouterProps) => {
  return (
    <Routes>
      <Route element={<AppShell viewer={viewer} />}>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/media" element={<HomeScreen />} />
        <Route path="/media/:mediaId" element={<MediaItemScreen />} />
        <Route path="/albums" element={<AlbumsListScreen />} />
        <Route path="/albums/:albumId" element={<AlbumScreen />} />
        <Route path="/shared-with-me" element={<SharedWithMeScreen />} />
        {/* <Route path="/share/:token" element={<PublicAlbumScreen />} /> */}
      </Route>
    </Routes>
  );
};
