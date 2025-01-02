// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OAUTH_CODE_RECEIVED') {
    handleAuthCode(message.code, sender.tab?.id)
    sendResponse({ status: 'received' })
  } else if (message.type === 'CHECK_AUTH') {
    checkAuth().then(sendResponse)
    return true // Keep channel open for async response
  }
  return true
})

async function handleAuthCode(code: string, tabId?: number) {
  try {
    console.log('Received auth code:', code)
    const tokens = await exchangeCodeForTokens(code)
    await storeTokens(tokens)

    // Redirect to ClickUp if we have the tab ID
    if (tabId) {
      chrome.tabs.update(tabId, { url: 'https://app.clickup.com' })
    }
  } catch (error) {
    console.error('Error handling auth code:', error)
  }
}

async function exchangeCodeForTokens(code: string) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    authToken: 'itsware_demo_auth_token_12345',
    refreshToken: 'itsware_demo_refresh_token_12345',
  }
}

async function storeTokens(tokens: {
  authToken: string
  refreshToken: string
}) {
  await chrome.storage.local.set(tokens)
}

async function checkAuth() {
  const { authToken } = await chrome.storage.local.get('authToken')
  return { isAuthenticated: !!authToken, authToken }
}
