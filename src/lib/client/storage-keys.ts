/** Every browser storage key the site uses, so the inline head script and the stores cannot drift. */
export const STORAGE_KEYS = {
  prefs: 'nagy-notes:prefs',
  bookmarks: 'nagy-notes:bookmarks',
  recent: 'nagy-notes:recent',
  progress: 'nagy-notes:progress',
  sidebar: 'nagy-notes:sidebar',
  commenterName: 'nagy-notes:commenter-name',
  /** sessionStorage: the intro loader already ran in this tab. */
  loaderSeen: 'nagy-notes:loader-seen',
} as const;
