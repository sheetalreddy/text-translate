# English to Swedish Translator 🇸🇪

A Chrome extension that translates a customizable percentage of English words to Swedish on any webpage using Google Translate API. Perfect for language learners who want to practice reading Swedish while maintaining context in English.

## Features

- **Partial Translation**: Choose what percentage of words to translate (0-100%)
- **Smart Word Selection**: Randomly selects meaningful words while preserving sentence structure
- **Visual Indicators**: Translated words are highlighted in blue with tooltips showing original text
- **Instant Reset**: Quickly restore the original page content
- **Persistent Settings**: Your preferred translation percentage is remembered
- **Real-time Feedback**: Loading indicators and completion notifications
- **Translation Caching**: Improves performance by caching previously translated words

## Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. The extension icon should appear in your Chrome toolbar

### Required Files

Make sure your extension folder contains:
- `manifest.json`
- `content.js`
- `popup.html`
- `popup.js`
- Icon files: `icon16.png`, `icon48.png`, `icon128.png`

## Usage

1. **Navigate to any webpage** with English content
2. **Click the extension icon** in your Chrome toolbar
3. **Adjust the translation percentage** using the slider (default: 25%)
4. **Click "Translate Page"** to start the translation
5. **Hover over blue words** to see the original English text
6. **Click "Reset Page"** to restore the original content

### Translation Percentage Guide

- **10-25%**: Light translation, good for beginners
- **25-50%**: Moderate translation, intermediate level
- **50-75%**: Heavy translation, advanced learners
- **75-100%**: Maximum translation, near-native level

## How It Works

1. **Text Analysis**: Scans the webpage for text nodes, excluding scripts and styles
2. **Word Selection**: Randomly selects the specified percentage of English words
3. **API Translation**: Uses Google Translate's free API to translate selected words to Swedish
4. **Visual Enhancement**: Wraps translated words in styled spans with tooltips
5. **Caching**: Stores translations to improve performance on repeated words

## Technical Details

### Permissions

- `activeTab`: Access to the current webpage content
- `storage`: Save user preferences
- `https://translate.googleapis.com/*`: Access to Google Translate API

### Architecture

- **Manifest V3**: Uses the latest Chrome extension format
- **Content Script**: Handles webpage manipulation and translation logic
- **Popup Interface**: Provides user controls and settings
- **Background-free**: No background script needed, improving performance

### Translation API

Uses Google Translate's unofficial API endpoint:
```
https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=sv
```

## Supported Features

- ✅ Text node detection and replacement
- ✅ HTML escaping for security
- ✅ Capitalization preservation
- ✅ Punctuation and spacing preservation
- ✅ Translation caching
- ✅ Error handling and fallbacks
- ✅ Loading states and user feedback

## Browser Compatibility

- Chrome 88+ (Manifest V3 support required)
- Chromium-based browsers (Edge, Brave, etc.)

## Limitations

- Uses Google Translate's free tier (rate limits may apply)
- Requires internet connection for translations
- Only translates English to Swedish
- May not work on pages with heavy JavaScript manipulation

## Privacy

- No data is collected or stored externally
- Translations are cached locally in the browser
- Only sends individual words to Google Translate API
- No tracking or analytics

## Development

### File Structure
```
extension/
├── manifest.json       # Extension configuration
├── content.js         # Main translation logic
├── popup.html         # User interface
├── popup.js          # UI event handling
└── icons/            # Extension icons
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### Key Functions

- `translatePage()`: Main translation orchestrator
- `getTextNodes()`: Extracts translatable text from DOM
- `translateTextToHTML()`: Processes and translates word selection
- `translateWords()`: Handles API communication and caching

## Troubleshooting

### Common Issues

**"Content script not loaded" error**
- Refresh the webpage and try again
- Make sure the extension is enabled

**Translation not working**
- Check your internet connection
- Google Translate API may be temporarily unavailable

**Some words not translating**
- The extension only translates alphabetic words
- Numbers, symbols, and very short words are skipped

### Debug Mode

Open Chrome DevTools (F12) and check the console for detailed error messages.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on various websites
5. Submit a pull request

## License

This project is open source. Please respect Google Translate's terms of service when using their API.

## Version History

### v1.0
- Initial release
- Basic English to Swedish translation
- Percentage-based word selection
- Visual highlighting and tooltips
- Settings persistence