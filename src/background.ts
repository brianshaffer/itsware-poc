// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OAUTH_CODE_RECEIVED') {
    handleAuthCode(message.code)
    sendResponse({ status: 'received' })
  }
  return true // Keep the message channel open for async response
})

async function handleAuthCode(code: string) {
  try {
    console.log('Received auth code:', code)
    // TODO: Exchange code for tokens
    // const tokens = await exchangeCodeForTokens(code)
    // await storeTokens(tokens)
  } catch (error) {
    console.error('Error handling auth code:', error)
  }
}
