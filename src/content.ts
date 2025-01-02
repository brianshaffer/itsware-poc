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
}
