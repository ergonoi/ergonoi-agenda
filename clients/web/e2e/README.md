# Browser tests

Tests of the web client in Chrome: against a local service with an empty data directory
(accounts, PIN, list), and against the click dummy (views, phone layout, three columns,
overlays).

```
cd clients/web/e2e
npm install            # puppeteer-core only; Chrome is not downloaded
node run.mjs           # all tests
node run.mjs phone pin # only files whose names contain one of the words
```

Needs Go (the service is built from the working tree into the temp directory), Python 3
(client and click dummy are rebuilt before the run) and Chrome or Chromium
(`CHROME=/path/to/chrome`, default `/usr/bin/google-chrome`). Each file is one area; it
prints `PASS` or `FAIL` per check, and the run ends with exit code 1 if anything failed.
