export interface PageHead {
  title: string;
  description: string;
  path: string;
  type?: 'website' | 'article';
  jsonLd?: Record<string, unknown> | Array<Record<string, unknown>>;
  noindex?: boolean;
}

function upsertMeta(selector: string, create: () => HTMLElement, set: (element: HTMLElement) => void): void {
  const existing = document.head.querySelector(selector) as HTMLElement | null;
  const element = existing ?? create();
  set(element);
  if (!existing) document.head.appendChild(element);
}

function setMetaName(name: string, content: string): void {
  upsertMeta(
    `meta[name="${name}"]`,
    () => {
      const meta = document.createElement('meta');
      meta.setAttribute('name', name);
      return meta;
    },
    (element) => element.setAttribute('content', content),
  );
}

function setMetaProperty(property: string, content: string): void {
  upsertMeta(
    `meta[property="${property}"]`,
    () => {
      const meta = document.createElement('meta');
      meta.setAttribute('property', property);
      return meta;
    },
    (element) => element.setAttribute('content', content),
  );
}

export function setPageHead(head: PageHead): void {
  document.title = head.title;
  setMetaName('description', head.description);
  setMetaName('robots', head.noindex ? 'noindex, nofollow' : 'index, follow');

  const canonical = `${window.location.origin}${head.path}`;
  upsertMeta(
    'link[rel="canonical"]',
    () => {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      return link;
    },
    (element) => element.setAttribute('href', canonical),
  );

  setMetaProperty('og:title', head.title);
  setMetaProperty('og:description', head.description);
  setMetaProperty('og:type', head.type ?? 'website');
  setMetaProperty('og:url', canonical);
  setMetaProperty('og:site_name', 'SobatPaper.id');
  setMetaName('twitter:card', 'summary');
  setMetaName('twitter:title', head.title);
  setMetaName('twitter:description', head.description);

  const previous = document.head.querySelector('script[data-page-schema]');
  if (previous) previous.remove();
  if (head.jsonLd) {
    const script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    script.setAttribute('data-page-schema', 'true');
    script.textContent = JSON.stringify(head.jsonLd);
    document.head.appendChild(script);
  }
}
