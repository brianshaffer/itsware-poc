import { ItsWareDevice } from './types/itsware'

// Check if we're on the OAuth success page
if (window.location.pathname === '/extension-auth-success') {
  console.log('On OAuth2 success page')

  // Get the authorization code from URL params
  const urlParams = new URLSearchParams(window.location.search)
  const code = urlParams.get('code')

  if (code) {
    console.log('Authorization code found, sending to background script')
    // Send the code to the background script
    chrome.runtime.sendMessage(
      { type: 'OAUTH_CODE_RECEIVED', code },
      (response) => {
        console.log('Response from background script:', response)
      }
    )
  }
} else if (window.location.hostname === 'oauth2.itsware.com') {
  // Check if we're on the initial oAuth page (with required URL parameters)
  const urlParams = new URLSearchParams(window.location.search)
  const redirectUri = urlParams.get('redirect_uri')

  if (redirectUri) {
    console.log('On ItsWare OAuth page')
    // Inject fake auth form for POC
    injectOAuthForm(redirectUri)
  }
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

// ClickUp task page handler
function handleClickUpTaskPage() {
  const taskPattern = /^https:\/\/app\.clickup\.com\/t\/\w+$/
  if (taskPattern.test(window.location.href)) {
    console.log('On ClickUp task page')
    injectStyles()

    // Use MutationObserver to wait for hero section
    const observer = new MutationObserver((mutations, obs) => {
      const heroSection = document.querySelector('.cu-task-hero-section')
      if (heroSection && !document.getElementById('itsware-clickup-embed')) {
        injectItsWareEmbed()
        obs.disconnect() // Stop observing once we've injected
      }
    })

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }
}

function injectStyles() {
  if (document.getElementById('itsware-clickup-styles')) return

  const link = document.createElement('link')
  link.id = 'itsware-clickup-styles'
  link.rel = 'stylesheet'
  link.type = 'text/css'
  link.href = chrome.runtime.getURL('styles/clickup.css')
  document.head.appendChild(link)
}

async function injectItsWareEmbed() {
  if (document.getElementById('itsware-clickup-embed')) return

  const heroSection = document.querySelector('.cu-task-hero-section')
  if (heroSection) {
    const embedDiv = document.createElement('div')
    embedDiv.id = 'itsware-clickup-embed'

    // Check auth status and get devices
    const [authResponse, { itsWareDevices }] = await Promise.all([
      chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }),
      chrome.storage.local.get('itsWareDevices'),
    ])

    embedDiv.innerHTML = `
      <div class="itsware-clickup-container">
        <div class="itsware-clickup-header">
          <img 
            src="${chrome.runtime.getURL('img/itsware-logo-only.svg')}" 
            alt="ItsWare"
            class="itsware-clickup-logo"
          />
          <span class="itsware-clickup-title">
            ItsWare Devices
          </span>
        </div>

        <div class="itsware-clickup-content">
          <div class="itsware-clickup-content-wrapper">
            ${
              authResponse.isAuthenticated
                ? `
              <div class="itsware-clickup-devices">
                <div class="itsware-clickup-attach-wrapper">
                  <button class="itsware-clickup-attach-button">+ Attach a device</button>
                  <div id="itsware-device-list" class="itsware-clickup-device-list" style="display: none;">
                    <div class="itsware-clickup-device-list-header">
                      <h3>Available Devices</h3>
                      <button class="itsware-clickup-close-button">×</button>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Search devices..."
                      class="itsware-clickup-device-search"
                    />
                    <ul class="itsware-clickup-device-list-items">
                      ${itsWareDevices
                        ?.map(
                          (device: ItsWareDevice) => `
                        <li class="itsware-clickup-device-item">
                          <div>
                            <strong>${device.device}</strong>
                            <span>${device.cabinet}</span>
                          </div>
                          <button class="itsware-clickup-attach-device" data-device-id="${device.id}">
                            Attach
                          </button>
                        </li>
                      `
                        )
                        .join('')}
                    </ul>
                  </div>
                </div>
              </div>
            `
                : `
              <div>
                <a 
                  href="https://oauth2.itsware.com/?client_id=CHROMEEXTENSION&redirect_uri=https:%2F%2Fitsware.com%2Fextension-auth-success&response_type=code&scope=read&state=12345"
                  class="itsware-clickup-signin"
                >
                  Sign In to ItsWare
                </a>
              </div>
            `
            }
          </div>
        </div>
      </div>
    `

    // Add event listeners if authenticated
    if (authResponse.isAuthenticated) {
      const deviceList = embedDiv.querySelector('#itsware-device-list')
      const attachButton = embedDiv.querySelector(
        '.itsware-clickup-attach-button'
      )
      const closeButton = embedDiv.querySelector(
        '.itsware-clickup-close-button'
      )
      const searchInput = embedDiv.querySelector(
        '.itsware-clickup-device-search'
      )

      attachButton?.addEventListener('click', () => {
        deviceList?.setAttribute('style', 'display: block;')
      })

      searchInput?.addEventListener('input', (e) => {
        const search = (e.target as HTMLInputElement).value.toLowerCase()
        const items = embedDiv.querySelectorAll('.itsware-clickup-device-item')

        items.forEach((item) => {
          const deviceName =
            item.querySelector('strong')?.textContent?.toLowerCase() || ''
          ;(item as HTMLElement).style.display = deviceName.includes(search)
            ? 'flex'
            : 'none'
        })
      })

      closeButton?.addEventListener('click', () => {
        deviceList?.setAttribute('style', 'display: none;')
      })

      // Handle attach device clicks
      embedDiv
        .querySelectorAll('.itsware-clickup-attach-device')
        .forEach((button) => {
          button.addEventListener('click', (e) => {
            const deviceId = (e.currentTarget as HTMLButtonElement).dataset
              .deviceId
            console.log('Attaching device:', deviceId)
            deviceList?.setAttribute('style', 'display: none;')
            // TODO: Handle device attachment
          })
        })
    }

    heroSection.parentNode?.insertBefore(embedDiv, heroSection.nextSibling)
    console.log('ItsWare embed injected')
  }
}

// Initial check
handleClickUpTaskPage()

// Listen for URL changes only
let lastUrl = window.location.href
const urlObserver = new MutationObserver(() => {
  if (lastUrl !== window.location.href) {
    lastUrl = window.location.href
    handleClickUpTaskPage()
  }
})

// Observe the document body for URL changes
urlObserver.observe(document.body, {
  childList: true,
  subtree: true,
})
