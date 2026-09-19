# i18n language pack checker

The existing static pages and inline dictionaries have not been migrated to JSON language packs. No languages or translations are added by this utility. CI explicitly reports that checks are not run until a locales directory exists.

Put the English reference in locales/en.json and actual translations in locales/<language>.json. Run npm run i18n:check or npm run i18n:check:ci. No dependency installation is required; use Node 22+. check-i18n.ts is the source, and check-i18n.mjs is its runnable JavaScript copy. Keep both in sync.

--json prints a JSON report. --fix adds missing keys with [TODO] prefixes; it does not translate them. CI fails on missing, empty or TODO values. Extra and equal-to-English values are review warnings. Completion measures nonempty non-TODO key coverage, not translation quality. Unsupported value types and ambiguous key structures fail instead of being silently discarded. Fixes preserve existing values and stop on structural conflicts; use version control to review any edits.

Do not copy the sample package.json over other packages. This root package only adds checker commands; existing subprojects are unchanged. CI failures do not enforce merge protection unless repository branch rules require this workflow.
