# codealike chrome plugin

This plugin is used to track the developers time spent on browser while developing an application.

## Privacy

Extension does not share collected data from the user. It stores data locally on the user's machine.

- Data is stored in the browser's storage. ([chrome.storage](https://developer.chrome.com/docs/apps/manifest/storage/), [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API))])
- Data is not sent to any server.
- Data is only used to display the activity on the website.
- Data is not shared with any third party.

## Features

- Tracks activity on websites as well as local files (PDFs).
- Supports activity tracking on audible websites with idle behavior (like Youtube, Netflix, Spotify, Discord) without extra permissions
- Displays total activity on every website on a specific date or week with a second precision.
- Minute by minute activity timeline for a specific website or all websites on a specific date or week.
- Overall activity heat calendar
- Graph of top 5 active websites.
- Compares daily activity with current week average.

### Installing from source

- Clone the repository
- Run `npm install`
- Run `npm run build`
- Go to `chrome://extensions/`
- Enable developer mode
- Click on `Load unpacked` and select the `dist` folder

## Development

Install [nvm](https://github.com/nvm-sh/nvm)

Clone the repository and run the following commands:

```bash
nvm use
npm install
npm start
```

Build production version

```bash
npm run build
```

## Testing

```bash
npm run test
```

## License

GPL3
