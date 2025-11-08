export const generateBlogSlug = (title: string): string => {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // remove all non-alphanumeric characters except spaces
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .replace(/^-+|-+$/g, ""); // trim leading/trailing hyphens
};
