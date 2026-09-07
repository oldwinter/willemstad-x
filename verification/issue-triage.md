# Open-Issue Review and Delivery

Reviewed all 14 open upstream issues on 2026-09-07/08 against `a8bd0eb`.
Seven new pull requests and one update to the existing PR are submitted for
upstream review. No upstream merge or issue closure was performed.

| Issue | Finding and contribution | Verification limit |
| --- | --- | --- |
| [#17](https://github.com/tingmelvin/willemstad-x/issues/17) | [PR #89](https://github.com/tingmelvin/willemstad-x/pull/89): Simplified and Traditional Chinese titles/descriptions | Actual Windows app; section names/dropdown labels are outside the plugin's localization contract |
| [#50](https://github.com/tingmelvin/willemstad-x/issues/50) | Upstream #80/#81 already migrate the current theme; [PR #82](https://github.com/tingmelvin/willemstad-x/pull/82) completes compatibility callout distributions | Tested against Obsidian 1.13.7, not a deployed Publish site or older RGB-channel clients |
| [#57](https://github.com/tingmelvin/willemstad-x/issues/57) | [PR #86](https://github.com/tingmelvin/willemstad-x/pull/86): remaining callout/media/text/note-embed width controls | Actual Windows app and Style Settings; third-party replacement renderers not tested |
| [#60](https://github.com/tingmelvin/willemstad-x/issues/60) | Reporter confirmed reinstalling Style Settings resolves their symptoms; [PR #88](https://github.com/tingmelvin/willemstad-x/pull/88) documents backup/recovery | Upstream plugin startup defect is not fixed by this theme contribution and was not reproduced |
| [#61](https://github.com/tingmelvin/willemstad-x/issues/61) | Not reproduced in WebKit 18.4 or 26.6; all six heading/link colours match expected contrast | Native iOS and reporter's exact OS/configuration remain unavailable; no speculative CSS change |
| [#66](https://github.com/tingmelvin/willemstad-x/issues/66) | [PR #83](https://github.com/tingmelvin/willemstad-x/pull/83): correct frosted mini-bar colours with sidebar-colour opt-in | Real Windows renderer plus Chromium/WebKit fixtures |
| [#67](https://github.com/tingmelvin/willemstad-x/issues/67) | [PR #88](https://github.com/tingmelvin/willemstad-x/pull/88): cross-colour, focus, PDF and recovery guides | Repository documentation submitted; separate documentation website not deployed; unreleased ebook controls not invented |
| [#69](https://github.com/tingmelvin/willemstad-x/issues/69) | [PR #85](https://github.com/tingmelvin/willemstad-x/pull/85): composable `no-icon` metadata and Cornell token matching | All three public CSS files tested in the real Windows renderer; print-class checks are not PDF exports |
| [#71](https://github.com/tingmelvin/willemstad-x/issues/71) | [PR #82](https://github.com/tingmelvin/willemstad-x/pull/82): bound left-anchored highlighting without horizontal overflow | Earlier PR overflow reproduced and fixed; original first-Home failure not reproduced on 1.13.7 Windows |
| [#72](https://github.com/tingmelvin/willemstad-x/issues/72) | Same ALH correction and measured geometry as #71 in [PR #82](https://github.com/tingmelvin/willemstad-x/pull/82) | Native macOS Cmd+Left not tested |
| [#74](https://github.com/tingmelvin/willemstad-x/issues/74) | [PR #87](https://github.com/tingmelvin/willemstad-x/pull/87): remove forced CSS smooth scrolling | Real Scroll to Top 2.1.6: 1/8 before, 8/8 after with smooth scrolling enabled; default Windows also tested |
| [#76](https://github.com/tingmelvin/willemstad-x/issues/76) | Not reproduced with exact Obsidian 1.12.4 CSS or real Obsidian 1.13.7; current theme already includes a 16px sizing rule | The 1.12.4 check is a CSS fixture, not that application binary; reporter's exact state remains unresolved |
| [#78](https://github.com/tingmelvin/willemstad-x/issues/78) | [PR #87](https://github.com/tingmelvin/willemstad-x/pull/87): restore native outline positioning | Real app with smooth scrolling enabled: 8/24 targets visible before, 24/24 after, measured after scrolling settled |
| [#79](https://github.com/tingmelvin/willemstad-x/issues/79) | [PR #84](https://github.com/tingmelvin/willemstad-x/pull/84): palette-aware translucent UI tint | 72 renderer cases; macOS body classes on Windows establish CSS behavior, not native vibrancy/compositing |

## Unresolved Reproduction Needs

- #61 requires the affected iOS/Obsidian versions and a minimal Style Settings
  configuration on an actual affected device.
- #76 requires an affected runtime/theme configuration or a minimal reproduction
  that still fails with the current theme. The existing sizing rule predates the
  report, so its presence does not establish the cause of the reporter's screenshot.
- #60 is an upstream Style Settings issue. The documented successful workaround
  is not a theme-level fix for every startup failure.
- Native macOS confirmation remains needed for #72 and the OS-composited result
  of #79. A deployed Publish renderer was not exercised for #50.

See [detailed UI reproduction notes](ui/triage-61-76-79.md) and the linked PRs for
measured results and before/after screenshots. A submitted PR is a proposed
upstream change, not a claim that the issue is already closed or merged.
