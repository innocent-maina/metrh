type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  timeout?: number;
}

const toastTimers = new Map<string, ReturnType<typeof setTimeout>>();

function createToastId() {
  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clearToastTimer(id: string) {
  const timer = toastTimers.get(id);
  if (timer) {
    globalThis.clearTimeout(timer);
    toastTimers.delete(id);
  }
}

export function useAppToast() {
  const toasts = useState<ToastItem[]>("app-toasts", () => []);

  function dismissToast(id: string) {
    clearToastTimer(id);
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
  }

  function showToast(options: ToastOptions) {
    const toast: ToastItem = {
      id: createToastId(),
      title: options.title,
      description: options.description,
      tone: options.tone ?? "success",
    };

    toasts.value = [...toasts.value, toast];

    if (import.meta.client) {
      const timeout = options.timeout ?? 4000;
      const timer = globalThis.setTimeout(() => dismissToast(toast.id), timeout);
      toastTimers.set(toast.id, timer);
    }

    return toast.id;
  }

  function successToast(title: string, description?: string) {
    return showToast({ title, description, tone: "success" });
  }

  function errorToast(title: string, description?: string) {
    return showToast({ title, description, tone: "error" });
  }

  return {
    toasts,
    showToast,
    successToast,
    errorToast,
    dismissToast,
  };
}
