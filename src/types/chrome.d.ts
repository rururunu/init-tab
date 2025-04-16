declare namespace chrome {
  namespace bookmarks {
    interface BookmarkTreeNode {
      id: string;
      parentId?: string;
      index?: number;
      url?: string;
      title: string;
      dateAdded?: number;
      dateGroupModified?: number;
      children?: BookmarkTreeNode[];
    }
  }
} 