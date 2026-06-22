/**
 * PERF-07: SweetAlert2 lazy-loaded via dynamic import.
 * Em vez de importar 47KB gzipped em toda página,
 * carrega apenas no momento do uso (primeiro click).
 */

import type Swal from 'sweetalert2';
import type { SweetAlertOptions, SweetAlertResult } from 'sweetalert2';

let swalInstance: typeof Swal | null = null;

async function getSwal(): Promise<typeof Swal> {
  if (!swalInstance) {
    const mod = await import('sweetalert2');
    swalInstance = mod.default;
  }
  return swalInstance;
}

export async function fire(options: SweetAlertOptions): Promise<SweetAlertResult> {
  const swal = await getSwal();
  return swal.fire(options);
}

export async function showLoading(): Promise<void> {
  const swal = await getSwal();
  swal.showLoading();
}

export async function close(): Promise<void> {
  const swal = await getSwal();
  swal.close();
}

export async function showValidationMessage(message: string): Promise<void> {
  const swal = await getSwal();
  swal.showValidationMessage(message);
}

export async function confirm(options: SweetAlertOptions): Promise<boolean> {
  const swal = await getSwal();
  const result = await swal.fire({
    showCancelButton: true,
    confirmButtonColor: '#e30613',
    cancelButtonColor: '#64748b',
    ...options,
  });
  return result.isConfirmed;
}

export async function success(title: string, text?: string): Promise<void> {
  const swal = await getSwal();
  await swal.fire({ icon: 'success', title, text, timer: 3000, showConfirmButton: false });
}

export async function error(title: string, text?: string): Promise<void> {
  const swal = await getSwal();
  await swal.fire({ icon: 'error', title, text });
}

export async function toast(title: string, icon: 'success' | 'error' | 'info' = 'success'): Promise<void> {
  const swal = await getSwal();
  await swal.fire({
    icon,
    title,
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
}