import type { SVGProps } from 'react';

/**
 * Minimal Lucide-style stroke icons (1.75 width) used across the app chrome.
 * Kept inline and dependency-free; the skill calls for consistent SVG icons
 * rather than emoji.
 */
function Base(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export const PlusIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M12 5v14M5 12h14" /></Base>
);

export const ArrowLeftIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M19 12H5M12 19l-7-7 7-7" /></Base>
);

export const EditIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></Base>
);

export const TrashIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V6" /></Base>
);

export const PlayIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="m6 4 14 8-14 8V4Z" /></Base>
);

export const CodeIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="m16 18 6-6-6-6M8 6l-6 6 6 6" /></Base>
);

export const DownloadIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></Base>
);

export const UploadIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></Base>
);

export const SearchIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Base>
);

export const SaveIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><path d="M17 21v-8H7v8M7 3v5h8" /></Base>
);

export const MaximizeIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M16 21h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></Base>
);

export const MinimizeIcon = (p: SVGProps<SVGSVGElement>) => (
  <Base {...p}><path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M16 21v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" /></Base>
);
