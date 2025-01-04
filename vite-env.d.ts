import { Dispatch, SetStateAction } from "react";
import { type OuterbaseIpc } from "./electron/preload";
declare global {
  type Maybe<T> = T | null | undefined;

  type DispatchState<T> = Dispatch<SetStateAction<T>>;
  interface Window {
    outerbaseIpc: OuterbaseIpc;
  }

  namespace NodeJS {
    interface ProcessEnv {
      /**
       * The built directory structure
       *
       * ```tree
       * ├─┬─┬ dist
       * │ │ └── index.html
       * │ │
       * │ ├─┬ dist-electron
       * │ │ ├── main.js
       * │ │ └── preload.js
       * │
       * ```
       */
      APP_ROOT: string;
      /** /dist/ or /public/ */
      VITE_PUBLIC: string;
    }
  }
}
