// Import services
import { handleItsWareAuthCode, checkItsWareAuth } from './services/itsware'
import { clickUpAttachDevice } from './services/clickup'

// Listen for messages from content and popup scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OAUTH_CODE_RECEIVED') {
    handleItsWareAuthCode(message.code, sender.tab?.id)
    sendResponse({ status: 'received' })
  } else if (message.type === 'CHECK_AUTH') {
    checkItsWareAuth().then(sendResponse)
    return true
  } else if (message.type === 'ATTACH_DEVICE') {
    clickUpAttachDevice(message.deviceId, message.taskUrl).then(sendResponse)
    return true
  }
  return true // Keep channel open for async response
})

// TODO: Refresh authToken periodically
