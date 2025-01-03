import { ItsWareDevice } from '../types/itsware'

export function initClickUp() {
  // Initial detection if on ClickUp Task URL
  handleClickUpTaskPage()

  // Add listener for ClickUp URL and changes (since ClickUp is a PWA without full page reloads)
  let lastUrl = window.location.href
  const urlObserver = new MutationObserver(() => {
    if (lastUrl !== window.location.href) {
      lastUrl = window.location.href
      handleClickUpTaskPage()
    }
  })

  // Create observer for document body and URL changes
  urlObserver.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

function handleClickUpTaskPage() {
  const taskPattern = /^https:\/\/app\.clickup\.com\/t\/\w+$/
  if (!taskPattern.test(window.location.href)) return

  console.log('On ClickUp task page')
  injectItsWareStyles()

  // Declare MutationObserver to wait for hero section before creating ItsWare embedding
  const observer = new MutationObserver((mutations, obs) => {
    const heroSection = document.querySelector('.cu-task-hero-section')
    if (heroSection && !document.getElementById('itsware-clickup-embed')) {
      injectItsWareEmbed()
      obs.disconnect() // Stop observing once we've injected
    }
  })

  // Create observer for Hero Section
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })
}

function injectItsWareStyles() {
  if (document.getElementById('itsware-clickup-styles')) return

  const link = document.createElement('link')
  link.id = 'itsware-clickup-styles'
  link.rel = 'stylesheet'
  link.type = 'text/css'
  link.href = chrome.runtime.getURL('styles/clickup.css')
  document.head.appendChild(link)
}

async function injectItsWareEmbed() {
  // only add embedding if doesn't already exist
  if (document.getElementById('itsware-clickup-embed')) return

  // ensure ClickUp page has been sufficiently rendered
  const heroSection = document.querySelector('.cu-task-hero-section')
  if (heroSection) {
    // create embedding element
    const embedDiv = document.createElement('div')
    embedDiv.id = 'itsware-clickup-embed'

    // check authentication and get devices
    const taskUrl = window.location.href
    const [authResponse, storage] = await Promise.all([
      chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }),
      chrome.storage.local.get(['itsWareDevices', 'clickUpAttachedDevices']),
    ])

    // sort devices to filter out already attached ones
    const { itsWareDevices = [], clickUpAttachedDevices = {} } = storage
    const attachedDeviceIds = clickUpAttachedDevices[taskUrl] || []
    const availableDevices = itsWareDevices.filter(
      (d: ItsWareDevice) => !attachedDeviceIds.includes(d.id)
    )

    // create embedding inner html
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
              <div class="itsware-clickup-devices"></div>
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
                    ${availableDevices
                      .map(
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

    if (authResponse.isAuthenticated) {
      const devicesContainer = embedDiv.querySelector(
        '.itsware-clickup-devices'
      )
      if (devicesContainer) {
        const { itsWareDevices, attachedDeviceIds } =
          await renderAttachedDevices(devicesContainer, taskUrl)

        // Update device attachment handler
        embedDiv
          .querySelectorAll('.itsware-clickup-attach-device')
          .forEach((button) => {
            button.addEventListener('click', async (e) => {
              const deviceId = Number(
                (e.currentTarget as HTMLButtonElement).dataset.deviceId
              )
              const deviceList = embedDiv.querySelector('#itsware-device-list')
              const deviceItem = (e.currentTarget as HTMLElement).closest(
                '.itsware-clickup-device-item'
              )

              await chrome.runtime.sendMessage({
                type: 'ATTACH_DEVICE',
                deviceId,
                taskUrl,
              })

              // Re-render attached devices
              await renderAttachedDevices(devicesContainer, taskUrl)

              // Remove from available list and hide
              deviceItem?.remove()
              if (deviceList) {
                deviceList.setAttribute('style', 'display: none;')

                // Check if list is empty
                const remainingDevices = deviceList.querySelectorAll(
                  '.itsware-clickup-device-item'
                )
                if (remainingDevices?.length === 0) {
                  const listContainer = deviceList.querySelector(
                    '.itsware-clickup-device-list-items'
                  )
                  if (listContainer) {
                    listContainer.innerHTML = `
                    <li class="itsware-clickup-device-item" style="justify-content: center; color: #838383;">
                      No more devices available
                    </li>
                  `
                  }
                }
              }
            })
          })

        // Add button click handlers
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

        // Show device list
        attachButton?.addEventListener('click', () => {
          deviceList?.setAttribute('style', 'display: block;')
        })

        // Close device list
        closeButton?.addEventListener('click', () => {
          deviceList?.setAttribute('style', 'display: none;')
        })

        // Handle search filtering
        searchInput?.addEventListener('input', (e) => {
          const search = (e.target as HTMLInputElement).value.toLowerCase()
          const items = embedDiv.querySelectorAll(
            '.itsware-clickup-device-item'
          )

          items.forEach((item) => {
            const deviceName =
              item.querySelector('strong')?.textContent?.toLowerCase() || ''
            ;(item as HTMLElement).style.display = deviceName.includes(search)
              ? 'flex'
              : 'none'
          })
        })
      }
    }

    heroSection.parentNode?.insertBefore(embedDiv, heroSection.nextSibling)
    console.log('ItsWare embed injected')
  }
}

async function renderAttachedDevices(container: Element, taskUrl: string) {
  const { itsWareDevices = [], clickUpAttachedDevices = {} } =
    await chrome.storage.local.get(['itsWareDevices', 'clickUpAttachedDevices'])

  const attachedDeviceIds = clickUpAttachedDevices[taskUrl] || []
  const attachedDevices = itsWareDevices.filter((d: ItsWareDevice) =>
    attachedDeviceIds.includes(d.id)
  )

  container.innerHTML = attachedDevices.length
    ? attachedDevices
        .map(
          (device: ItsWareDevice) => `
          <div class="itsware-clickup-attached-device">
            <strong>${device.device}</strong>
            <div class="itsware-clickup-device-details">
              <span>${device.cabinet}</span>
              <span>${device.date}</span>
            </div>
          </div>
        `
        )
        .join('')
    : `<div class="itsware-clickup-no-devices">No attached devices</div>`

  return { itsWareDevices, attachedDeviceIds }
}

// Store newly attached devices
export async function clickUpAttachDevice(deviceId: number, taskUrl: string) {
  const { clickUpAttachedDevices = {} } = await chrome.storage.local.get(
    'clickUpAttachedDevices'
  )

  if (!clickUpAttachedDevices[taskUrl]) {
    clickUpAttachedDevices[taskUrl] = []
  }

  if (!clickUpAttachedDevices[taskUrl].includes(deviceId)) {
    clickUpAttachedDevices[taskUrl].push(deviceId)
    await chrome.storage.local.set({ clickUpAttachedDevices })
  }

  return { success: true }
}
