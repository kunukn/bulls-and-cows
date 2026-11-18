import "i18next";
import type en from "./locales/en.json";

/*
 * Type-checks every t("…") key against en.json. Module augmentation must use
 * `interface` (the project otherwise prefers `type`).
 */
declare module "i18next" {
  interface CustomTypeOptions {
    resources: { translation: typeof en };
  }
}
