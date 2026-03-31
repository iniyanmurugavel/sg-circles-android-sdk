import { requireOptionalNativeModule } from 'expo';

type MessageListener = (event: Record<string, unknown>) => void;

export type BrownfieldRuntimeMode = 'native' | 'preview';

export type BrownfieldRuntime = {
  addMessageListener: (
    listener: MessageListener
  ) => {
    remove: () => void;
  };
  getSharedStateValue: <T>(key: string) => T | undefined;
  mode: BrownfieldRuntimeMode;
  popToNative: (animated?: boolean) => void;
  sendMessage: (message: Record<string, unknown>) => void;
  setSharedStateValue: <T>(key: string, value: T) => void;
};

const previewSharedState = new Map<string, unknown>();
const previewListeners = new Set<MessageListener>();

type NativeMessageSubscription = {
  remove: () => void;
};

type NativeMessageModule = {
  addListener: (eventName: 'onMessage', listener: MessageListener) => NativeMessageSubscription;
  popToNative: (animated?: boolean) => void;
  sendMessage: (message: Record<string, unknown>) => void;
};

type NativeSharedState = {
  get: () => unknown;
  set: (value: unknown) => void;
};

type NativeStateModule = {
  getSharedState: (key: string) => NativeSharedState | null;
};

const previewRuntime: BrownfieldRuntime = {
  addMessageListener(listener) {
    previewListeners.add(listener);

    return {
      remove() {
        previewListeners.delete(listener);
      },
    };
  },
  getSharedStateValue(key) {
    return previewSharedState.get(key) as never;
  },
  mode: 'preview',
  popToNative() {
    console.log('[brownfield preview] popToNative');
  },
  sendMessage(message) {
    console.log('[brownfield preview] sendMessage', message);
  },
  setSharedStateValue(key, value) {
    previewSharedState.set(key, value);
  },
};

let runtimePromise: Promise<BrownfieldRuntime> | null = null;

export function emitPreviewNativeMessage(message: Record<string, unknown>) {
  for (const listener of previewListeners) {
    listener(message);
  }
}

function createNativeRuntime(): BrownfieldRuntime | null {
  const messageModule = requireOptionalNativeModule<NativeMessageModule>('ExpoBrownfieldModule');
  const stateModule =
    requireOptionalNativeModule<NativeStateModule>('ExpoBrownfieldStateModule');

  if (
    !messageModule ||
    !stateModule ||
    typeof messageModule.addListener !== 'function' ||
    typeof messageModule.popToNative !== 'function' ||
    typeof messageModule.sendMessage !== 'function' ||
    typeof stateModule.getSharedState !== 'function'
  ) {
    return null;
  }

  const sharedStateCache = new Map<string, NativeSharedState>();

  function getSharedState(key: string) {
    const cachedValue = sharedStateCache.get(key);

    if (cachedValue) {
      return cachedValue;
    }

    const nextValue = stateModule.getSharedState(key);

    if (
      !nextValue ||
      typeof nextValue.get !== 'function' ||
      typeof nextValue.set !== 'function'
    ) {
      return null;
    }

    sharedStateCache.set(key, nextValue);
    return nextValue;
  }

  return {
    addMessageListener(listener) {
      const subscription = messageModule.addListener('onMessage', listener);

      if (!subscription || typeof subscription.remove !== 'function') {
        return {
          remove() {},
        };
      }

      return subscription;
    },
    getSharedStateValue<T>(key: string) {
      const value = getSharedState(key)?.get();
      return (value === null ? undefined : value) as T | undefined;
    },
    mode: 'native',
    popToNative(animated = false) {
      messageModule.popToNative(animated);
    },
    sendMessage(message) {
      messageModule.sendMessage(message);
    },
    setSharedStateValue<T>(key: string, value: T) {
      getSharedState(key)?.set(value);
    },
  };
}

export async function loadBrownfieldRuntime(): Promise<BrownfieldRuntime> {
  if (runtimePromise) {
    return runtimePromise;
  }

  runtimePromise = Promise.resolve(createNativeRuntime() ?? previewRuntime);

  return runtimePromise;
}
