// Store original text content for reset functionality
let originalContent = new Map();
let isTranslated = false;
let translationCache = new Map();

// Notify that content script is loaded
console.log('Translation content script loaded on:', window.location.href);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);
    
    if (request.action === 'translate') {
        translatePage(request.percentage)
            .then(() => {
                sendResponse({success: true, message: 'Translation completed'});
            })
            .catch(error => {
                console.error('Translation error:', error);
                sendResponse({success: false, message: error.message});
            });
    } else if (request.action === 'reset') {
        try {
            resetPage();
            sendResponse({success: true, message: 'Page reset'});
        } catch (error) {
            console.error('Reset error:', error);
            sendResponse({success: false, message: error.message});
        }
    } else {
        sendResponse({success: false, message: 'Unknown action'});
    }
    
    // Important: return true to indicate we'll send response asynchronously
    return true;
});

async function translatePage(percentage) {
    if (isTranslated) {
        resetPage();
    }
    
    // Get all text nodes
    const textNodes = getTextNodes(document.body);
    
    // Show loading indicator
    showLoadingIndicator();
    
    try {
        for (const node of textNodes) {
            const originalText = node.textContent;
            originalContent.set(node, originalText);
            
            const translatedHTML = await translateTextToHTML(originalText, percentage);
            
            // Create a new span element to hold the translated content
            const spanElement = document.createElement('span');
            spanElement.innerHTML = translatedHTML;
            
            // Replace the text node with the span element
            node.parentNode.replaceChild(spanElement, node);
            originalContent.set(spanElement, {originalNode: node, originalText: originalText});
        }
        
        isTranslated = true;
        showTranslationComplete();
    } catch (error) {
        console.error('Translation failed:', error);
        hideLoadingIndicator();
        throw error;
    }
}

function resetPage() {
    originalContent.forEach((data, element) => {
        if (typeof data === 'object' && data.originalNode) {
            // This is a span element we created, restore the original text node
            if (element.parentNode) {
                const textNode = document.createTextNode(data.originalText);
                element.parentNode.replaceChild(textNode, element);
            }
        } else if (element.parentNode) {
            // This is an original text node, just restore its content
            element.textContent = data;
        }
    });
    originalContent.clear();
    isTranslated = false;
    hideLoadingIndicator();
}

function getTextNodes(element) {
    const textNodes = [];
    const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                // Skip script and style elements
                if (node.parentElement.tagName === 'SCRIPT' || 
                    node.parentElement.tagName === 'STYLE' ||
                    node.parentElement.tagName === 'NOSCRIPT') {
                    return NodeFilter.FILTER_REJECT;
                }
                
                // Only include nodes with meaningful text
                if (node.textContent.trim().length > 0) {
                    return NodeFilter.FILTER_ACCEPT;
                }
                
                return NodeFilter.FILTER_REJECT;
            }
        }
    );
    
    let node;
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }
    
    return textNodes;
}

async function translateTextToHTML(text, percentage) {
    // Split text into words while preserving spaces and punctuation
    const words = text.split(/(\s+|[.,!?;:"'()[\]{}])/);
    
    // Filter out only actual words (not spaces or punctuation)
    const actualWords = words.filter(word => /^[a-zA-Z]+$/.test(word));
    
    // Calculate how many words to translate
    const wordsToTranslate = Math.ceil((actualWords.length * percentage) / 100);
    
    if (wordsToTranslate === 0) {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    
    // Randomly select words to translate
    const wordsToTranslateSet = new Set();
    while (wordsToTranslateSet.size < wordsToTranslate && wordsToTranslateSet.size < actualWords.length) {
        const randomIndex = Math.floor(Math.random() * actualWords.length);
        wordsToTranslateSet.add(actualWords[randomIndex].toLowerCase());
    }
    
    // Get unique words that need translation
    const uniqueWordsToTranslate = [...wordsToTranslateSet];
    
    // Translate words in batches using Google Translate
    const translations = await translateWords(uniqueWordsToTranslate);
    
    // Apply translations and wrap them in blue spans
    return words.map(word => {
        if (/^[a-zA-Z]+$/.test(word) && wordsToTranslateSet.has(word.toLowerCase())) {
            const lowerWord = word.toLowerCase();
            const translation = translations[lowerWord];
            
            if (translation) {
                // Preserve original capitalization
                let finalTranslation = translation;
                if (word[0] === word[0].toUpperCase()) {
                    finalTranslation = translation.charAt(0).toUpperCase() + translation.slice(1);
                }
                // Wrap translated word in blue span with tooltip showing original word
                return `<span style="color: #2196F3; font-weight: bold; cursor: help;" title="Original: ${word}">${finalTranslation}</span>`;
            }
        }
        // HTML escape non-translated content to prevent injection
        return word.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }).join('');
}

async function translateWords(words) {
    const translations = {};
    const wordsToTranslate = [];
    
    // Check cache first
    for (const word of words) {
        if (translationCache.has(word)) {
            translations[word] = translationCache.get(word);
        } else {
            wordsToTranslate.push(word);
        }
    }
    
    if (wordsToTranslate.length === 0) {
        return translations;
    }
    
    try {
        // Use Google Translate API (free tier)
        const text = wordsToTranslate.join('\n');
        const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=sv&dt=t&q=${encodeURIComponent(text)}`);
        
        if (!response.ok) {
            throw new Error(`Translation API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Parse Google Translate response
        if (data && data[0]) {
            const translatedText = data[0].map(item => item[0]).join('');
            const translatedWords = translatedText.split('\n');
            
            // Map translations back to original words
            wordsToTranslate.forEach((word, index) => {
                if (translatedWords[index]) {
                    const translation = translatedWords[index].trim().toLowerCase();
                    translations[word] = translation;
                    translationCache.set(word, translation);
                }
            });
        }
    } catch (error) {
        console.error('Translation API error:', error);
        // Fallback: return original words if translation fails
        wordsToTranslate.forEach(word => {
            translations[word] = word;
        });
    }
    
    return translations;
}

function showLoadingIndicator() {
    hideLoadingIndicator(); // Remove existing indicator
    
    const indicator = document.createElement('div');
    indicator.id = 'translation-loading';
    indicator.innerHTML = '🔄 Translating with Google Translate...';
    indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #FF9800;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        animation: pulse 1.5s infinite;
    `;
    
    // Add pulsing animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(indicator);
}

function showTranslationComplete() {
    hideLoadingIndicator();
    
    const indicator = document.createElement('div');
    indicator.id = 'translation-complete';
    indicator.innerHTML = '✅ Translation completed!';
    indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #4CAF50;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10000;
        font-family: Arial, sans-serif;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(indicator);
    
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    }, 3000);
}

function hideLoadingIndicator() {
    const indicators = document.querySelectorAll('#translation-loading, #translation-complete');
    indicators.forEach(indicator => {
        if (indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
        }
    });
}