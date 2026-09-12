# Interface and prompt languages

Settings offers **Deutsch** and **English**. Switching changes the interface
immediately and saves `AppSettings.locale` through the existing V2 storage
adapter. Older settings without a locale default to German. If storage is
unavailable, the choice applies to the current session and a notice explains it.

The interface language sets the initial prompt language when opening Output.
Output has its own language selector: changing it does not change the interface.
The deterministic prompt engine already supplies German and English rules.
Custom descriptions, profile names, tags, and existing saved values are not
automatically translated. Write custom prose in the desired output language.
Selecting a built-in text preset explicitly inserts the current interface's
translation; opening a draft or switching languages never rewrites its answers.
Both languages of a known preset are recognized when resuming a draft.

`src/i18n/messages.ts` contains the reviewed English translations, keyed by the
German source messages. `MessageKey` makes explicit `t()` calls type-safe.
`LocaleProvider` derives its locale from Settings; there is no global mutable
locale, DOM replacement, remote translation service, or new storage namespace.
Use `t(key, ...values)` for UI messages and `tx(catalogLabel)` only at display
boundaries for existing labels and structured diagnostics. Interpolated user
values are preserved. Unknown diagnostics fall back verbatim; missing static
keys are compile errors and also warn during development if type checks are
bypassed. Do not pass user content or generated prompt prose through `tx()`.

Dates and numbers use `Intl` with `de-DE` or `en-GB`; the document `lang` and
page title follow the interface language. Add translations and user-behavior
tests whenever introducing UI copy. V2 schema/export versions, application
identifier, profile IDs, enum values, and storage keys remain stable.
