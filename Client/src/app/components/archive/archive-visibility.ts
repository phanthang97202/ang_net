import { TArchiveVisibility } from '../../interfaces';

export interface ArchiveVisibilityOption {
  value: TArchiveVisibility;
  labelKey: string;
  descriptionKey: string;
  icon: string;
}

export const ARCHIVE_VISIBILITY_OPTIONS: ArchiveVisibilityOption[] = [
  {
    value: 'Private',
    labelKey: 'T_ARCHIVE_VISIBILITY_PRIVATE',
    descriptionKey: 'T_ARCHIVE_VISIBILITY_PRIVATE_DESC',
    icon: 'lock',
  },
  {
    value: 'Unlisted',
    labelKey: 'T_ARCHIVE_VISIBILITY_UNLISTED',
    descriptionKey: 'T_ARCHIVE_VISIBILITY_UNLISTED_DESC',
    icon: 'link',
  },
  {
    value: 'Public',
    labelKey: 'T_ARCHIVE_VISIBILITY_PUBLIC',
    descriptionKey: 'T_ARCHIVE_VISIBILITY_PUBLIC_DESC',
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
