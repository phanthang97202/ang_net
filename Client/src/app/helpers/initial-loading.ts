/** Chỉ che lần tải đầu/F5; không chờ API nền, iframe, hay toàn bộ ảnh của trang. */
export async function finishInitialLoading(): Promise<void> {
  const loader = document.getElementById('initial-loader');
  if (!loader || loader.dataset['finishing'] === 'true') return;
  loader.dataset['finishing'] = 'true';

  // Font có thể tải chậm hoặc lỗi. Không để nó khóa trang vô hạn.
  let fontTimeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      document.fonts?.ready ?? Promise.resolve(),
      new Promise<void>(resolve => {
        fontTimeout = setTimeout(resolve, 800);
      }),
    ]);
  } catch {
    // Trang vẫn sử dụng font dự phòng khi nguồn font không hoạt động.
  } finally {
    clearTimeout(fontTimeout);
  }

  // Outlet đã kích hoạt nhưng Angular vẫn cần hoàn tất render trang con.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('app-booting');
      const root = document.querySelector('app-root');
      root?.removeAttribute('inert');
      root?.removeAttribute('aria-hidden');
      root?.setAttribute('aria-busy', 'false');
      loader.dataset['leaving'] = 'true';
      setTimeout(() => loader.remove(), 200);
    });
  });
}

export function failInitialLoading(): void {
  const loader = document.getElementById('initial-loader');
  if (!loader || loader.dataset['leaving'] === 'true') return;
  loader.dataset['failed'] = 'true';
  const status = document.getElementById('initial-loader-status');
  if (status) status.textContent = 'Không thể tải trang.';
  const retry = document.getElementById('initial-loader-retry');
  if (retry) retry.hidden = false;
}
