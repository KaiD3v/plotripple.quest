export const BRAND_ASSETS = {
  symbol: "/branding/plotripple/plotripple-symbol-transparent.png",
  lockup: "/branding/plotripple/logo-horizontal-transparent.png",
  faviconIco: "/favicon.ico",
  favicon16: "/branding/plotripple/favicon-16x16.png",
  favicon32: "/branding/plotripple/favicon-32x32.png",
  appleTouch: "/branding/plotripple/apple-touch-icon.png",
  openGraph: "/branding/plotripple/open-graph-1200x630.jpg",
  icon192: "/branding/plotripple/icon-192.png",
  icon512: "/branding/plotripple/icon-512.png",
} as const;

export const BRAND_OPEN_GRAPH = {
  url: BRAND_ASSETS.openGraph,
  width: 1200,
  height: 630,
  alt: "PlotRipple — Every choice changes the story.",
} as const;
