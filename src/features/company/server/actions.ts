'use server';

import { randomUUID } from 'node:crypto';
import { revalidatePath } from 'next/cache';

import { actionError, mapError } from '@/server/errors';
import type { ActionResult } from '@/server/action';
import { getSession } from '@/server/session';
import { createClient } from '@/server/supabase';
import { detectLogoType, LOGO_MAX_BYTES } from '@/features/company/logo';

const BUCKET = 'company-logos';
const LOGO_EDITORS = ['owner', 'admin'] as const;

const invalid = (message: string): ActionResult<never> => ({
  ok: false,
  ...actionError('VALIDATION'),
  message,
});

/** Saves a new company logo. Takes a FormData with one `logo` file. */
export async function uploadCompanyLogo(formData: FormData): Promise<ActionResult<{ logoUrl: string }>> {
  const session = await getSession();
  if (!session) return { ok: false, ...actionError('UNAUTHENTICATED') };
  if (!LOGO_EDITORS.includes(session.role as (typeof LOGO_EDITORS)[number])) {
    return { ok: false, ...actionError('FORBIDDEN') };
  }

  const file = formData.get('logo');
  if (!(file instanceof File) || file.size === 0) return invalid('Choose an image file.');
  if (file.size > LOGO_MAX_BYTES) return invalid('The logo must be 2 MB or smaller.');

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectLogoType(bytes);
  if (!type) return invalid('The logo must be a PNG, JPG or WebP image.');

  try {
    const supabase = await createClient();
    const { data: current, error: readError } = await supabase
      .from('companies')
      .select('logo_path')
      .eq('id', session.companyId)
      .maybeSingle();
    if (readError) throw readError;

    // A fresh name each time, so browsers never show the old logo from cache.
    const path = `${session.companyId}/logo-${randomUUID()}.${type.extension}`;
    const upload = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: type.mime,
      cacheControl: '31536000',
    });
    if (upload.error) throw upload.error;

    const { error: saveError } = await supabase
      .from('companies')
      .update({ logo_path: path })
      .eq('id', session.companyId);
    if (saveError) {
      await supabase.storage.from(BUCKET).remove([path]);
      throw saveError;
    }
    if (current?.logo_path) await supabase.storage.from(BUCKET).remove([current.logo_path]);

    revalidatePath('/', 'layout');
    return { ok: true, data: { logoUrl: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl } };
  } catch (error) {
    return { ok: false, ...mapError(error) };
  }
}

/** Removes the company logo and deletes its file. */
export async function removeCompanyLogo(): Promise<ActionResult<null>> {
  const session = await getSession();
  if (!session) return { ok: false, ...actionError('UNAUTHENTICATED') };
  if (!LOGO_EDITORS.includes(session.role as (typeof LOGO_EDITORS)[number])) {
    return { ok: false, ...actionError('FORBIDDEN') };
  }

  try {
    const supabase = await createClient();
    const { data: current, error: readError } = await supabase
      .from('companies')
      .select('logo_path')
      .eq('id', session.companyId)
      .maybeSingle();
    if (readError) throw readError;

    const { error } = await supabase.from('companies').update({ logo_path: null }).eq('id', session.companyId);
    if (error) throw error;
    if (current?.logo_path) await supabase.storage.from(BUCKET).remove([current.logo_path]);

    revalidatePath('/', 'layout');
    return { ok: true, data: null };
  } catch (error) {
    return { ok: false, ...mapError(error) };
  }
}
