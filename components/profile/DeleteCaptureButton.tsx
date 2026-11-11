'use client';

import { useFormStatus } from 'react-dom';
import { deleteCaptureAction } from '@/app/actions/profile';
import { Button } from '@/components/ui/Button';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" icon="trash" isLoading={pending}>
      Delete
    </Button>
  );
}

export function DeleteCaptureButton({ id }: { id: string }) {
  return (
    <form
      action={deleteCaptureAction}
      onSubmit={(e) => {
        if (!confirm('Delete this capture and all of its screenshots? This can’t be undone.')) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Submit />
    </form>
  );
}
