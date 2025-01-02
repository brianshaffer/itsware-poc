import './styles/popup.css'

// Check auth status and update UI accordingly
document.addEventListener('DOMContentLoaded', async () => {
  const response = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' })
  const container = document.querySelector('.auth-container')

  if (container) {
    if (response.isAuthenticated) {
      container.innerHTML = `
        <button
          id="signout-button"
          class="w-full h-[48px] flex shadow-md rounded-md border-[#484B66] border-[1px] border-solid mt-[15%] items-center justify-center text-[#ffffff] text-[14px] pt-[2px]"
          style="background: linear-gradient(180deg, #12142d, #0b0d1a)"
        >
          Sign Out
        </button>
      `

      // Add sign out handler
      const signOutButton = document.getElementById('signout-button')
      signOutButton?.addEventListener('click', async () => {
        await chrome.storage.local.remove([
          'itsWareAuthToken',
          'itsWareRefreshToken',
          'itsWareDevices',
        ])
        window.location.reload()
      })
    } else {
      container.innerHTML = `
        <a
          href="https://oauth2.itsware.com/?client_id=CHROMEEXTENSION&redirect_uri=https:%2F%2Fitsware.com%2Fextension-auth-success&response_type=code&scope=read&state=12345"
          class="w-full h-[48px] flex shadow-md rounded-md border-[#484B66] border-[1px] border-solid mt-[15%] items-center justify-center text-[#ffffff] text-[14px] pt-[2px]"
          style="background: linear-gradient(180deg, #12142d, #0b0d1a)"
        >
          Sign In
        </a>
      `

      // Add click handler for the sign in link
      const link = container.querySelector('a')
      if (link) {
        link.addEventListener('click', (event) => {
          event.preventDefault()
          const url = link.getAttribute('href') || ''
          chrome.tabs.create({ url })
        })
      }
    }
  }
})
