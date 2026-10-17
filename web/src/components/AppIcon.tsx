import React from 'react';

const paths: Record<string, string> = {
  home: 'm3 10 9-7 9 7 M5 9v12h14V9 M9 21v-7h6v7',
  explore: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20 M16 8l-3 5-5 3 3-5Z',
  compare: 'M4 7h16m-4-4 4 4-4 4 M20 17H4m4-4-4 4 4 4',
  bookmark: 'M6 3h12v18l-6-4-6 4Z',
  priorities: 'M4 6h5m4 0h7 M4 12h9m4 0h3 M4 18h2m4 0h10 M9 3v6m4 0v6m-7 0v6',
  shield: 'm12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z m-4 9 3 3 5-6',
  settings: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',
  search: 'M10 16a6 6 0 1 0 0-12 6 6 0 0 0 0 12 m5-1 6 6',
  check: 'm5 12 4 4L19 6',
  map: 'm3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z M9 3v15M15 6v15',
  building: 'M4 21h16M6 21V4h12v17 M9 8h1m4 0h1M9 12h1m4 0h1M10 21v-5h4v5',
  price: 'M5 4h14M5 9h14M7 4c9 0 9 9 0 9H5l11 8',
  checklist: 'M9 3H5v18h14V3h-4 M9 2h6v4H9Z m-1 10 2 2 5-6',
};

export function AppIcon({name,size=20}:{name:string;size?:number}) {
  return <svg className="nb-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.explore}/></svg>;
}
