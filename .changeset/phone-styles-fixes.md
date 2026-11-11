---
'@loidolt/theme-styles': patch
'@loidolt/theme-svelte': patch
'@loidolt/theme-docs': patch
---

Finish the phone pass. Pagination's page numbers wrap in a box of their own between Previous and Next, so a row just too narrow for the whole trail no longer leaves Next on a line by itself. On touch screens the Topbar brand, a DataTable row's checkbox, the rows-per-page and media speed selects, map legend and diagram source summaries, a chip's remove button outside MultiSelect, and the Combobox and PasswordInput buttons all take a 44px press, and a sort header's press fills its header cell instead of reaching into the first row. A Mermaid diagram or a horizontal Filmstrip that scrolls sideways shows a shadow on the side with more to see. At the largest iOS text sizes the page title stops growing at twice its size and the Topbar brand at one and a half times, so a title like "Pagination" stays whole and both leave room on the first screen, while body text keeps scaling. A disabled field keeps its muted text in iOS WebKit. Markdown code blocks without a filename show their language at the left of the copy bar, as CodeSnippet does.
