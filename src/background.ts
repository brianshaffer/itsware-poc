// Listen for messages from content and popup scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OAUTH_CODE_RECEIVED') {
    handleAuthCode(message.code, sender.tab?.id)
    sendResponse({ status: 'received' })
  } else if (message.type === 'CHECK_AUTH') {
    checkAuth().then(sendResponse)
    return true
  } else if (message.type === 'ATTACH_DEVICE') {
    handleDeviceAttachment(message.deviceId, message.taskUrl).then(sendResponse)
    return true
  }
  return true // Keep channel open for async response
})

// oAuth Step 1
async function handleAuthCode(code: string, tabId?: number) {
  try {
    console.log('Received auth code:', code)

    // Query ItsWare oAuth endpoint to get authToken and refreshToken
    const tokens = await exchangeCodeForTokens(code)
    await storeTokens(tokens)

    // Get and store devices after successful auth
    const devices = await fetchItsWareDevices()
    await chrome.storage.local.set({ itsWareDevices: devices })

    // Redirect to ClickUp
    if (tabId) {
      chrome.tabs.update(tabId, { url: 'https://app.clickup.com' })
    }
  } catch (error) {
    console.error('Error handling auth code:', error)
  }
}

// oAuth Step 2
async function exchangeCodeForTokens(code: string) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return {
    itsWareAuthToken: 'itsware_demo_auth_token_12345',
    itsWareRefreshToken: 'itsware_demo_refresh_token_12345',
  }
}

async function storeTokens(tokens: {
  itsWareAuthToken: string
  itsWareRefreshToken: string
}) {
  await chrome.storage.local.set(tokens)
}

async function checkAuth() {
  const { itsWareAuthToken } = await chrome.storage.local.get(
    'itsWareAuthToken'
  )
  return { isAuthenticated: !!itsWareAuthToken, authToken: itsWareAuthToken }
}

// Simulate API call fetching Devices for this client
async function fetchItsWareDevices() {
  await new Promise((resolve) => setTimeout(resolve, 300))

  return [
    {
      id: 1,
      device: 'Dell G5 SE',
      cabinet: 'Secondary Cabinet',
      date: '11/20/2024',
    },
    {
      id: 2,
      device: 'iPad Pro M4',
      cabinet: 'Main Cabinet',
      date: '12/04/2024',
    },
    {
      id: 3,
      device: 'Lenovo Windows 11',
      cabinet: 'Secondary Cabinet',
      date: '12/25/2024',
    },
    {
      id: 4,
      device: 'MacBook Pro 2016',
      cabinet: 'Main Cabinet',
      date: '12/29/2024',
    },
    {
      id: 5,
      device: 'Samsung Galaxy s25',
      cabinet: 'Secondary Cabinet',
      date: '01/01/2025',
    },
    {
      id: 6,
      device: 'Surface Pro',
      cabinet: 'Main Cabinet',
      date: '01/02/2025',
    },
    {
      id: 7,
      device: 'Xiaomi Redmi Note 13',
      cabinet: 'Secondary Cabinet',
      date: '05/30/2024',
    },
  ]
}

// Store newly attached devices
async function handleDeviceAttachment(deviceId: number, taskUrl: string) {
  const { itsWareClickUpDevices = {} } = await chrome.storage.local.get(
    'itsWareClickUpDevices'
  )

  if (!itsWareClickUpDevices[taskUrl]) {
    itsWareClickUpDevices[taskUrl] = []
  }

  if (!itsWareClickUpDevices[taskUrl].includes(deviceId)) {
    itsWareClickUpDevices[taskUrl].push(deviceId)
    await chrome.storage.local.set({ itsWareClickUpDevices })
  }

  return { success: true }
}

// TODO: Refresh authToken periodically
