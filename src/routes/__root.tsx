import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect } from "react";
import { initSiteContent } from "@/lib/siteContent";
import { initSiteImages } from "@/lib/siteImages";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "SDF Tours & Travel — Ethiopia Tour Operator" },
      { name: "description", content: "SDF Tours & Travel is a premier private tour operator based in Addis Ababa, offering cultural, historical, adventure, and festival tours across Ethiopia." },
      { name: "author", content: "SDF Tours & Travel" },
      { property: "og:title", content: "SDF Tours & Travel — Ethiopia Tour Operator" },
      { property: "og:description", content: "Discover Ethiopia with SDF Tours & Travel. Curated cultural tours, heritage journeys, wildlife safaris, trekking, and event services across Ethiopia." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://sdftourandtravel.com/" },
      { property: "og:site_name", content: "SDF Tours & Travel" },
      { property: "og:image", content: "https://sdftourandtravel.com/favicon.png" },
      { property: "og:image:width", content: "1254" },
      { property: "og:image:height", content: "1254" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "SDF Tours & Travel — Ethiopia Tour Operator" },
      { name: "twitter:description", content: "Discover Ethiopia with SDF Tours & Travel. Curated cultural tours, heritage journeys, wildlife safaris, trekking, and event services." },
      { name: "twitter:image", content: "https://sdftourandtravel.com/favicon.png" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "canonical",
        href: "https://sdftourandtravel.com/",
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon.png",
      },
      {
        rel: "apple-touch-icon",
        href: "/favicon.png",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useEffect(() => {
    initSiteContent();
    initSiteImages();
  }, []);
  return <Outlet />;
}
