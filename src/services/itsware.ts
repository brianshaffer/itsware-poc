export function initItsWareOAuth() {
  // Detect initial oAuth2 login page
  if (window.location.hostname == 'oauth2.itsware.com') {
    const urlParams = new URLSearchParams(window.location.search)
    const redirectUri = urlParams.get('redirect_uri')

    if (redirectUri) {
      console.log('On ItsWare OAuth page')
      injectOAuthForm(redirectUri)
    }
    // Detect oAuth success page with authorization code
  } else if (window.location.pathname == '/extension-auth-success') {
    console.log('On OAuth2 success page')
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')

    if (code) {
      console.log('Authorization code found, sending to background script')
      chrome.runtime.sendMessage(
        { type: 'OAUTH_CODE_RECEIVED', code },
        (response) => {
          console.log('Response from background script:', response)
        }
      )
    }
  }
}

// oAuth Step 1
export async function handleItsWareAuthCode(code: string, tabId?: number) {
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

export async function checkItsWareAuth() {
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

function injectOAuthForm(redirectUri: string) {
  const formDiv = document.createElement('div')
  formDiv.style.cssText = `
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 9, 19, 0.95);
  `

  formDiv.innerHTML = `
    <div style="
      background-color: #12142d;
      padding: 32px;
      border-radius: 8px;
      box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
      width: 400px;
      border: 1px solid #484B66;
    ">
      <h1 style="
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 24px;
        color: white;
        text-align: center;
      ">Demo OAuth</h1>
      <form id="demo-oauth-form" style="display: flex; flex-direction: column; gap: 16px;">
        <div style="width: 100%;">
          <input type="email" placeholder="Email" disabled="" value="demo@itsware.com" style="
            width: 100%;
            padding-inline: 8px;
            padding-block: 8px;
            border-radius: 4px;
            background-color: #1a1d3d;
            color: #9ca3af;
            border: 1px solid #484B66;
            box-sizing: border-box;
          ">
        </div>
        <div style="width: 100%;">
          <input type="password" placeholder="Password" disabled="" value="••••••••" style="
            width: 100%;
            padding-inline: 8px;
            padding-block: 8px;
            border-radius: 4px;
            background-color: #1a1d3d;
            color: #9ca3af;
            border: 1px solid #484B66;
            box-sizing: border-box;
          ">
        </div>
        <button type="submit" style="
          width: 100%; 
          margin: 0px; 
          padding: 8px 24px; 
          background: linear-gradient(rgb(18, 20, 45), rgb(11, 13, 26)); 
          color: white; 
          border-radius: 4px; 
          box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 6px -1px; 
          border: 1px solid rgb(72, 75, 102); 
          cursor: pointer; 
          opacity: 1;" 
          onmouseover="this.style.opacity='0.9'" 
          onmouseout="this.style.opacity='1'">
          Bypass With Fake Tokens
        </button>
      </form>
    </div>
  `
  document.body.appendChild(formDiv)

  // Add form submit handler
  const form = document.getElementById('demo-oauth-form')
  form?.addEventListener('submit', (e) => {
    e.preventDefault()
    const code = 'itswareoauthdemoauthorizationcode12345'
    const finalUrl = new URL(decodeURIComponent(redirectUri))
    finalUrl.searchParams.append('code', code)
    window.location.href = finalUrl.toString()
  })
}
