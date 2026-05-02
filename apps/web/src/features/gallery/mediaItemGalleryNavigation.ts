export type GalleryNavigation =
  | { enabled: false }
  | {
      enabled: true;
      currentIndex: number;
      previousId: string;
      nextId: string;
    };

export const getGalleryNavigation = (params: {
  galleryIds?: string[];
  mediaId?: string;
  isEditingDetails: boolean;
}): GalleryNavigation => {
  const { galleryIds, mediaId, isEditingDetails } = params;

  if (isEditingDetails || galleryIds == null || mediaId == null || mediaId === '') {
    return { enabled: false };
  }

  if (galleryIds.length <= 1) {
    return { enabled: false };
  }

  const currentIndex = galleryIds.indexOf(mediaId);
  if (currentIndex === -1) {
    return { enabled: false };
  }

  return {
    enabled: true,
    currentIndex,
    previousId: galleryIds[(currentIndex - 1 + galleryIds.length) % galleryIds.length],
    nextId: galleryIds[(currentIndex + 1) % galleryIds.length],
  };
};
