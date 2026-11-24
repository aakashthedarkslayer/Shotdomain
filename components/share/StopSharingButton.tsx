'use client';

import { buttonClass } from '@/components/ui/Button';

/** The question asked before a share link and its screenshots are deleted. */
export const STOP_SHARING_CONFIRM = 'Stop sharing? The link stops working and its screenshots are deleted now. This can’t be undone.';

/** Submit button for the profile's "Stop sharing" form: asks first, because the files go straight away. */
export function StopSharingButton() {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(STOP_SHARING_CONFIRM)) e.preventDefault();
      }}
      className={buttonClass('danger', 'sm')}
    >
      Stop sharing
    </button>
  );
}
