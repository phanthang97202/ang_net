import { TArchiveVisibility } from '../../interfaces';

export interface ArchiveVisibilityOption {
  value: TArchiveVisibility;
  label: string;
  description: string;
  icon: string;
}

export const ARCHIVE_VISIBILITY_OPTIONS: ArchiveVisibilityOption[] = [
  {
    value: 'Private',
    label: 'Riêng tư',
    description: 'Chỉ mình bạn xem được.',
    icon: 'lock',
  },
  {
    value: 'Unlisted',
    label: 'Có link',
    description: 'Ai có link thì xem được, không hiện công khai.',
    icon: 'link',
  },
  {
    value: 'Public',
    label: 'Công khai',
    description: 'Mọi người đều xem được.',
    icon: 'global',
  },
];

export function archiveVisibilityOption(
  value: TArchiveVisibility
): ArchiveVisibilityOption {
  return (
    ARCHIVE_VISIBILITY_OPTIONS.find(o => o.value === value) ??
    ARCHIVE_VISIBILITY_OPTIONS[0]
  );
}
